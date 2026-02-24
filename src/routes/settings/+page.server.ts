import { getSelfVersion, getLatestRelease } from '$lib/server/self-update';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [version, latestRelease] = await Promise.all([getSelfVersion(), getLatestRelease()]);
	return { version, latestRelease };
};
