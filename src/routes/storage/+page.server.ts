import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [mountTree, remotes, mergeFSConfig] = await Promise.all([
		api.getMountTree(),
		api.getRcloneRemotes(),
		api.getMergeFSConfig()
	]);
	return { mountTree, remotes, mergeFSConfig };
};
