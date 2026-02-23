import type { SaltboxApp, AppCatalogEntry } from '$lib/types/app';
import type { Container, ContainerLog } from '$lib/types/container';
import type { MountPoint, RcloneRemote, MergeFSConfig } from '$lib/types/storage';
import type { SystemHealth, TraefikRoute, BackupEntry, ActivityEvent, ServiceStatus } from '$lib/types/system';
import { installedApps, appCatalog } from './mock/apps';
import { containers, generateMockLogs } from './mock/containers';
import { mountTree, rcloneRemotes, mergeFSConfig } from './mock/storage';
import { systemHealth, serviceStatuses } from './mock/system';
import { activityEvents } from './mock/activity';
import { traefikRoutes, backupHistory } from './mock/traefik';

function delay(ms = 100): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const api = {
	// Apps
	async getApps(): Promise<SaltboxApp[]> {
		await delay();
		return installedApps;
	},
	async getApp(slug: string): Promise<SaltboxApp | undefined> {
		await delay();
		return installedApps.find((a) => a.slug === slug);
	},
	async getCatalog(): Promise<AppCatalogEntry[]> {
		await delay();
		return appCatalog;
	},
	async installApp(slug: string): Promise<{ success: boolean }> {
		await delay(2000);
		return { success: true };
	},
	async uninstallApp(slug: string): Promise<{ success: boolean }> {
		await delay(1500);
		return { success: true };
	},

	// Containers
	async getContainers(): Promise<Container[]> {
		await delay();
		return containers;
	},
	async getContainerLogs(name: string, count?: number): Promise<ContainerLog[]> {
		await delay(200);
		return generateMockLogs(name, count);
	},
	async containerAction(id: string, action: 'start' | 'stop' | 'restart'): Promise<{ success: boolean }> {
		await delay(1000);
		return { success: true };
	},

	// Storage
	async getMountTree(): Promise<MountPoint> {
		await delay();
		return mountTree;
	},
	async getRcloneRemotes(): Promise<RcloneRemote[]> {
		await delay();
		return rcloneRemotes;
	},
	async getMergeFSConfig(): Promise<MergeFSConfig> {
		await delay();
		return mergeFSConfig;
	},

	// System
	async getSystemHealth(): Promise<SystemHealth> {
		await delay();
		return systemHealth;
	},
	async getTraefikRoutes(): Promise<TraefikRoute[]> {
		await delay();
		return traefikRoutes;
	},
	async getBackups(): Promise<BackupEntry[]> {
		await delay();
		return backupHistory;
	},
	async getActivity(): Promise<ActivityEvent[]> {
		await delay();
		return activityEvents;
	},
	async getServiceStatuses(): Promise<ServiceStatus[]> {
		await delay();
		return serviceStatuses;
	},

	// Actions
	async updateAll(): Promise<{ success: boolean }> {
		await delay(3000);
		return { success: true };
	},
	async backupNow(): Promise<{ success: boolean }> {
		await delay(2000);
		return { success: true };
	},
	async restartTraefik(): Promise<{ success: boolean }> {
		await delay(1500);
		return { success: true };
	},
	async clearLogs(): Promise<{ success: boolean }> {
		await delay(500);
		return { success: true };
	},
};
