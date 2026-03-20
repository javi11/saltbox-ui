import type { RequestHandler } from './$types';
import { api } from '$lib/server/api';
import { sseResponse } from '$lib/server/sse';

export const GET: RequestHandler = () => {
	return sseResponse((send) => {
		let stopped = false;

		async function tick() {
			if (stopped) return;
			try {
				const health = await api.getSystemHealth();
				send('health', health);
			} catch (e) {
				console.error('[sse:system] Failed to fetch health:', e);
			}
		}

		// Send immediately, then every 5s
		tick();
		const timer = setInterval(tick, 5_000);

		return () => {
			stopped = true;
			clearInterval(timer);
		};
	});
};
