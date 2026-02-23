import { api } from '$lib/server/api';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [app, logs] = await Promise.all([
		api.getApp(params.slug),
		api.getContainerLogs(params.slug)
	]);
	if (!app) throw error(404, 'App not found');
	return { app, logs };
};
