import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const LOG_DIR = process.env.AUDIT_LOG_DIR || '/var/log/saltbox-ui';
const LOG_FILE = join(LOG_DIR, 'audit.log');

let dirEnsured = false;

async function ensureDir(): Promise<void> {
	if (dirEnsured) return;
	try {
		await mkdir(LOG_DIR, { recursive: true });
		dirEnsured = true;
	} catch {
		// Fall back to writing to stdout if directory creation fails
	}
}

export interface AuditEntry {
	user: string;
	action: string;
	target?: string;
	detail?: string;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
	const line = JSON.stringify({
		timestamp: new Date().toISOString(),
		...entry
	});

	console.info(`[audit] ${line}`);

	try {
		await ensureDir();
		await appendFile(LOG_FILE, line + '\n', 'utf-8');
	} catch {
		// Audit log write failed -- already logged to stdout above
	}
}
