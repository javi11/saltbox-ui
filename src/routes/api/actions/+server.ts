import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { action } = await request.json();

	switch (action) {
		case 'updateAll':
			return json(await api.updateAll());
		case 'backupNow':
			return json(await api.backupNow());
		case 'restartTraefik':
			return json(await api.restartTraefik());
		case 'clearLogs':
			return json(await api.clearLogs());
		default:
			return json({ success: false, error: 'Unknown action' }, { status: 400 });
	}
};
