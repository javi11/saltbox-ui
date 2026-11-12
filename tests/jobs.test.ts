import { expect, mock, spyOn, test } from 'bun:test';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'bun:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

const fixture = await mkdtemp(join(tmpdir(), 'saltbox-ui-'));
process.env.SALTBOX_PATH = join(fixture, 'saltbox');
process.env.SANDBOX_PATH = join(fixture, 'sandbox');
process.env.CUSTOM_APPS_PATH = join(fixture, 'custom.json');
await mkdir(join(fixture, 'sandbox/roles/my_app'), { recursive: true });
await mkdir(join(fixture, 'saltbox/roles/sonarr'), { recursive: true });
await writeFile(process.env.CUSTOM_APPS_PATH, JSON.stringify([
	{ slug: 'personal', name: 'Personal', category: 'tools', image: 'example/app:latest', volumes: ['/data', '/new-data'], environment: { MESSAGE: "a'b" } }
]));
afterAll(() => rm(fixture, { recursive: true, force: true }));

let lists = 0;
let stats = 0;
mock.module('dockerode', () => ({ default: class {
	async listContainers() {
		lists++;
		return [{ Id: '123456789012345', Names: ['/sonarr'], Image: 'sonarr:latest', State: 'running', Created: 1, Ports: [] }];
	}
	getContainer() {
		return { stats: async () => {
			stats++;
			return { cpu_stats: { cpu_usage: { total_usage: 20 }, system_cpu_usage: 100, online_cpus: 1 },
				precpu_stats: { cpu_usage: { total_usage: 10 }, system_cpu_usage: 50 },
				memory_stats: { usage: 100, limit: 1000, stats: { cache: 10 } } };
		} };
	}
} }));

const processes: Array<EventEmitter & { stdin: PassThrough; stdout: PassThrough; stderr: PassThrough }> = [];
const actualHost = await import('../src/lib/server/host-exec');
mock.module('../src/lib/server/host-exec', () => ({
	...actualHost,
	hostExec: async () => ({ stdout: '', stderr: '' }),
	hostSpawn: () => {
		const proc = Object.assign(new EventEmitter(), {
			stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough()
		});
		processes.push(proc);
		return proc;
	}
}));
const { startJob, onJobDone } = await import('../src/lib/server/jobs');

test('repeated clicks reuse the running operation', () => {
	const first = startJob('sb', ['install', 'sonarr']);
	const second = startJob('sb', ['install', 'sonarr']);
	expect(second.id).toBe(first.id);
	processes.at(-1)!.emit('close', 0);
	expect(startJob('sb', ['install', 'sonarr']).id).not.toBe(first.id);
	processes.at(-1)!.emit('close', 0);
});

test('spawn errors finish once and retain the failure through close', () => {
	const job = startJob('missing', []);
	let completions = 0;
	onJobDone(job.id, () => { completions++; });
	const proc = processes.at(-1)!;
	proc.emit('error', new Error('ENOENT'));
	proc.emit('close', 0);
	expect(job.status).toBe('failed');
	expect(job.exitCode).toBe(1);
	expect(completions).toBe(1);
	expect(job.output.join('\n')).toContain('ENOENT');
});

test('split UTF-8 and output chunks produce intact lines', () => {
	const job = startJob('output', []);
	const proc = processes.at(-1)!;
	const bytes = Buffer.from('café');
	proc.stdout.emit('data', bytes.subarray(0, 4));
	proc.stdout.emit('data', Buffer.concat([bytes.subarray(4), Buffer.from(' ready\nlast')]));
	proc.emit('close', 0);
	expect(job.output).toEqual(['café ready', 'last']);
});

const { api } = await import('../src/lib/server/api');
const { getJob } = await import('../src/lib/server/jobs');

test('Sandbox installs return a background job using the prefixed original role tag', async () => {
	const result = await api.installApp('my-app');
	expect(result.success).toBe(true);
	expect(result.jobId).toBeString();
	const job = getJob(result.jobId!);
	expect(job?.command).toBe('sb');
	expect(job?.args).toEqual(['install', 'sandbox-my_app']);
	processes.at(-1)!.emit('close', 0);
});

test('custom app updates pull and recreate the custom image instead of invoking Saltbox', async () => {
	const result = await api.updateApp('personal');
	expect(result.success).toBe(true);
	const job = getJob(result.jobId!);
	expect(job?.command).toBe('sh');
	expect(job?.args[1]).toContain("'docker' 'pull' 'example/app:latest'");
	expect(job?.args[1]).toContain("'docker' 'run' '-d' '--name' 'personal'");
	expect(job?.args[1]).toContain("MESSAGE=a'\\''b");
	expect(job?.args[1]).not.toContain('sb install');
	processes.at(-1)!.emit('close', 0);
});

test('unknown roles and invalid slugs cannot start commands', async () => {
	const before = processes.length;
	expect((await api.installApp('does-not-exist')).success).toBe(false);
	expect((await api.updateApp('sonarr; reboot')).success).toBe(false);
	expect(processes.length).toBe(before);
});

const { listContainers } = await import('../src/lib/server/docker');

test('app inventory skips per-container stats and shares the Docker listing', async () => {
	const [first, second] = await Promise.all([
		listContainers({ includeStats: false }), listContainers({ includeStats: false })
	]);
	expect(first[0].name).toBe('sonarr');
	expect(second[0].state).toBe('running');
	expect(stats).toBe(0);
	expect(lists).toBe(1);
});


test('Update All runs installed app roles rather than only updating repository files', async () => {
	const result = await api.updateAll();
	expect(result.success).toBe(true);
	const job = getJob(result.jobId!);
	expect(job?.args.join(' ')).toContain("'sb' 'install' 'sonarr'");
	expect(job?.args.join(' ')).not.toContain('self-update');
	processes.at(-1)!.emit('close', 0);
});

test('a failed custom container recreation restores the previous container', async () => {
	const bin = join(fixture, 'bin');
	await mkdir(bin);
	const log = join(fixture, 'docker.log');
	await writeFile(join(bin, 'docker'), `#!/bin/sh
echo "$*" >> "$DOCKER_TEST_LOG"
case "$1" in
inspect) if [ "$3" = "{{.State.Running}}" ]; then echo true; else echo '|/data|'; fi ;;
run) exit 42 ;;
esac
`, { mode: 0o755 });
	const result = await api.updateApp('personal');
	const job = getJob(result.jobId!)!;
	try {
		await promisify(execFile)('sh', ['-c', job.args[1]], {
			env: { ...process.env, PATH: `${bin}:/usr/bin:/bin`, DOCKER_TEST_LOG: log }
		});
		throw new Error('Expected deployment failure');
	} catch (error) {
		expect((error as { code: number }).code).toBe(42);
	}
	const commands = await readFile(log, 'utf8');
	expect(commands).toContain('rename personal personal-saltbox-ui-backup');
	const run = commands.split('\n').find((line) => line.startsWith('run '))!;
	expect(run).toContain('--volumes-from personal-saltbox-ui-backup');
	expect(run).toContain('-v /new-data');
	expect(run).not.toContain('-v /data');
	expect(commands).toContain('rename personal-saltbox-ui-backup personal');
	expect(commands.trim().split('\n').at(-1)).toBe('start personal');
	processes.at(-1)!.emit('close', 42);
});

test('conflicting host operations are rejected until the running job finishes', () => {
	const job = startJob('one', [], { resource: 'lock-test' });
	expect(() => startJob('two', [], { resource: 'lock-test' })).toThrow('running');
	processes.at(-1)!.emit('close', 0);
	expect(job.status).toBe('completed');
	expect(startJob('two', [], { resource: 'lock-test' }).status).toBe('running');
	processes.at(-1)!.emit('close', 0);
});

test('app controls load before slow container logs', async () => {
	const { load } = await import('../src/routes/apps/[slug]/+page.server');
	let finish!: (value: []) => void;
	const logs = new Promise<[]>((resolve) => { finish = resolve; });
	const appSpy = spyOn(api, 'getApp').mockResolvedValue({ slug: 'sonarr' } as Awaited<ReturnType<typeof api.getApp>>);
	const logsSpy = spyOn(api, 'getContainerLogs').mockReturnValue(logs);
	try {
		const result = await Promise.race([
			load({ params: { slug: 'sonarr' } } as Parameters<typeof load>[0]),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Page blocked on logs')), 100))
		]);
		expect(result?.logs).toBe(logs);
	} finally {
		finish([]);
		appSpy.mockRestore();
		logsSpy.mockRestore();
	}
});

test('system panels stream independently of slow service checks', async () => {
	const { load } = await import('../src/routes/system/+page.server');
	let finish!: (value: []) => void;
	const services = new Promise<[]>((resolve) => { finish = resolve; });
	const serviceSpy = spyOn(api, 'getServiceStatuses').mockReturnValue(services);
	const routesSpy = spyOn(api, 'getTraefikRoutes').mockResolvedValue([]);
	const backupsSpy = spyOn(api, 'getBackups').mockResolvedValue([]);
	try {
		const result = await Promise.race([
			load({} as Parameters<typeof load>[0]),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Page blocked on services')), 100))
		]);
		expect(result?.services).toBe(services);
		expect(await result?.routes).toEqual([]);
	} finally {
		finish([]);
		serviceSpy.mockRestore();
		routesSpy.mockRestore();
		backupsSpy.mockRestore();
	}
});
