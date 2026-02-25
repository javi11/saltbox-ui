import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SystemHealth, ServiceStatus } from '$lib/types/system';

const exec = promisify(execFile);

const PROC_BASE = process.env.HOST_PROC || '/proc';
const SYS_BASE = process.env.HOST_SYS || '/sys';

async function readProc(path: string): Promise<string> {
	try {
		return await readFile(path, 'utf-8');
	} catch {
		return '';
	}
}

async function getCpuUsage(): Promise<number> {
	const content = await readProc(`${PROC_BASE}/stat`);
	if (!content) return 0;
	const line = content.split('\n')[0];
	const parts = line.split(/\s+/).slice(1).map(Number);
	const idle = parts[3] + (parts[4] || 0);
	const total = parts.reduce((a, b) => a + b, 0);
	// Take two samples 100ms apart
	await new Promise((r) => setTimeout(r, 100));
	const content2 = await readProc(`${PROC_BASE}/stat`);
	if (!content2) return 0;
	const line2 = content2.split('\n')[0];
	const parts2 = line2.split(/\s+/).slice(1).map(Number);
	const idle2 = parts2[3] + (parts2[4] || 0);
	const total2 = parts2.reduce((a, b) => a + b, 0);
	const idleDelta = idle2 - idle;
	const totalDelta = total2 - total;
	return totalDelta > 0 ? Math.round(((totalDelta - idleDelta) / totalDelta) * 100 * 10) / 10 : 0;
}

async function getCpuTemp(): Promise<number> {
	try {
		const content = await readProc(`${SYS_BASE}/class/thermal/thermal_zone0/temp`);
		return content ? Math.round(parseInt(content) / 100) / 10 : 0;
	} catch {
		return 0;
	}
}

async function getMemoryInfo(): Promise<SystemHealth['memory']> {
	const content = await readProc(`${PROC_BASE}/meminfo`);
	if (!content) {
		const total = os.totalmem();
		const free = os.freemem();
		return { total, used: total - free, available: free, swapTotal: 0, swapUsed: 0 };
	}

	const parse = (key: string): number => {
		const match = content.match(new RegExp(`${key}:\\s+(\\d+)`));
		return match ? parseInt(match[1]) * 1024 : 0;
	};

	const total = parse('MemTotal');
	const available = parse('MemAvailable');
	const swapTotal = parse('SwapTotal');
	const swapFree = parse('SwapFree');

	return {
		total,
		used: total - available,
		available,
		swapTotal,
		swapUsed: swapTotal - swapFree
	};
}

async function getDiskUsage(): Promise<SystemHealth['disk']> {
	try {
		const { stdout } = await exec('df', ['--output=size,used,avail', '-B1', '/']);
		const lines = stdout.trim().split('\n');
		const parts = lines[1].trim().split(/\s+/).map(Number);
		return { total: parts[0], used: parts[1], available: parts[2] };
	} catch {
		return { total: 0, used: 0, available: 0 };
	}
}

async function getNetworkStats(): Promise<SystemHealth['network']> {
	const content = await readProc(`${PROC_BASE}/net/dev`);
	if (!content) return { rx: 0, tx: 0, interface: 'unknown' };

	const lines = content.split('\n').slice(2);
	let bestIface = '';
	let bestRx = 0;
	let bestTx = 0;

	for (const line of lines) {
		const parts = line.trim().split(/[:\s]+/);
		if (parts.length < 11) continue;
		const iface = parts[0];
		if (iface === 'lo') continue;
		const rx = parseInt(parts[1]);
		const tx = parseInt(parts[9]);
		if (rx + tx > bestRx + bestTx) {
			bestIface = iface;
			bestRx = rx;
			bestTx = tx;
		}
	}

	return { rx: bestRx, tx: bestTx, interface: bestIface || 'eth0' };
}

function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	if (days > 0) return `${days}d ${hours}h ${mins}m`;
	if (hours > 0) return `${hours}h ${mins}m`;
	return `${mins}m`;
}

export async function getSystemHealth(): Promise<SystemHealth> {
	const [cpuUsage, cpuTemp, memory, disk, network] = await Promise.all([
		getCpuUsage(),
		getCpuTemp(),
		getMemoryInfo(),
		getDiskUsage(),
		getNetworkStats()
	]);

	const cpus = os.cpus();
	const loadAverage = os.loadavg() as [number, number, number];

	let kernel = '';
	try {
		const { stdout } = await exec('uname', ['-r']);
		kernel = stdout.trim();
	} catch {
		kernel = os.release();
	}

	return {
		hostname: os.hostname(),
		os: `${os.type()} ${os.arch()}`,
		kernel,
		uptime: formatUptime(os.uptime()),
		loadAverage: [
			Math.round(loadAverage[0] * 100) / 100,
			Math.round(loadAverage[1] * 100) / 100,
			Math.round(loadAverage[2] * 100) / 100
		],
		cpu: {
			usage: cpuUsage,
			cores: cpus.length,
			model: cpus[0]?.model || 'Unknown',
			temp: cpuTemp
		},
		memory,
		network,
		disk
	};
}

export async function getServiceStatuses(): Promise<ServiceStatus[]> {
	const now = new Date().toISOString();

	const checkDocker = async (): Promise<ServiceStatus> => {
		try {
			const start = Date.now();
			await exec('docker', ['info', '--format', '{{.ServerVersion}}']);
			return { name: 'Docker', status: 'healthy', latency: Date.now() - start, lastCheck: now };
		} catch {
			return { name: 'Docker', status: 'down', lastCheck: now };
		}
	};

	const checkTraefik = async (): Promise<ServiceStatus> => {
		try {
			const start = Date.now();
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);
			const traefikUrl = process.env.TRAEFIK_API_URL || 'http://localhost:8080';
			const res = await fetch(`${traefikUrl}/api/overview`, { signal: controller.signal });
			clearTimeout(timeout);
			return { name: 'Traefik', status: res.ok ? 'healthy' : 'degraded', latency: Date.now() - start, lastCheck: now };
		} catch {
			return { name: 'Traefik', status: 'down', lastCheck: now };
		}
	};

	const checkRclone = async (): Promise<ServiceStatus> => {
		try {
			const start = Date.now();
			await exec('rclone', ['version'], { timeout: 3000 });
			return { name: 'Rclone', status: 'healthy', latency: Date.now() - start, lastCheck: now };
		} catch {
			return { name: 'Rclone', status: 'down', lastCheck: now };
		}
	};

	const checkMergerFS = async (): Promise<ServiceStatus> => {
		try {
			const start = Date.now();
			const { stdout } = await exec('findmnt', ['-t', 'fuse.mergerfs', '-n', '-o', 'TARGET'], { timeout: 3000 });
			return { name: 'MergerFS', status: stdout.trim() ? 'healthy' : 'degraded', latency: Date.now() - start, lastCheck: now };
		} catch {
			return { name: 'MergerFS', status: 'down', lastCheck: now };
		}
	};

	return Promise.all([checkDocker(), checkTraefik(), checkRclone(), checkMergerFS()]);
}
