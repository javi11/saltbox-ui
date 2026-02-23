import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { action } = await request.json();
	if (!['start', 'stop', 'restart'].includes(action)) {
		return json({ success: false, error: 'Invalid action' }, { status: 400 });
	}
	const result = await api.containerAction(params.slug, action);
	return json(result);
};
