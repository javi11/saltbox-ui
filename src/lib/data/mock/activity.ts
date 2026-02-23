import type { ActivityEvent } from '$lib/types/system';

export const activityEvents: ActivityEvent[] = [
	{ id: '1', timestamp: '2025-02-23T14:25:00Z', type: 'info', severity: 'info', title: 'Plex library scan completed', description: '2,451 items scanned, 12 new items added', source: 'plex' },
	{ id: '2', timestamp: '2025-02-23T14:10:00Z', type: 'update', severity: 'success', title: 'Sonarr updated to v4.0.8.1874', description: 'Automatic update via Watchtower', source: 'watchtower' },
	{ id: '3', timestamp: '2025-02-23T13:45:00Z', type: 'error', severity: 'error', title: 'Grafana container crashed', description: 'Exit code 137 — OOMKilled. Memory limit: 512MB', source: 'docker' },
	{ id: '4', timestamp: '2025-02-23T13:30:00Z', type: 'backup', severity: 'success', title: 'Incremental backup completed', description: '2.3 GB backed up to B2 in 4m 12s', source: 'backup' },
	{ id: '5', timestamp: '2025-02-23T12:00:00Z', type: 'info', severity: 'info', title: 'Rclone mount refreshed', description: 'Google Drive remote re-mounted successfully', source: 'rclone' },
	{ id: '6', timestamp: '2025-02-23T11:30:00Z', type: 'install', severity: 'success', title: 'Jellyfin installed', description: 'Installed via sb install jellyfin', source: 'saltbox' },
	{ id: '7', timestamp: '2025-02-23T10:15:00Z', type: 'restart', severity: 'warning', title: 'Traefik restarted', description: 'Configuration change detected, automatic restart', source: 'traefik' },
	{ id: '8', timestamp: '2025-02-23T09:00:00Z', type: 'info', severity: 'info', title: 'Recyclarr sync completed', description: 'Custom formats synced to Sonarr and Radarr', source: 'recyclarr' },
	{ id: '9', timestamp: '2025-02-23T08:30:00Z', type: 'backup', severity: 'success', title: 'Full backup completed', description: '18.7 GB backed up to B2 in 32m 45s', source: 'backup' },
	{ id: '10', timestamp: '2025-02-23T07:00:00Z', type: 'update', severity: 'success', title: 'Prowlarr updated to v1.24.3.4754', description: 'Automatic update via Watchtower', source: 'watchtower' },
	{ id: '11', timestamp: '2025-02-22T23:00:00Z', type: 'info', severity: 'info', title: 'Autoscan triggered Plex scan', description: '/mnt/unionfs/Media scanned', source: 'autoscan' },
	{ id: '12', timestamp: '2025-02-22T22:15:00Z', type: 'error', severity: 'error', title: 'Dropbox sync error', description: 'Rate limit exceeded, retrying in 5 minutes', source: 'rclone' },
	{ id: '13', timestamp: '2025-02-22T21:00:00Z', type: 'info', severity: 'info', title: 'qBittorrent: 3 downloads completed', description: 'Moved to /mnt/local/downloads/completed', source: 'qbittorrent' },
	{ id: '14', timestamp: '2025-02-22T20:30:00Z', type: 'update', severity: 'success', title: 'Radarr updated to v5.8.3.8933', description: 'Automatic update via Watchtower', source: 'watchtower' },
	{ id: '15', timestamp: '2025-02-22T19:00:00Z', type: 'info', severity: 'info', title: 'NZBGet: download completed', description: 'Processing: Movie.2024.2160p.WEB-DL', source: 'nzbget' },
	{ id: '16', timestamp: '2025-02-22T18:00:00Z', type: 'restart', severity: 'warning', title: 'Authelia restarted', description: 'SSL certificate renewal triggered restart', source: 'authelia' },
	{ id: '17', timestamp: '2025-02-22T16:30:00Z', type: 'info', severity: 'info', title: 'Cloudflare DDNS updated', description: 'IP changed from 203.0.113.1 to 203.0.113.42', source: 'cloudflare-ddns' },
	{ id: '18', timestamp: '2025-02-22T15:00:00Z', type: 'error', severity: 'warning', title: 'High memory usage detected', description: 'Server at 89% memory utilization', source: 'netdata' },
	{ id: '19', timestamp: '2025-02-22T12:00:00Z', type: 'info', severity: 'info', title: 'Bazarr: 8 subtitles downloaded', description: 'Languages: English, Spanish', source: 'bazarr' },
	{ id: '20', timestamp: '2025-02-22T10:00:00Z', type: 'backup', severity: 'success', title: 'Config backup completed', description: 'All app configs backed up to /opt/backup', source: 'backup' },
];
