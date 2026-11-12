import { api } from '$lib/server/api';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const app = await api.getApp(params.slug);
	if (!app) throw error(404, 'App not found');
	// Logs must not hold up the app controls or turn a log timeout into a 500.
	const logs = api.getContainerLogs(params.slug);
	void logs.catch(() => {});
	return { app, logs };
};
