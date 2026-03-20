import { onDestroy } from 'svelte';

type EventHandler = (data: unknown) => void;

interface SSEConnection {
	on: (event: string, handler: EventHandler) => void;
	close: () => void;
	readonly connected: boolean;
	readonly error: string | null;
}

export function createSSE(url: string): SSEConnection {
	let connected = $state(false);
	let error = $state<string | null>(null);
	let source: EventSource | null = null;
	let retryCount = 0;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let closed = false;
	const handlers = new Map<string, EventHandler>();

	function connect() {
		if (closed) return;

		source = new EventSource(url);

		source.onopen = () => {
			connected = true;
			error = null;
			retryCount = 0;
		};

		source.onerror = () => {
			connected = false;
			source?.close();
			source = null;

			if (closed) return;

			if (retryCount >= 10) {
				error = 'Max retries reached';
				return;
			}

			// Exponential backoff: 3s, 6s, 12s... capped at 30s
			const delay = Math.min(3000 * Math.pow(2, retryCount), 30_000);
			retryCount++;
			retryTimer = setTimeout(connect, delay);
		};

		// Register all handlers on the new source
		for (const [event, handler] of handlers) {
			source.addEventListener(event, ((e: MessageEvent) => {
				try {
					handler(JSON.parse(e.data));
				} catch {
					handler(e.data);
				}
			}) as EventListener);
		}
	}

	function on(event: string, handler: EventHandler) {
		handlers.set(event, handler);
		// If already connected, add to current source
		if (source) {
			source.addEventListener(event, ((e: MessageEvent) => {
				try {
					handler(JSON.parse(e.data));
				} catch {
					handler(e.data);
				}
			}) as EventListener);
		}
	}

	function close() {
		closed = true;
		clearTimeout(retryTimer);
		source?.close();
		source = null;
		connected = false;
	}

	// Handle page visibility
	function onVisibilityChange() {
		if (document.hidden) {
			source?.close();
			source = null;
			connected = false;
			clearTimeout(retryTimer);
		} else if (!closed) {
			connect();
		}
	}

	if (typeof window !== 'undefined') {
		document.addEventListener('visibilitychange', onVisibilityChange);
		connect();
	}

	onDestroy(() => {
		close();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', onVisibilityChange);
		}
	});

	return {
		on,
		close,
		get connected() {
			return connected;
		},
		get error() {
			return error;
		}
	};
}
