export interface JobResult {
	status: 'running' | 'completed' | 'failed';
	exitCode?: number;
	output?: string[];
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const abort = () => {
			clearTimeout(timer);
			reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
		};
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', abort);
			resolve();
		}, ms);
		signal?.addEventListener('abort', abort, { once: true });
		if (signal?.aborted) abort();
	});
}

// No component lifecycle calls: safe to await from click handlers. Jobs keep
// running on the server if the page is closed or its connection is interrupted.
export async function waitForJob(
	id: string,
	options: { signal?: AbortSignal; intervalMs?: number; fetch?: (input: string, init?: RequestInit) => Promise<Response> } = {}
): Promise<JobResult> {
	const { signal, intervalMs = 1500, fetch: fetchJob = fetch } = options;
	let failures = 0;
	while (true) {
		signal?.throwIfAborted();
		let response: Response | undefined;
		try {
			const timeout = AbortSignal.timeout(10_000);
			response = await fetchJob(`/api/jobs/${encodeURIComponent(id)}`, {
				signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
				cache: 'no-store'
			});
			if (!response.ok) throw new Error(`Cannot check job (${response.status})`);
			const job: JobResult = await response.json();
			if (!['running', 'completed', 'failed'].includes(job.status)) throw new Error('Invalid job response');
			failures = 0;
			if (job.status !== 'running') return job;
		} catch (error) {
			signal?.throwIfAborted();
			if (response && [401, 403, 404].includes(response.status)) throw error;
			if (++failures >= 5) throw new Error('Connection lost while checking job. The operation may still be running.');
		}
		await delay(intervalMs * Math.max(1, failures), signal);
	}
}

export async function requestJob(url: string, signal?: AbortSignal): Promise<JobResult> {
	const response = await fetch(url, { method: 'POST', signal });
	const result = await response.json().catch(() => null);
	if (!response.ok || !result?.success || !result.jobId) {
		throw new Error(result?.error ?? result?.output ?? `Unable to start operation (${response.status})`);
	}
	return waitForJob(result.jobId, { signal });
}

export function jobFailure(job: JobResult): string {
	return job.output?.slice(-3).join('\n') || `exit code ${job.exitCode ?? 'unknown'}`;
}
