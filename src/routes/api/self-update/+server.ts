import { json } from '@sveltejs/kit';
import { getSelfVersion, getLatestRelease, selfUpdate } from '$lib/server/self-update';
import { auditLog } from '$lib/server/audit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const [version, latestRelease] = await Promise.all([getSelfVersion(), getLatestRelease()]);
	return json({ ...version, latestRelease });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { channel } = await request.json();

	if (channel !== 'dev' && channel !== 'release') {
		return json({ success: false, error: 'Invalid channel. Must be "dev" or "release".' }, { status: 400 });
	}

	try {
		await auditLog({ user: locals.user, action: `selfUpdate:${channel}` });
		const job = selfUpdate(channel as 'dev' | 'release');
		return json({ success: true, jobId: job.id });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		return json({ success: false, error: message }, { status: 500 });
	}
};
