import type { SaltboxApp, AppCatalogEntry } from '$lib/types/app';
import type { Container, ContainerLog } from '$lib/types/container';
import type { MountPoint, RcloneRemote, MergeFSConfig } from '$lib/types/storage';
import type { SystemHealth, TraefikRoute, BackupEntry, ActivityEvent, ServiceStatus } from '$lib/types/system';

import * as docker from './docker';
import * as system from './system';
import * as storage from './storage';
import * as saltbox from './saltbox';
import * as traefik from './traefik';
import * as activity from './activity';

// Import mock data as fallback (dev only)
import { installedApps, appCatalog } from '$lib/data/mock/apps';
import { containers as mockContainers, generateMockLogs } from '$lib/data/mock/containers';
import { mountTree as mockMountTree, rcloneRemotes as mockRemotes, mergeFSConfig as mockMergeFS } from '$lib/data/mock/storage';
import { systemHealth as mockHealth, serviceStatuses as mockServices } from '$lib/data/mock/system';
import { activityEvents as mockActivity } from '$lib/data/mock/activity';
import { traefikRoutes as mockRoutes, backupHistory as mockBackups } from '$lib/data/mock/traefik';

const isProduction = process.env.NODE_ENV === 'production';

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		console.error(`[saltbox-api] Operation failed:`, e instanceof Error ? e.message : e);
		if (isProduction) throw e;
		console.warn(`[saltbox-api] Using mock data (dev mode)`);
		return fallback;
	}
}

export const api = {
	// Apps
	async getApps(): Promise<SaltboxApp[]> {
		return withFallback(() => saltbox.getApps(), installedApps);
	},
	async getApp(slug: string): Promise<SaltboxApp | undefined> {
		return withFallback(() => saltbox.getAppBySlug(slug), installedApps.find((a) => a.slug === slug));
	},
	async getCatalog(): Promise<AppCatalogEntry[]> {
		return withFallback(() => saltbox.getAppCatalog(), appCatalog);
	},
	async installApp(slug: string): Promise<{ success: boolean }> {
		return withFallback(() => saltbox.installApp(slug), { success: false });
	},
	async uninstallApp(slug: string, deleteData = false): Promise<{ success: boolean }> {
		return withFallback(() => saltbox.uninstallApp(slug, deleteData), { success: false });
	},

	// Containers
	async getContainers(): Promise<Container[]> {
		return withFallback(() => docker.listContainers(), mockContainers);
	},
	async getContainerLogs(name: string, count?: number): Promise<ContainerLog[]> {
		return withFallback(() => docker.getContainerLogs(name, count), generateMockLogs(name, count));
	},
	async containerAction(id: string, action: 'start' | 'stop' | 'restart'): Promise<{ success: boolean }> {
		return withFallback(() => docker.containerAction(id, action), { success: false });
	},

	// Storage
	async getMountTree(): Promise<MountPoint> {
		return withFallback(() => storage.getMountTree(), mockMountTree);
	},
	async getRcloneRemotes(): Promise<RcloneRemote[]> {
		return withFallback(() => storage.getRcloneRemotes(), mockRemotes);
	},
	async getMergeFSConfig(): Promise<MergeFSConfig> {
		return withFallback(() => storage.getMergeFSConfig(), mockMergeFS);
	},

	// System
	async getSystemHealth(): Promise<SystemHealth> {
		return withFallback(() => system.getSystemHealth(), mockHealth);
	},
	async getTraefikRoutes(): Promise<TraefikRoute[]> {
		return withFallback(() => traefik.getTraefikRoutes(), mockRoutes);
	},
	async getBackups(): Promise<BackupEntry[]> {
		return withFallback(() => activity.getBackups(), mockBackups);
	},
	async getActivity(): Promise<ActivityEvent[]> {
		return withFallback(() => activity.getActivity(), mockActivity);
	},
	async getServiceStatuses(): Promise<ServiceStatus[]> {
		return withFallback(() => system.getServiceStatuses(), mockServices);
	},

	// Actions
	async updateAll(): Promise<{ success: boolean; jobId?: string }> {
		return withFallback<{ success: boolean; jobId?: string }>(
			async () => {
				const { startJob } = await import('./jobs');
				const job = startJob('sh', [
					'-c',
					'sb self-update --yes && sb update --keep-branch --skip-self-update'
				]);
				return { success: true, jobId: job.id };
			},
			{ success: false }
		);
	},
	async backupNow(): Promise<{ success: boolean }> {
		return withFallback<{ success: boolean }>(
			async () => {
				const { startJob } = await import('./jobs');
				startJob('sb', ['install', 'backup']);
				return { success: true };
			},
			{ success: false }
		);
	},
	async restartTraefik(): Promise<{ success: boolean }> {
		return docker.containerAction('traefik', 'restart');
	},
	async clearLogs(): Promise<{ success: boolean }> {
		return { success: true };
	},
	async updateSaltbox(): Promise<{ success: boolean; jobId?: string }> {
		return withFallback<{ success: boolean; jobId?: string }>(
			async () => {
				const { startJob } = await import('./jobs');
				const job = startJob('sh', [
					'-c',
					'sb self-update --yes && sb update --keep-branch --skip-self-update'
				]);
				return { success: true, jobId: job.id };
			},
			{ success: false }
		);
	}
};
