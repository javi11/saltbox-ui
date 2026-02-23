import { readFile, readdir, access, rm } from 'node:fs/promises';
import YAML from 'yaml';
import type { SaltboxApp, AppCatalogEntry, AppCategory } from '$lib/types/app';
import type { Container } from '$lib/types/container';
import { listContainers } from './docker';
import { hostExec } from './host-exec';

const SALTBOX_PATH = '/srv/git/saltbox';
const SALTBOX_SANDBOX_PATH = '/opt/sandbox';
const ACCOUNTS_PATH = `${SALTBOX_PATH}/accounts.yml`;

// Known category mappings for common Saltbox apps
const CATEGORY_MAP: Record<string, AppCategory> = {
	plex: 'media', emby: 'media', jellyfin: 'media', tautulli: 'monitoring',
	sonarr: 'pvr', radarr: 'pvr', lidarr: 'pvr', readarr: 'pvr', prowlarr: 'pvr', bazarr: 'pvr',
	nzbget: 'downloaders', sabnzbd: 'downloaders', qbittorrent: 'downloaders', deluge: 'downloaders', transmission: 'downloaders', nzbhydra2: 'downloaders',
	portainer: 'tools', organizr: 'tools', overseerr: 'tools', requestrr: 'tools', petio: 'tools',
	netdata: 'monitoring', grafana: 'monitoring', prometheus: 'monitoring',
	traefik: 'network', cloudflare: 'network', authelia: 'network'
};

function guessCategory(name: string): AppCategory {
	const lower = name.toLowerCase();
	return CATEGORY_MAP[lower] || 'tools';
}

interface AccountsConfig {
	user?: { domain?: string; name?: string; email?: string };
}

const ACCOUNTS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedAccounts: AccountsConfig | null = null;
let accountsCachedAt = 0;

async function getAccounts(): Promise<AccountsConfig> {
	if (cachedAccounts && Date.now() - accountsCachedAt < ACCOUNTS_CACHE_TTL_MS) {
		return cachedAccounts;
	}
	try {
		const content = await readFile(ACCOUNTS_PATH, 'utf-8');
		const parsed = YAML.parse(content, { schema: 'core' });
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			cachedAccounts = parsed as AccountsConfig;
		} else {
			cachedAccounts = {};
		}
		accountsCachedAt = Date.now();
		return cachedAccounts;
	} catch {
		return {};
	}
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function containerUptime(created: string): string {
	const diff = Date.now() - new Date(created).getTime();
	const days = Math.floor(diff / 86400000);
	const hours = Math.floor((diff % 86400000) / 3600000);
	if (days > 0) return `${days}d ${hours}h`;
	const mins = Math.floor((diff % 3600000) / 60000);
	return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export async function getApps(): Promise<SaltboxApp[]> {
	const [containers, accounts] = await Promise.all([listContainers(), getAccounts()]);
	const domain = accounts.user?.domain || 'localhost';

	return containers
		.filter((c) => c.state === 'running' || c.state === 'stopped')
		.map((c): SaltboxApp => {
			const name = c.name;
			const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
			const httpPort = c.ports.find((p) => p.container === 80 || p.container === 443 || p.container === 8080);

			return {
				slug,
				name: name.charAt(0).toUpperCase() + name.slice(1),
				category: guessCategory(name),
				status: c.state,
				version: c.image.split(':')[1] || 'latest',
				image: c.image,
				subdomain: `${name}.${domain}`,
				port: httpPort?.host || c.ports[0]?.host || 0,
				cpu: c.cpu,
				memory: c.memory,
				memoryLimit: c.memoryLimit,
				uptime: c.state === 'running' ? containerUptime(c.created) : '—',
				description: `${name} container managed by Saltbox`
			};
		});
}

export async function getAppBySlug(slug: string): Promise<SaltboxApp | undefined> {
	const apps = await getApps();
	return apps.find((a) => a.slug === slug);
}

export async function getAppCatalog(): Promise<AppCatalogEntry[]> {
	const catalog: AppCatalogEntry[] = [];
	const installedApps = await getApps();
	const installedSlugs = new Set(installedApps.map((a) => a.slug));

	// Scan Saltbox roles directory
	const roleDirs = [
		`${SALTBOX_PATH}/roles`,
		`${SALTBOX_SANDBOX_PATH}/roles`
	];

	for (const dir of roleDirs) {
		if (!(await fileExists(dir))) continue;

		try {
			const entries = await readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				if (!entry.isDirectory()) continue;
				const name = entry.name;
				// Skip internal/utility roles
				if (name.startsWith('_') || name === 'settings' || name === 'pre_tasks' || name === 'post_tasks') continue;

				const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
				if (catalog.some((c) => c.slug === slug)) continue;

				catalog.push({
					slug,
					name: name.charAt(0).toUpperCase() + name.slice(1),
					category: guessCategory(name),
					description: `Saltbox role: ${name}`,
					installed: installedSlugs.has(slug),
					official: dir.includes('saltbox/roles')
				});
			}
		} catch {
			// directory not readable
		}
	}

	return catalog.sort((a, b) => a.name.localeCompare(b.name));
}

export async function installApp(slug: string): Promise<{ success: boolean; output?: string }> {
	if (!/^[a-z0-9-]+$/.test(slug)) {
		return { success: false, output: 'Invalid app slug' };
	}
	try {
		const { stdout, stderr } = await hostExec('sb', ['install', slug], { timeout: 300000 });
		return { success: true, output: stdout || stderr };
	} catch (e) {
		console.error('[saltbox] installApp failed:', e);
		return { success: false, output: 'Installation failed' };
	}
}

export async function uninstallApp(slug: string, deleteData = false): Promise<{ success: boolean; output?: string }> {
	if (!/^[a-z0-9-]+$/.test(slug)) {
		return { success: false, output: 'Invalid app slug' };
	}
	try {
		const { stdout } = await hostExec('docker', ['rm', '-f', slug], { timeout: 30000 });

		if (deleteData) {
			await hostExec('rm', ['-rf', `/opt/${slug}`], { timeout: 30000 });
		}

		return { success: true, output: stdout };
	} catch (e) {
		console.error('[saltbox] uninstallApp failed:', e);
		return { success: false, output: 'Uninstall failed' };
	}
}
