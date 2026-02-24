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

export type AppSource = 'saltbox' | 'sandbox' | 'custom';

export interface AppCatalogEntry {
	slug: string;
	name: string;
	category: AppCategory;
	description: string;
	installed: boolean;
	official: boolean;
	source: AppSource;
}

export interface CustomAppDefinition {
	slug: string;
	name: string;
	category: AppCategory;
	description: string;
	image: string;
	port?: number;
	volumes?: string[];
	environment?: Record<string, string>;
	restart?: 'unless-stopped' | 'always' | 'on-failure' | 'no';
}
