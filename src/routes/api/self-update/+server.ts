import { json } from '@sveltejs/kit';
import { getVersionStatus } from '$lib/server/self-update';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const status = await getVersionStatus();
	return json(status);
};
