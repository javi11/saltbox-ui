import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { MountPoint, RcloneRemote, MergeFSConfig, MergeFSBranch } from '$lib/types/storage';

const exec = promisify(execFile);

const FSTAB_PATH = process.env.HOST_FSTAB || '/etc/fstab';

async function execFS(cmd: string, args: string[]): Promise<string> {
	const hostProc = process.env.HOST_PROC;
	if (hostProc) {
		const { stdout } = await exec(
			'nsenter',
			[`--mount=${hostProc}/1/ns/mnt`, '--', cmd, ...args],
			{ timeout: 5000 }
		);
		return stdout;
	}
	const { stdout } = await exec(cmd, args, { timeout: 5000 });
	return stdout;
}

function classifyFs(fstype: string, source: string): MountPoint['type'] {
	if (fstype === 'fuse.mergerfs') return 'union';
	if (fstype.startsWith('fuse.rclone') || fstype === 'fuse' || source.includes(':')) return 'remote';
	return 'local';
}

interface FindmntEntry {
	target: string;
	source: string;
	fstype: string;
	size?: string;
	used?: string;
	avail?: string;
	children?: FindmntEntry[];
}

function parseFindmntEntry(entry: FindmntEntry): MountPoint {
	return {
		path: entry.target,
		type: classifyFs(entry.fstype, entry.source),
		size: parseInt(entry.size || '0') || 0,
		used: parseInt(entry.used || '0') || 0,
		available: parseInt(entry.avail || '0') || 0,
		filesystem: entry.fstype,
		children: entry.children?.map(parseFindmntEntry)
	};
}

export async function getMountTree(): Promise<MountPoint> {
	try {
		const stdout = await execFS('findmnt', [
			'--json', '--bytes', '--output', 'TARGET,SOURCE,FSTYPE,SIZE,USED,AVAIL',
			'-t', 'ext4,xfs,btrfs,fuse.mergerfs,fuse.rclone,fuse,nfs,nfs4,cifs'
		]);

		const data = JSON.parse(stdout);
		const entries: FindmntEntry[] = data.filesystems || [];

		if (entries.length === 0) {
			return { path: '/', type: 'local', size: 0, used: 0, available: 0, filesystem: 'unknown' };
		}

		// Build a root node with all mounts as children
		if (entries.length === 1) return parseFindmntEntry(entries[0]);

		const root = parseFindmntEntry(entries[0]);
		root.children = entries.slice(1).map(parseFindmntEntry);
		return root;
	} catch {
		// Fallback: parse /proc/mounts + df
		return getMountTreeFallback();
	}
}

async function getMountTreeFallback(): Promise<MountPoint> {
	const children: MountPoint[] = [];

	try {
		const stdout = await execFS('df', ['--output=source,size,used,avail,target', '-B1']);
		const lines = stdout.trim().split('\n').slice(1);

		for (const line of lines) {
			const parts = line.trim().split(/\s+/);
			if (parts.length < 5) continue;
			const source = parts[0];
			const target = parts.slice(4).join(' ');

			if (source === 'tmpfs' || source === 'devtmpfs' || target.startsWith('/snap')) continue;

			let type: MountPoint['type'] = 'local';
			if (source.includes('mergerfs')) type = 'union';
			else if (source.includes(':') || source.includes('rclone')) type = 'remote';

			children.push({
				path: target,
				type,
				size: parseInt(parts[1]) || 0,
				used: parseInt(parts[2]) || 0,
				available: parseInt(parts[3]) || 0,
				filesystem: source
			});
		}
	} catch {
		// ignore
	}

	const root = children.find((c) => c.path === '/') || {
		path: '/',
		type: 'local' as const,
		size: 0,
		used: 0,
		available: 0,
		filesystem: 'unknown'
	};

	root.children = children.filter((c) => c.path !== '/');
	return root;
}

export async function getRcloneRemotes(): Promise<RcloneRemote[]> {
	try {
		const { stdout: listOut } = await exec('rclone', ['listremotes'], { timeout: 5000 });
		const remoteNames = listOut
			.trim()
			.split('\n')
			.filter(Boolean)
			.map((r) => r.replace(/:$/, ''));

		if (remoteNames.length === 0) return [];

		const { stdout: configOut } = await exec('rclone', ['config', 'show', '--json'], { timeout: 5000 });
		let configData: Record<string, { type?: string }> = {};
		try {
			configData = JSON.parse(configOut);
		} catch {
			// Fall back to non-json config show
		}

		return remoteNames.map((name) => {
			const cfg = configData[name];
			return {
				name,
				type: cfg?.type || 'unknown',
				connected: true, // If rclone listremotes works, they're configured
				bandwidth: { up: 0, down: 0 },
				transferred: 0,
				errors: 0
			};
		});
	} catch {
		return [];
	}
}

export async function getMergeFSConfig(): Promise<MergeFSConfig> {
	const defaultConfig: MergeFSConfig = {
		mountPoint: '/mnt/unionfs',
		branches: [],
		policy: { create: 'epmfs', search: 'ff', action: 'epall' },
		cacheTimeout: 60
	};

	try {
		const fstab = await readFile(FSTAB_PATH, 'utf-8');
		const mergerfsLine = fstab
			.split('\n')
			.find((line) => line.includes('mergerfs') && !line.startsWith('#'));

		if (!mergerfsLine) return defaultConfig;

		const parts = mergerfsLine.split(/\s+/);
		const sourcePaths = parts[0];
		const mountPoint = parts[1] || defaultConfig.mountPoint;
		const options = parts[3] || '';

		// Parse branches from source (colon-separated paths)
		const branches: MergeFSBranch[] = sourcePaths.split(':').map((p) => ({
			path: p,
			mode: 'RW' as const
		}));

		// Parse policy from options
		const getOpt = (key: string, fallback: string): string => {
			const match = options.match(new RegExp(`${key}=([^,]+)`));
			return match ? match[1] : fallback;
		};

		const cacheMatch = options.match(/cache\.(?:files|entry)=(\d+)/);

		return {
			mountPoint,
			branches,
			policy: {
				create: getOpt('category.create', getOpt('func.create', 'epmfs')),
				search: getOpt('category.search', getOpt('func.search', 'ff')),
				action: getOpt('category.action', getOpt('func.action', 'epall'))
			},
			cacheTimeout: cacheMatch ? parseInt(cacheMatch[1]) : 60
		};
	} catch {
		return defaultConfig;
	}
}
