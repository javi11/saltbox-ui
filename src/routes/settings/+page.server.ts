import { getVersionStatus } from '$lib/server/self-update';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const versionStatus = await getVersionStatus();
	return { versionStatus };
};
