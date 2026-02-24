import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CustomAppDefinition } from '$lib/types/app';
import { hostExec } from './host-exec';

const CUSTOM_APPS_PATH = process.env.CUSTOM_APPS_PATH ?? '/opt/saltbox-ui/custom-apps.json';

export async function getCustomApps(): Promise<CustomAppDefinition[]> {
	try {
		const content = await readFile(CUSTOM_APPS_PATH, 'utf-8');
		const parsed = JSON.parse(content);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

async function saveCustomApps(apps: CustomAppDefinition[]): Promise<void> {
	await mkdir(dirname(CUSTOM_APPS_PATH), { recursive: true });
	await writeFile(CUSTOM_APPS_PATH, JSON.stringify(apps, null, 2), 'utf-8');
}

export async function createCustomApp(
	def: CustomAppDefinition
): Promise<{ success: boolean; error?: string }> {
	const apps = await getCustomApps();
	if (apps.some((a) => a.slug === def.slug)) {
		return { success: false, error: `An app with slug "${def.slug}" already exists` };
	}
	apps.push(def);
	await saveCustomApps(apps);
	return { success: true };
}

export async function updateCustomApp(
	slug: string,
	def: CustomAppDefinition
): Promise<{ success: boolean; error?: string }> {
	const apps = await getCustomApps();
	const idx = apps.findIndex((a) => a.slug === slug);
	if (idx === -1) {
		return { success: false, error: `App "${slug}" not found` };
	}
	apps[idx] = def;
	await saveCustomApps(apps);
	return { success: true };
}

export async function deleteCustomApp(
	slug: string
): Promise<{ success: boolean; error?: string }> {
	const apps = await getCustomApps();
	const filtered = apps.filter((a) => a.slug !== slug);
	if (filtered.length === apps.length) {
		return { success: false, error: `App "${slug}" not found` };
	}
	await saveCustomApps(filtered);
	return { success: true };
}

export async function installCustomApp(
	def: CustomAppDefinition
): Promise<{ success: boolean; output?: string }> {
	const args = [
		'run',
		'-d',
		'--name',
		def.slug,
		'--restart',
		def.restart ?? 'unless-stopped'
	];

	if (def.port) {
		args.push('-p', `${def.port}:${def.port}`);
	}

	if (def.environment) {
		for (const [key, val] of Object.entries(def.environment)) {
			args.push('-e', `${key}=${val}`);
		}
	}

	if (def.volumes) {
		for (const vol of def.volumes) {
			args.push('-v', vol);
		}
	}

	args.push(def.image);

	try {
		const { stdout, stderr } = await hostExec('docker', args, { timeout: 120000 });
		return { success: true, output: stdout || stderr };
	} catch (e) {
		console.error('[custom-apps] installCustomApp failed:', e);
		return { success: false, output: 'Failed to deploy container' };
	}
}
