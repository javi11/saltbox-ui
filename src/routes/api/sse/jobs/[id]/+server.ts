import type { RequestHandler } from './$types';
import { getJob, onJobOutput, offJobOutput, onJobDone, offJobDone } from '$lib/server/jobs';
import { sseResponse } from '$lib/server/sse';

export const GET: RequestHandler = ({ params }) => {
	const job = getJob(params.id);

	if (!job) {
		return new Response(JSON.stringify({ error: 'Job not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return sseResponse((send) => {
		// Send current status
		send('status', { status: job.status, exitCode: job.exitCode });

		// Send buffered output (last 200 lines to avoid huge initial payload)
		if (job.output.length > 0) {
			const tail = job.output.slice(-200);
			send('output', { lines: tail });
		}

		// If already finished, close immediately
		if (job.status !== 'running') {
			send('done', { status: job.status, exitCode: job.exitCode });
			return () => {};
		}

		// Stream new output as it arrives
		const onOutput = (lines: string[]) => {
			send('output', { lines });
		};

		const onDone = () => {
			send('done', { status: job.status, exitCode: job.exitCode });
		};

		onJobOutput(params.id, onOutput);
		onJobDone(params.id, onDone);

		return () => {
			offJobOutput(params.id, onOutput);
			offJobDone(params.id, onDone);
		};
	});
};
