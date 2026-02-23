import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const containers = await api.getContainers();
	const running = containers.filter((c) => c.state === 'running');
	const stopped = containers.filter((c) => c.state === 'stopped');
	const errors = containers.filter((c) => c.state === 'error');
	const totalCpu = running.reduce((sum, c) => sum + c.cpu, 0);
	const totalMemory = running.reduce((sum, c) => sum + c.memory, 0);

	return {
		containers,
		stats: {
			total: containers.length,
			running: running.length,
			stopped: stopped.length,
			errors: errors.length,
			totalCpu,
			totalMemory
		}
	};
};
