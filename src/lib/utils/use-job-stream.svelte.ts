import { createSSE } from './sse.svelte';

interface JobStreamState {
	readonly output: string[];
	readonly status: 'running' | 'completed' | 'failed' | null;
	readonly exitCode: number | undefined;
	readonly done: boolean;
	readonly connected: boolean;
	close: () => void;
}

export function useJobStream(jobId: string): JobStreamState {
	let output = $state<string[]>([]);
	let status = $state<'running' | 'completed' | 'failed' | null>(null);
	let exitCode = $state<number | undefined>(undefined);
	let done = $state(false);

	const sse = createSSE(`/api/sse/jobs/${jobId}`);

	sse.on('status', (data: unknown) => {
		const d = data as { status: string; exitCode?: number };
		status = d.status as typeof status;
		exitCode = d.exitCode;
	});

	sse.on('output', (data: unknown) => {
		const d = data as { lines: string[] };
		output = [...output, ...d.lines];
		// Cap client-side buffer
		if (output.length > 500) {
			output = output.slice(-500);
		}
	});

	sse.on('done', (data: unknown) => {
		const d = data as { status: string; exitCode?: number };
		status = d.status as typeof status;
		exitCode = d.exitCode;
		done = true;
		sse.close();
	});

	return {
		get output() { return output; },
		get status() { return status; },
		get exitCode() { return exitCode; },
		get done() { return done; },
		get connected() { return sse.connected; },
		close: () => sse.close()
	};
}
