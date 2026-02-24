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
}

const jobs = new Map<string, Job>();

export function getJobs(): Job[] {
	return Array.from(jobs.values()).sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
	);
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
}

export function startJob(command: string, args: string[], options?: { tty?: boolean }): Job {
	const id = randomUUID();
	const job: Job = {
		id,
		command,
		args,
		status: 'running',
		output: [],
		startedAt: new Date().toISOString()
	};

	jobs.set(id, job);

	const proc = hostSpawn(command, args, { tty: options?.tty ?? true });

	// Auto-answer any interactive prompts (e.g. migration confirmations) then
	// close stdin so Bubble Tea TUI viewers exit on EOF.
	proc.stdin?.write('y\n');
	proc.stdin?.end();

	const appendOutput = (data: Buffer) => {
		const lines = data
			.toString('utf-8')
			.replace(ANSI_RE, '')
			.split('\n')
			.filter(Boolean);
		job.output.push(...lines);
		// Keep max 5000 lines
		if (job.output.length > 5000) {
			job.output = job.output.slice(-5000);
		}
	};

	proc.stdout?.on('data', appendOutput);
	proc.stderr?.on('data', appendOutput);

	proc.on('close', (code) => {
		job.status = code === 0 ? 'completed' : 'failed';
		job.exitCode = code ?? 1;
		job.finishedAt = new Date().toISOString();
	});

	proc.on('error', (err) => {
		job.status = 'failed';
		job.output.push(`Error: ${err.message}`);
		job.finishedAt = new Date().toISOString();
	});

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
