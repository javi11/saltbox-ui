import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { validateSlug } from '$lib/server/validate';
import { auditLog } from '$lib/server/audit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const slug = validateSlug(params.slug);
	if (!slug) return json({ success: false, error: 'Invalid app slug' }, { status: 400 });

	await auditLog({ user: locals.user, action: 'update', target: slug });
	const result = await api.updateApp(slug);
	return json(result);
};
