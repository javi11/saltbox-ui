import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { validateSlug } from '$lib/server/validate';
import { auditLog } from '$lib/server/audit';
import type { CustomAppDefinition } from '$lib/types/app';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const apps = await api.getCustomApps();
	return json(apps);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const def = body as Partial<CustomAppDefinition>;
	const slug = validateSlug(def.slug ?? '');
	if (!slug) return json({ success: false, error: 'Invalid or missing slug' }, { status: 400 });
	if (!def.name?.trim()) return json({ success: false, error: 'Name is required' }, { status: 400 });
	if (!def.image?.trim()) return json({ success: false, error: 'Docker image is required' }, { status: 400 });

	const cleanDef: CustomAppDefinition = {
		slug,
		name: def.name.trim(),
		category: def.category ?? 'tools',
		description: def.description?.trim() ?? '',
		image: def.image.trim(),
		...(def.port ? { port: Number(def.port) } : {}),
		...(def.volumes?.length ? { volumes: def.volumes } : {}),
		...(def.environment && Object.keys(def.environment).length ? { environment: def.environment } : {}),
		...(def.restart ? { restart: def.restart } : {})
	};

	await auditLog({ user: locals.user, action: 'custom-app:create', target: slug });
	const result = await api.createCustomApp(cleanDef);
	return json(result, { status: result.success ? 201 : 409 });
};
