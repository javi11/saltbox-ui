export interface SystemHealth {
	hostname: string;
	os: string;
	kernel: string;
	uptime: string;
	loadAverage: [number, number, number];
	cpu: { usage: number; cores: number; model: string; temp: number };
	memory: { total: number; used: number; available: number; swapTotal: number; swapUsed: number };
	network: { rx: number; tx: number; interface: string };
	disk: { total: number; used: number; available: number };
}

export interface TraefikRoute {
	rule: string;
	service: string;
	tls: boolean;
	middlewares: string[];
	entryPoints: string[];
}

export interface BackupEntry {
	id: string;
	timestamp: string;
	type: 'full' | 'incremental';
	status: 'completed' | 'failed' | 'in_progress';
	size: number;
	duration: number;
	destination: string;
}

export interface ActivityEvent {
	id: string;
	timestamp: string;
	type: 'install' | 'update' | 'restart' | 'backup' | 'error' | 'info';
	severity: 'info' | 'warning' | 'error' | 'success';
	title: string;
	description: string;
	source: string;
}

export interface ServiceStatus {
	name: string;
	status: 'healthy' | 'degraded' | 'down' | 'unknown';
	latency?: number;
	lastCheck: string;
}
