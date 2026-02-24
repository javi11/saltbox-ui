import type { Status } from './common';

export interface PortMapping {
	host: number;
	container: number;
	protocol: 'tcp' | 'udp';
}

export interface Container {
	id: string;
	name: string;
	image: string;
	state: Status;
	created: string;
	ports: PortMapping[];
	cpu: number;
	memory: number;
	memoryRss: number;
	memoryLimit: number;
	networkRx: number;
	networkTx: number;
	pid: number;
}

export interface ContainerLog {
	timestamp: string;
	level: 'info' | 'warn' | 'error' | 'debug';
	message: string;
}
