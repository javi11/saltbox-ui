import { readFile, readdir } from 'node:fs/promises';
import YAML from 'yaml';
import type { SaltboxApp, AppCatalogEntry, AppCategory, AppSource } from '$lib/types/app';
import { listContainers } from './docker';
import { hostExec } from './host-exec';
import { getCustomApps } from './custom-apps';
import { cached } from './cache';

const SALTBOX_PATH = process.env.SALTBOX_PATH ?? '/srv/git/saltbox';
const SALTBOX_SANDBOX_PATH = process.env.SANDBOX_PATH ?? '/opt/sandbox';
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

function containerUptime(created: string): string {
	const diff = Date.now() - new Date(created).getTime();
	const days = Math.floor(diff / 86400000);
	const hours = Math.floor((diff % 86400000) / 3600000);
	if (days > 0) return `${days}d ${hours}h`;
	const mins = Math.floor((diff % 3600000) / 60000);
	return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export async function getApps(): Promise<SaltboxApp[]> {
	const [containers, accounts] = await Promise.all([listContainers({ includeStats: false }), getAccounts()]);
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

interface AppRole {
	slug: string;
	name: string;
	source: 'saltbox' | 'sandbox';
	tag: string;
}

function getRoles(): Promise<AppRole[]> {
	return cached('roles', 120_000, async () => {
		const roles: AppRole[] = [];
		for (const [path, source] of [
			[`${SALTBOX_PATH}/roles`, 'saltbox'],
			[`${SALTBOX_SANDBOX_PATH}/roles`, 'sandbox']
		] as const) {
			let entries;
			try {
				entries = await readdir(path, { withFileTypes: true });
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
				throw error;
			}
			for (const entry of entries) {
				const name = entry.name;
				if (!entry.isDirectory() || name.startsWith('_') ||
					['settings', 'pre_tasks', 'post_tasks'].includes(name)) continue;
				const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
				if (roles.some((role) => role.slug === slug)) continue;
				roles.push({ slug, name, source, tag: source === 'sandbox' ? `sandbox-${name}` : name });
			}
		}
		return roles;
	});
}

export async function getInstallTag(slug: string): Promise<string | undefined> {
	return (await getRoles()).find((role) => role.slug === slug)?.tag;
}

export async function getAppCatalog(): Promise<AppCatalogEntry[]> {
	const [installedApps, roles, customApps] = await Promise.all([getApps(), getRoles(), getCustomApps()]);
	const installedSlugs = new Set(installedApps.map((app) => app.slug));
	const catalog: AppCatalogEntry[] = roles.map(({ slug, name, source }) => ({
		slug,
		name: name.charAt(0).toUpperCase() + name.slice(1),
		category: guessCategory(name),
		description: `${source === 'saltbox' ? 'Saltbox' : 'Sandbox'} role: ${name}`,
		installed: installedSlugs.has(slug),
		official: source === 'saltbox',
		source
	}));
	for (const custom of customApps) {
		if (catalog.some((entry) => entry.slug === custom.slug)) continue;
		catalog.push({
			slug: custom.slug, name: custom.name, category: custom.category,
			description: custom.description || `Custom app: ${custom.image}`,
			installed: installedSlugs.has(custom.slug), official: false, source: 'custom'
		});
	}
	return catalog.sort((a, b) => a.name.localeCompare(b.name));
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
