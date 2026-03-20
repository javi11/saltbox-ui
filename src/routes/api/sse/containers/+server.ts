import type { RequestHandler } from './$types';
import { api } from '$lib/server/api';
import { sseResponse } from '$lib/server/sse';

export const GET: RequestHandler = () => {
	return sseResponse((send) => {
		let stopped = false;

		async function tick() {
			if (stopped) return;
			try {
				const containers = await api.getContainers();
				send('containers', containers);
			} catch (e) {
				console.error('[sse:containers] Failed to fetch containers:', e);
			}
		}

		// Send immediately, then every 10s
		tick();
		const timer = setInterval(tick, 10_000);

		return () => {
			stopped = true;
			clearInterval(timer);
		};
	});
};
