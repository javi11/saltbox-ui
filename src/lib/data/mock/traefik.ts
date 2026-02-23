import type { TraefikRoute } from '$lib/types/system';
import type { BackupEntry } from '$lib/types/system';

export const traefikRoutes: TraefikRoute[] = [
	{ rule: 'Host(`plex.domain.com`)', service: 'plex', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`sonarr.domain.com`)', service: 'sonarr', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`radarr.domain.com`)', service: 'radarr', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`overseerr.domain.com`)', service: 'overseerr', tls: true, middlewares: [], entryPoints: ['websecure'] },
	{ rule: 'Host(`tautulli.domain.com`)', service: 'tautulli', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`nzbget.domain.com`)', service: 'nzbget', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`qbittorrent.domain.com`)', service: 'qbittorrent', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`portainer.domain.com`)', service: 'portainer', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`netdata.domain.com`)', service: 'netdata', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`authelia.domain.com`)', service: 'authelia', tls: true, middlewares: [], entryPoints: ['websecure'] },
	{ rule: 'Host(`jellyfin.domain.com`)', service: 'jellyfin', tls: true, middlewares: [], entryPoints: ['websecure'] },
	{ rule: 'Host(`organizr.domain.com`)', service: 'organizr', tls: true, middlewares: [], entryPoints: ['websecure'] },
	{ rule: 'Host(`grafana.domain.com`)', service: 'grafana', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`prowlarr.domain.com`)', service: 'prowlarr', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`bazarr.domain.com`)', service: 'bazarr', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
	{ rule: 'Host(`lidarr.domain.com`)', service: 'lidarr', tls: true, middlewares: ['authelia@docker'], entryPoints: ['websecure'] },
];

export const backupHistory: BackupEntry[] = [
	{ id: 'b1', timestamp: '2025-02-23T08:30:00Z', type: 'full', status: 'completed', size: 20066715648, duration: 1965, destination: 'b2-backup:saltbox-backups' },
	{ id: 'b2', timestamp: '2025-02-23T13:30:00Z', type: 'incremental', status: 'completed', size: 2469606195, duration: 252, destination: 'b2-backup:saltbox-backups' },
	{ id: 'b3', timestamp: '2025-02-22T08:30:00Z', type: 'full', status: 'completed', size: 19327352832, duration: 1890, destination: 'b2-backup:saltbox-backups' },
	{ id: 'b4', timestamp: '2025-02-21T08:30:00Z', type: 'full', status: 'completed', size: 19113443737, duration: 1845, destination: 'b2-backup:saltbox-backups' },
	{ id: 'b5', timestamp: '2025-02-20T08:30:00Z', type: 'full', status: 'failed', size: 0, duration: 432, destination: 'b2-backup:saltbox-backups' },
	{ id: 'b6', timestamp: '2025-02-20T13:30:00Z', type: 'incremental', status: 'completed', size: 1503238553, duration: 180, destination: 'b2-backup:saltbox-backups' },
];
