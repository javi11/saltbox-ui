import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { validateContainerIdOrName, clampLogCount } from '$lib/server/validate';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const id = validateContainerIdOrName(params.id);
	if (!id) return json({ error: 'Invalid container ID' }, { status: 400 });

	const count = clampLogCount(url.searchParams.get('count'));
	const logs = await api.getContainerLogs(id, count);
	return json(logs);
};
