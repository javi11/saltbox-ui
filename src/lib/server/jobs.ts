import { StringDecoder } from 'node:string_decoder';
import { invalidate } from './cache';
import { randomUUID } from 'node:crypto';
import { hostSpawn } from './host-exec';

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

export interface Job {
	id: string;
	command: string;
	args: string[];
	status: 'running' | 'completed' | 'failed';
	output: string[];
	startedAt: string;
	finishedAt?: string;
	exitCode?: number;
	resource?: string;
}

const jobs = new Map<string, Job>();

// Event listener system for SSE streaming
type OutputCallback = (lines: string[]) => void;
type DoneCallback = (job: Job) => void;

const outputListeners = new Map<string, Set<OutputCallback>>();
const doneListeners = new Map<string, Set<DoneCallback>>();

export function onJobOutput(id: string, cb: OutputCallback): void {
	if (!outputListeners.has(id)) outputListeners.set(id, new Set());
	outputListeners.get(id)!.add(cb);
}

export function offJobOutput(id: string, cb: OutputCallback): void {
	outputListeners.get(id)?.delete(cb);
}

export function onJobDone(id: string, cb: DoneCallback): void {
	if (!doneListeners.has(id)) doneListeners.set(id, new Set());
	doneListeners.get(id)!.add(cb);
}

export function offJobDone(id: string, cb: DoneCallback): void {
	doneListeners.get(id)?.delete(cb);
}

function notifyOutput(id: string, lines: string[]): void {
	outputListeners.get(id)?.forEach((cb) => cb(lines));
}

function notifyDone(job: Job): void {
	doneListeners.get(job.id)?.forEach((cb) => cb(job));
	// Cleanup listeners after job completes
	outputListeners.delete(job.id);
	doneListeners.delete(job.id);
}

export function getJobs(): Job[] {
	return Array.from(jobs.values()).sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
	);
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
}

export function startJob(command: string, args: string[], options?: { tty?: boolean; resource?: string }): Job {
	const existing = getJobs().find((job) => job.status === 'running' &&
		job.command === command && JSON.stringify(job.args) === JSON.stringify(args));
	if (existing) return existing;
	if (options?.resource && getJobs().some((job) => job.status === 'running' && job.resource === options.resource)) {
		throw new Error('Another app installation or update is running. Wait for it to finish before starting another.');
	}
	cleanupJobs();
	const id = randomUUID();
	const job: Job = {
		id,
		command,
		args,
		status: 'running',
		output: [],
		startedAt: new Date().toISOString()
	};
	job.resource = options?.resource;

	jobs.set(id, job);

	const proc = hostSpawn(command, args, { tty: options?.tty ?? true });

	const appendLines = (lines: string[]) => {
		if (!lines.length) return;
		job.output.push(...lines);
		if (job.output.length > 5000) job.output = job.output.slice(-5000);
		notifyOutput(id, lines);
	};

	// stdout and stderr can split both lines and multi-byte characters.
	const readers = [proc.stdout, proc.stderr].map((stream) => {
		const decoder = new StringDecoder('utf8');
		let partial = '';
		stream?.on('data', (data: Buffer) => {
			partial += decoder.write(data);
			const lines = partial.split(/\r?\n|\r/);
			partial = lines.pop() ?? '';
			appendLines(lines.map((line) => line.replace(ANSI_RE, '')).filter(Boolean));
		});
		return () => {
			partial += decoder.end();
			if (partial) appendLines([partial.replace(ANSI_RE, '')]);
		};
	});

	const finish = (code: number, error?: Error) => {
		if (job.status !== 'running') return;
		readers.forEach((flush) => flush());
		if (error) appendLines([`Error: ${error.message}`]);
		job.status = code === 0 ? 'completed' : 'failed';
		job.exitCode = code;
		job.finishedAt = new Date().toISOString();
		// Even a failed playbook can have changed some containers.
		for (const key of ['apps', 'containers', 'catalog', 'docker:list']) invalidate(key);
		notifyDone(job);
	};

	proc.on('close', (code) => finish(code ?? 1));
	proc.on('error', (error) => finish(1, error));
	// A child can exit before consuming stdin. EPIPE must not crash the server.
	proc.stdin?.on('error', (error: NodeJS.ErrnoException) => {
		if (error.code !== 'EPIPE') finish(1, error);
	});
	proc.stdin?.end('y\n');

	return job;
}

// Cleanup old completed jobs (keep last 50)
export function cleanupJobs(): void {
	const all = getJobs();
	const completed = all.filter((j) => j.status !== 'running');
	if (completed.length > 50) {
		for (const old of completed.slice(50)) {
			jobs.delete(old.id);
		}
	}
}
