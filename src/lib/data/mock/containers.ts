import type { Container, ContainerLog } from '$lib/types/container';

export const containers: Container[] = [
	{ id: 'a1b2c3d4e5f6', name: 'plex', image: 'plexinc/pms-docker:latest', state: 'running', created: '2025-02-09T10:00:00Z', ports: [{ host: 32400, container: 32400, protocol: 'tcp' }], cpu: 12.3, memory: 2147483648, memoryRss: 367001600, memoryLimit: 4294967296, networkRx: 52428800, networkTx: 1073741824, pid: 1234 },
	{ id: 'b2c3d4e5f6a1', name: 'sonarr', image: 'hotio/sonarr:release', state: 'running', created: '2025-02-09T10:00:00Z', ports: [{ host: 8989, container: 8989, protocol: 'tcp' }], cpu: 2.1, memory: 536870912, memoryRss: 241172480, memoryLimit: 1073741824, networkRx: 10485760, networkTx: 5242880, pid: 2345 },
	{ id: 'c3d4e5f6a1b2', name: 'radarr', image: 'hotio/radarr:release', state: 'running', created: '2025-02-09T10:00:00Z', ports: [{ host: 7878, container: 7878, protocol: 'tcp' }], cpu: 1.8, memory: 483183820, memoryRss: 218103808, memoryLimit: 1073741824, networkRx: 8388608, networkTx: 4194304, pid: 3456 },
	{ id: 'd4e5f6a1b2c3', name: 'lidarr', image: 'hotio/lidarr:release', state: 'running', created: '2025-02-09T10:01:00Z', ports: [{ host: 8686, container: 8686, protocol: 'tcp' }], cpu: 0.8, memory: 268435456, memoryRss: 120795136, memoryLimit: 536870912, networkRx: 2097152, networkTx: 1048576, pid: 4567 },
	{ id: 'e5f6a1b2c3d4', name: 'prowlarr', image: 'hotio/prowlarr:release', state: 'running', created: '2025-02-09T10:01:00Z', ports: [{ host: 9696, container: 9696, protocol: 'tcp' }], cpu: 0.5, memory: 214748364, memoryRss: 96636928, memoryLimit: 536870912, networkRx: 5242880, networkTx: 2621440, pid: 5678 },
	{ id: 'f6a1b2c3d4e5', name: 'bazarr', image: 'hotio/bazarr:release', state: 'running', created: '2025-02-09T10:01:00Z', ports: [{ host: 6767, container: 6767, protocol: 'tcp' }], cpu: 0.3, memory: 161061273, memoryRss: 72478720, memoryLimit: 536870912, networkRx: 1048576, networkTx: 524288, pid: 6789 },
	{ id: 'a2b3c4d5e6f7', name: 'overseerr', image: 'sctx/overseerr:latest', state: 'running', created: '2025-02-09T10:02:00Z', ports: [{ host: 5055, container: 5055, protocol: 'tcp' }], cpu: 1.2, memory: 322122547, memoryRss: 144965632, memoryLimit: 1073741824, networkRx: 3145728, networkTx: 1572864, pid: 7890 },
	{ id: 'b3c4d5e6f7a2', name: 'nzbget', image: 'hotio/nzbget:release', state: 'running', created: '2025-02-09T10:02:00Z', ports: [{ host: 6789, container: 6789, protocol: 'tcp' }], cpu: 3.5, memory: 429496729, memoryRss: 193265664, memoryLimit: 1073741824, networkRx: 104857600, networkTx: 524288, pid: 8901 },
	{ id: 'c4d5e6f7a2b3', name: 'qbittorrent', image: 'hotio/qbittorrent:release', state: 'running', created: '2025-02-09T10:02:00Z', ports: [{ host: 8080, container: 8080, protocol: 'tcp' }, { host: 6881, container: 6881, protocol: 'tcp' }, { host: 6881, container: 6881, protocol: 'udp' }], cpu: 5.2, memory: 858993459, memoryRss: 386547712, memoryLimit: 2147483648, networkRx: 209715200, networkTx: 52428800, pid: 9012 },
	{ id: 'd5e6f7a2b3c4', name: 'traefik', image: 'traefik:v3.1', state: 'running', created: '2025-02-09T09:58:00Z', ports: [{ host: 80, container: 80, protocol: 'tcp' }, { host: 443, container: 443, protocol: 'tcp' }, { host: 8080, container: 8080, protocol: 'tcp' }], cpu: 0.6, memory: 107374182, memoryRss: 48332800, memoryLimit: 536870912, networkRx: 1073741824, networkTx: 2147483648, pid: 1012 },
	{ id: 'e6f7a2b3c4d5', name: 'authelia', image: 'authelia/authelia:latest', state: 'running', created: '2025-02-09T09:59:00Z', ports: [{ host: 9091, container: 9091, protocol: 'tcp' }], cpu: 0.2, memory: 85899345, memoryRss: 38666240, memoryLimit: 268435456, networkRx: 524288, networkTx: 262144, pid: 1123 },
	{ id: 'f7a2b3c4d5e6', name: 'tautulli', image: 'tautulli/tautulli:latest', state: 'running', created: '2025-02-09T10:03:00Z', ports: [{ host: 8181, container: 8181, protocol: 'tcp' }], cpu: 0.4, memory: 214748364, memoryRss: 96636928, memoryLimit: 536870912, networkRx: 2097152, networkTx: 1048576, pid: 1234 },
	{ id: 'a3b4c5d6e7f8', name: 'portainer', image: 'portainer/portainer-ce:latest', state: 'running', created: '2025-02-09T09:57:00Z', ports: [{ host: 9000, container: 9000, protocol: 'tcp' }], cpu: 0.3, memory: 161061273, memoryRss: 72478720, memoryLimit: 536870912, networkRx: 1048576, networkTx: 524288, pid: 1345 },
	{ id: 'b4c5d6e7f8a3', name: 'netdata', image: 'netdata/netdata:latest', state: 'running', created: '2025-02-09T10:00:00Z', ports: [{ host: 19999, container: 19999, protocol: 'tcp' }], cpu: 2.5, memory: 429496729, memoryRss: 193265664, memoryLimit: 1073741824, networkRx: 5242880, networkTx: 10485760, pid: 1456 },
	{ id: 'c5d6e7f8a3b4', name: 'readarr', image: 'hotio/readarr:release', state: 'stopped', created: '2025-02-09T10:01:00Z', ports: [{ host: 8787, container: 8787, protocol: 'tcp' }], cpu: 0, memory: 0, memoryRss: 0, memoryLimit: 536870912, networkRx: 0, networkTx: 0, pid: 0 },
	{ id: 'd6e7f8a3b4c5', name: 'sabnzbd', image: 'hotio/sabnzbd:release', state: 'stopped', created: '2025-02-09T10:02:00Z', ports: [{ host: 8085, container: 8085, protocol: 'tcp' }], cpu: 0, memory: 0, memoryRss: 0, memoryLimit: 1073741824, networkRx: 0, networkTx: 0, pid: 0 },
	{ id: 'e7f8a3b4c5d6', name: 'emby', image: 'emby/embyserver:latest', state: 'stopped', created: '2025-02-09T10:03:00Z', ports: [{ host: 8096, container: 8096, protocol: 'tcp' }], cpu: 0, memory: 0, memoryRss: 0, memoryLimit: 4294967296, networkRx: 0, networkTx: 0, pid: 0 },
	{ id: 'f8a3b4c5d6e7', name: 'jellyfin', image: 'jellyfin/jellyfin:latest', state: 'running', created: '2025-02-16T08:00:00Z', ports: [{ host: 8096, container: 8096, protocol: 'tcp' }], cpu: 4.2, memory: 1073741824, memoryRss: 483041280, memoryLimit: 4294967296, networkRx: 31457280, networkTx: 524288000, pid: 1567 },
	{ id: 'a4b5c6d7e8f9', name: 'grafana', image: 'grafana/grafana:latest', state: 'error', created: '2025-02-09T10:04:00Z', ports: [{ host: 3000, container: 3000, protocol: 'tcp' }], cpu: 0, memory: 0, memoryRss: 0, memoryLimit: 536870912, networkRx: 0, networkTx: 0, pid: 0 },
	{ id: 'b5c6d7e8f9a4', name: 'cloudflare-ddns', image: 'oznu/cloudflare-ddns:latest', state: 'running', created: '2025-02-09T10:00:00Z', ports: [], cpu: 0.1, memory: 21474836, memoryRss: 9666560, memoryLimit: 134217728, networkRx: 102400, networkTx: 51200, pid: 1678 },
	{ id: 'c6d7e8f9a4b5', name: 'organizr', image: 'organizr/organizr:latest', state: 'running', created: '2025-02-09T10:03:00Z', ports: [{ host: 80, container: 80, protocol: 'tcp' }], cpu: 0.2, memory: 107374182, memoryRss: 48332800, memoryLimit: 268435456, networkRx: 524288, networkTx: 262144, pid: 1789 },
	{ id: 'd7e8f9a4b5c6', name: 'redis', image: 'redis:alpine', state: 'running', created: '2025-02-09T09:56:00Z', ports: [{ host: 6379, container: 6379, protocol: 'tcp' }], cpu: 0.1, memory: 42949672, memoryRss: 19333120, memoryLimit: 268435456, networkRx: 2097152, networkTx: 1048576, pid: 1890 },
	{ id: 'e8f9a4b5c6d7', name: 'mariadb', image: 'lscr.io/linuxserver/mariadb:latest', state: 'running', created: '2025-02-09T09:55:00Z', ports: [{ host: 3306, container: 3306, protocol: 'tcp' }], cpu: 0.5, memory: 322122547, memoryRss: 144965632, memoryLimit: 1073741824, networkRx: 10485760, networkTx: 5242880, pid: 1901 },
];

export function generateMockLogs(containerName: string, count = 50): ContainerLog[] {
	const levels: ContainerLog['level'][] = ['info', 'info', 'info', 'warn', 'debug', 'error'];
	const messages: Record<string, string[]> = {
		plex: ['Library scan started', 'Transcoding session started for user admin', 'Media optimization complete', 'Database maintenance running', 'Stream started: The Matrix (1999)'],
		sonarr: ['RSS Sync completed', 'Episode grabbed: Breaking Bad S05E16', 'Import completed for /downloads/tv/', 'Indexer health check passed', 'Series refreshed: 45 series updated'],
		radarr: ['Movie grabbed: Dune Part Two (2024)', 'Import completed for /downloads/movies/', 'RSS Sync completed for 12 indexers', 'Quality upgrade available', 'Collection sync completed'],
		default: ['Health check passed', 'Connection established', 'Request processed successfully', 'Configuration reloaded', 'Maintenance task completed'],
	};
	const msgPool = messages[containerName] || messages.default;
	const now = Date.now();
	return Array.from({ length: count }, (_, i) => ({
		timestamp: new Date(now - (count - i) * 30000).toISOString(),
		level: levels[Math.floor(Math.random() * levels.length)],
		message: msgPool[Math.floor(Math.random() * msgPool.length)]
	}));
}
