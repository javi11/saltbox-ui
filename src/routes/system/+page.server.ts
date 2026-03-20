import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [routes, backups, services] = await Promise.all([
		api.getTraefikRoutes(),
		api.getBackups(),
		api.getServiceStatuses()
	]);
	return { routes, backups, services };
};
