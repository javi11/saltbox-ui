import { json } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { auditLog } from '$lib/server/audit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { action } = await request.json();

	switch (action) {
		case 'updateAll':
			await auditLog({ user: locals.user, action: 'updateAll' });
			return json(await api.updateAll());
		case 'backupNow':
			await auditLog({ user: locals.user, action: 'backupNow' });
			return json(await api.backupNow());
		case 'restartTraefik':
			await auditLog({ user: locals.user, action: 'restartTraefik' });
			return json(await api.restartTraefik());
		case 'clearLogs':
			await auditLog({ user: locals.user, action: 'clearLogs' });
			return json(await api.clearLogs());
		default:
			return json({ success: false, error: 'Unknown action' }, { status: 400 });
	}
};
