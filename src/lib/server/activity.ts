import { readFile, readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ActivityEvent, BackupEntry } from '$lib/types/system';

const exec = promisify(execFile);

const BACKUP_LOG_DIR = '/opt/saltbox_backup';
const SALTBOX_LOG = '/srv/git/saltbox/saltbox.log';

export async function getActivity(limit = 50): Promise<ActivityEvent[]> {
	const events: ActivityEvent[] = [];

	// Docker events (last 24h)
	try {
		const since = Math.floor(Date.now() / 1000) - 86400;
		const { stdout } = await exec(
			'docker',
			['events', '--since', String(since), '--until', String(Math.floor(Date.now() / 1000)), '--format', '{{json .}}'],
			{ timeout: 5000 }
		);

		for (const line of stdout.split('\n').filter(Boolean)) {
			try {
				const evt = JSON.parse(line);
				if (!['start', 'stop', 'die', 'restart', 'create', 'destroy'].includes(evt.Action)) continue;

				const actorName = evt.Actor?.Attributes?.name || evt.Actor?.ID?.slice(0, 12) || 'unknown';
				events.push({
					id: `docker-${evt.timeNano || Date.now()}`,
					timestamp: new Date(evt.time * 1000).toISOString(),
					type: evt.Action === 'start' ? 'restart' : evt.Action === 'die' ? 'error' : 'info',
					severity: evt.Action === 'die' ? 'error' : 'info',
					title: `Container ${evt.Action}: ${actorName}`,
					description: `Docker container "${actorName}" ${evt.Action}`,
					source: 'Docker'
				});
			} catch {
				// skip malformed lines
			}
		}
	} catch {
		// Docker events not available
	}

	// Saltbox log (last entries)
	try {
		const content = await readFile(SALTBOX_LOG, 'utf-8');
		const lines = content.trim().split('\n').slice(-20);

		for (const line of lines) {
			const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)/);
			if (!match) continue;

			events.push({
				id: `sb-${Date.parse(match[1]) || Date.now()}`,
				timestamp: new Date(match[1]).toISOString(),
				type: 'info',
				severity: line.toLowerCase().includes('error') ? 'error' : line.toLowerCase().includes('warn') ? 'warning' : 'info',
				title: match[2].slice(0, 80),
				description: match[2],
				source: 'Saltbox'
			});
		}
	} catch {
		// Log file not available
	}

	// Sort by timestamp descending, limit
	return events
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
		.slice(0, limit);
}

export async function getBackups(): Promise<BackupEntry[]> {
	const backups: BackupEntry[] = [];

	try {
		const entries = await readdir(BACKUP_LOG_DIR);
		const logFiles = entries.filter((e) => e.endsWith('.log') || e.endsWith('.json'));

		for (const file of logFiles.slice(-20)) {
			try {
				const filePath = `${BACKUP_LOG_DIR}/${file}`;
				const fileStat = await stat(filePath);
				const content = await readFile(filePath, 'utf-8');

				// Try to parse as JSON first
				try {
					const data = JSON.parse(content);
					backups.push({
						id: file.replace(/\.[^.]+$/, ''),
						timestamp: data.timestamp || fileStat.mtime.toISOString(),
						type: data.type || 'full',
						status: data.status || (data.success ? 'completed' : 'failed'),
						size: data.size || fileStat.size,
						duration: data.duration || 0,
						destination: data.destination || 'unknown'
					});
					continue;
				} catch {
					// Not JSON, parse as log
				}

				// Parse log format
				const hasError = content.toLowerCase().includes('error') || content.toLowerCase().includes('failed');
				backups.push({
					id: file.replace(/\.[^.]+$/, ''),
					timestamp: fileStat.mtime.toISOString(),
					type: 'full',
					status: hasError ? 'failed' : 'completed',
					size: fileStat.size,
					duration: 0,
					destination: content.match(/destination[:\s]+(\S+)/i)?.[1] || 'unknown'
				});
			} catch {
				// skip unreadable files
			}
		}
	} catch {
		// Backup directory not available
	}

	return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
