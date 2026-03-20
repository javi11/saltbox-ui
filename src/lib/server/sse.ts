export type SSESend = (event: string, data: unknown) => void;
export type SSECleanup = () => void;
export type SSEInit = (send: SSESend) => SSECleanup;

export function sseResponse(init: SSEInit): Response {
	let cleanup: SSECleanup | undefined;
	let keepaliveTimer: ReturnType<typeof setInterval> | undefined;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			const send: SSESend = (event, data) => {
				try {
					controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
				} catch {
					// Stream already closed
				}
			};

			// 30s keepalive comments to prevent proxy timeouts
			keepaliveTimer = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': keepalive\n\n'));
				} catch {
					// Stream closed
				}
			}, 30_000);

			cleanup = init(send);
		},
		cancel() {
			clearInterval(keepaliveTimer);
			cleanup?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
}
