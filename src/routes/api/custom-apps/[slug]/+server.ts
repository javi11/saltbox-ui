import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { validateSlug } from '$lib/server/validate';
import { auditLog } from '$lib/server/audit';
import type { CustomAppDefinition } from '$lib/types/app';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const slug = validateSlug(params.slug);
	if (!slug) return json({ success: false, error: 'Invalid app slug' }, { status: 400 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const def = body as Partial<CustomAppDefinition>;
	if (!def.name?.trim()) return json({ success: false, error: 'Name is required' }, { status: 400 });
	if (!def.image?.trim()) return json({ success: false, error: 'Docker image is required' }, { status: 400 });

	const newSlug = validateSlug(def.slug ?? slug);
	if (!newSlug) return json({ success: false, error: 'Invalid slug' }, { status: 400 });

	const cleanDef: CustomAppDefinition = {
		slug: newSlug,
		name: def.name.trim(),
		category: def.category ?? 'tools',
		description: def.description?.trim() ?? '',
		image: def.image.trim(),
		...(def.port ? { port: Number(def.port) } : {}),
		...(def.volumes?.length ? { volumes: def.volumes } : {}),
		...(def.environment && Object.keys(def.environment).length ? { environment: def.environment } : {}),
		...(def.restart ? { restart: def.restart } : {})
	};

	await auditLog({ user: locals.user, action: 'custom-app:update', target: slug });
	const result = await api.updateCustomApp(slug, cleanDef);
	return json(result, { status: result.success ? 200 : 404 });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const slug = validateSlug(params.slug);
	if (!slug) return json({ success: false, error: 'Invalid app slug' }, { status: 400 });

	await auditLog({ user: locals.user, action: 'custom-app:delete', target: slug });
	const result = await api.deleteCustomApp(slug);
	return json(result, { status: result.success ? 200 : 404 });
};
