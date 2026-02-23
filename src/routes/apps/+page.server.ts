import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [apps, catalog] = await Promise.all([api.getApps(), api.getCatalog()]);
	return { apps, catalog };
};
