import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const result = await api.installApp(params.slug);
	return json(result);
};
