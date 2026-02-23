import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { validateSlug } from '$lib/server/validate';
import { auditLog } from '$lib/server/audit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const slug = validateSlug(params.slug);
	if (!slug) return json({ success: false, error: 'Invalid app slug' }, { status: 400 });

	const { deleteData } = await request.json();
	await auditLog({ user: locals.user, action: 'delete', target: slug, detail: deleteData ? 'with data removal' : 'container only' });
	const result = await api.uninstallApp(slug, deleteData === true);
	return json(result);
};
