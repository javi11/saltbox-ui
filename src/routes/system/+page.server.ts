import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [health, routes, backups] = await Promise.all([
		api.getSystemHealth(),
		api.getTraefikRoutes(),
		api.getBackups()
	]);
	return { health, routes, backups, services: api.getServiceStatuses() };
};
