import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { deleteData } = await request.json();
	const result = await api.uninstallApp(params.slug, deleteData === true);
	return json(result);
};
