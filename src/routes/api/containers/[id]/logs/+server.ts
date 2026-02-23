import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const count = parseInt(url.searchParams.get('count') || '100');
	const logs = await api.getContainerLogs(params.id, count);
	return json(logs);
};
