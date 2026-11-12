import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const routes = api.getTraefikRoutes();
	const backups = api.getBackups();
	const services = api.getServiceStatuses();
	// Mark rejections handled while SvelteKit streams each panel independently.
	for (const task of [routes, backups, services]) void task.catch(() => {});
	return { routes, backups, services };
};
