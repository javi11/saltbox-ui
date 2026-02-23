import type { Status } from './common';

export type AppCategory = 'media' | 'pvr' | 'downloaders' | 'tools' | 'monitoring' | 'network';

export interface SaltboxApp {
	slug: string;
	name: string;
	category: AppCategory;
	status: Status;
	version: string;
	image: string;
	subdomain: string;
	port: number;
	cpu: number;
	memory: number;
	memoryLimit: number;
	uptime: string;
	description: string;
	docsUrl?: string;
}

export interface AppCatalogEntry {
	slug: string;
	name: string;
	category: AppCategory;
	description: string;
	installed: boolean;
	official: boolean;
}
