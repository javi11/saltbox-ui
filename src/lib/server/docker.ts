import Docker from 'dockerode';
import type { Container, ContainerLog, PortMapping } from '$lib/types/container';
import type { Status } from '$lib/types/common';

const dockerHost = process.env.DOCKER_HOST;

const docker = dockerHost
	? new Docker({ host: new URL(dockerHost).hostname, port: Number(new URL(dockerHost).port) || 2375 })
	: new Docker({ socketPath: '/var/run/docker.sock' });

function withTimeout<T>(ms: number, fn: () => Promise<T>): Promise<T> {
	return Promise.race([
		fn(),
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error(`Docker call timed out after ${ms}ms`)), ms)
		)
	]);
}

function mapState(state: string): Status {
	switch (state.toLowerCase()) {
		case 'running':
			return 'running';
		case 'exited':
		case 'dead':
		case 'created':
			return 'stopped';
		case 'restarting':
		case 'removing':
			return 'updating';
		default:
			return 'error';
	}
}

function mapPorts(ports: Docker.Port[]): PortMapping[] {
	return ports
		.filter((p) => p.PublicPort)
		.map((p) => ({
			host: p.PublicPort!,
			container: p.PrivatePort,
			protocol: (p.Type as 'tcp' | 'udp') || 'tcp'
		}));
}

interface ContainerStats {
	cpu: number;
	memory: number;
	memoryRss: number;
	memoryLimit: number;
	networkRx: number;
	networkTx: number;
	pid: number;
}

async function getOneStats(containerId: string): Promise<ContainerStats> {
	try {
		const container = docker.getContainer(containerId);
		const stats = await withTimeout(5000, () => container.stats({ stream: false }));

		const cpuDelta =
			stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
		const systemDelta =
			stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
		const cpuCount = stats.cpu_stats.online_cpus || 1;
		const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;

		const memUsage = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
		const memoryRss = stats.memory_stats.stats?.rss ?? stats.memory_stats.stats?.anon ?? 0;
		const memLimit = stats.memory_stats.limit;

		let networkRx = 0;
		let networkTx = 0;
		if (stats.networks) {
			for (const net of Object.values(stats.networks)) {
				const n = net as { rx_bytes: number; tx_bytes: number };
				networkRx += n.rx_bytes;
				networkTx += n.tx_bytes;
			}
		}

		return {
			cpu: Math.round(cpuPercent * 100) / 100,
			memory: memUsage,
			memoryRss,
			memoryLimit: memLimit,
			networkRx,
			networkTx,
			pid: stats.pids_stats?.current || 0
		};
	} catch {
		return { cpu: 0, memory: 0, memoryRss: 0, memoryLimit: 0, networkRx: 0, networkTx: 0, pid: 0 };
	}
}

async function withConcurrency<T>(limit: number, fns: (() => Promise<T>)[]): Promise<T[]> {
	const results: T[] = new Array(fns.length);
	const active = new Set<Promise<void>>();
	for (let i = 0; i < fns.length; i++) {
		const idx = i;
		const p: Promise<void> = fns[idx]()
			.then((r) => { results[idx] = r; })
			.finally(() => active.delete(p));
		active.add(p);
		if (active.size >= limit) await Promise.race(active);
	}
	await Promise.all(active);
	return results;
}

export async function listContainers(): Promise<Container[]> {
	const raw = await withTimeout(8000, () => docker.listContainers({ all: true }));

	const results = await withConcurrency(
		10,
		raw.map((c) => async () => {
			const stats =
				c.State === 'running' ? await getOneStats(c.Id) : { cpu: 0, memory: 0, memoryRss: 0, memoryLimit: 0, networkRx: 0, networkTx: 0, pid: 0 };

			const container: Container = {
				id: c.Id.slice(0, 12),
				name: (c.Names[0] || '').replace(/^\//, ''),
				image: c.Image,
				state: mapState(c.State),
				created: new Date(c.Created * 1000).toISOString(),
				ports: mapPorts(c.Ports),
				...stats
			};
			return container;
		})
	);

	return results.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getContainerLogs(
	nameOrId: string,
	tail = 100
): Promise<ContainerLog[]> {
	const containers = await withTimeout(8000, () => docker.listContainers({ all: true }));
	const match = containers.find(
		(c) =>
			c.Id.startsWith(nameOrId) ||
			c.Names.some((n) => n.replace(/^\//, '') === nameOrId)
	);
	if (!match) return [];

	const container = docker.getContainer(match.Id);
	const logBuffer = await withTimeout(10000, () => container.logs({
		stdout: true,
		stderr: true,
		tail,
		timestamps: true
	}));

	const logString = typeof logBuffer === 'string' ? logBuffer : logBuffer.toString('utf-8');
	const lines = logString.split('\n').filter(Boolean);

	return lines.map((line) => {
		// Docker log lines may have 8-byte header (stream multiplexing)
		// Strip non-printable prefix if present
		const cleaned = line.replace(/^[\x00-\x08]/, '').replace(/^.{0,8}(?=\d{4}-\d{2}-\d{2})/, '');
		const tsMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*(.*)/);

		let timestamp: string;
		let message: string;
		if (tsMatch) {
			timestamp = tsMatch[1];
			message = tsMatch[2];
		} else {
			timestamp = new Date().toISOString();
			message = line.replace(/^[\x00-\x1f]+/, '');
		}

		let level: ContainerLog['level'] = 'info';
		const lower = message.toLowerCase();
		if (lower.includes('error') || lower.includes('fatal') || lower.includes('panic')) {
			level = 'error';
		} else if (lower.includes('warn')) {
			level = 'warn';
		} else if (lower.includes('debug') || lower.includes('trace')) {
			level = 'debug';
		}

		return { timestamp, level, message };
	});
}

export async function containerAction(
	nameOrId: string,
	action: 'start' | 'stop' | 'restart'
): Promise<{ success: boolean }> {
	const containers = await withTimeout(8000, () => docker.listContainers({ all: true }));
	const match = containers.find(
		(c) =>
			c.Id.startsWith(nameOrId) ||
			c.Names.some((n) => n.replace(/^\//, '') === nameOrId)
	);
	if (!match) return { success: false };

	const container = docker.getContainer(match.Id);
	await withTimeout(10000, () => container[action]());
	return { success: true };
}
