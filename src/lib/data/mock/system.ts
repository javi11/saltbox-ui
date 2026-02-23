import type { SystemHealth, ServiceStatus } from '$lib/types/system';

export const systemHealth: SystemHealth = {
	hostname: 'saltbox-server',
	os: 'Ubuntu 22.04.4 LTS',
	kernel: '6.5.0-44-generic',
	uptime: '42d 7h 15m',
	loadAverage: [1.23, 0.98, 0.87],
	cpu: { usage: 34.2, cores: 8, model: 'AMD Ryzen 7 5800X', temp: 52 },
	memory: { total: 34359738368, used: 21474836480, available: 12884901888, swapTotal: 8589934592, swapUsed: 1073741824 },
	network: { rx: 52428800, tx: 26214400, interface: 'eth0' },
	disk: { total: 2000000000000, used: 850000000000, available: 1150000000000 },
};

export const serviceStatuses: ServiceStatus[] = [
	{ name: 'Plex', status: 'healthy', latency: 12, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Traefik', status: 'healthy', latency: 2, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Authelia', status: 'healthy', latency: 5, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Docker', status: 'healthy', latency: 1, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Rclone', status: 'healthy', latency: 45, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'MergeFS', status: 'healthy', latency: 3, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Grafana', status: 'down', latency: undefined, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'MariaDB', status: 'healthy', latency: 4, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Redis', status: 'healthy', latency: 1, lastCheck: '2025-02-23T14:30:00Z' },
	{ name: 'Netdata', status: 'healthy', latency: 8, lastCheck: '2025-02-23T14:30:00Z' },
];
