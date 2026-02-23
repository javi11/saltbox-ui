import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { validateContainerIdOrName } from '$lib/server/validate';
import { auditLog } from '$lib/server/audit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const id = validateContainerIdOrName(params.id);
	if (!id) return json({ success: false, error: 'Invalid container ID' }, { status: 400 });

	const { action } = await request.json();
	if (!['start', 'stop', 'restart'].includes(action)) {
		return json({ success: false, error: 'Invalid action' }, { status: 400 });
	}
	await auditLog({ user: locals.user, action: `container:${action}`, target: id });
	const result = await api.containerAction(id, action);
	return json(result);
};
