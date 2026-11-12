import { expect, test } from 'bun:test';
import { waitForJob } from '../src/lib/utils/wait-for-job';

test('job monitoring works from an async event handler and waits for completion', async () => {
	let requests = 0;
	const fetchJob = (async () => {
		requests++;
		return Response.json({ status: requests < 2 ? 'running' : 'completed', exitCode: 0 });
	});
	const result = await waitForJob('job-1', { fetch: fetchJob, intervalMs: 0 });
	expect(result.status).toBe('completed');
	expect(requests).toBe(2);
});

test('a temporary connection failure does not report the running job as failed', async () => {
	let requests = 0;
	const fetchJob = (async () => {
		if (++requests === 1) throw new TypeError('network down');
		return Response.json({ status: 'failed', exitCode: 2, output: ['Image pull failed'] });
	});
	const result = await waitForJob('job-2', { fetch: fetchJob, intervalMs: 0 });
	expect(result.status).toBe('failed');
	expect(result.output).toEqual(['Image pull failed']);
});

test('leaving a page aborts monitoring without cancelling the server job', async () => {
	const controller = new AbortController();
	controller.abort();
	await expect(waitForJob('job-3', { signal: controller.signal })).rejects.toThrow();
});
