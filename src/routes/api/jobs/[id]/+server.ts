import { json } from '@sveltejs/kit';
import { getJob } from '$lib/server/jobs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const job = getJob(params.id);
	if (!job) return json({ error: 'Job not found' }, { status: 404 });

	return json({
		id: job.id,
		status: job.status,
		exitCode: job.exitCode,
		startedAt: job.startedAt,
		finishedAt: job.finishedAt,
		output: job.status !== 'running' ? job.output.slice(-20) : undefined
	});
};
