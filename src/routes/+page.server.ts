import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [health, containers] = await Promise.all([
		api.getSystemHealth(),
		api.getContainers()
	]);

	const runningContainers = containers.filter((c) => c.state === 'running');
	const topContainers = [...runningContainers]
		.sort((a, b) => b.cpu - a.cpu)
		.slice(0, 5);

	return { health, runningCount: runningContainers.length, totalCount: containers.length, topContainers, activity: api.getActivity() };
};
