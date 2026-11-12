interface Entry<T> {
	value: T;
	expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const hit = store.get(key) as Entry<T> | undefined;
	if (hit && Date.now() < hit.expiresAt) return Promise.resolve(hit.value);

	const existing = pending.get(key) as Promise<T> | undefined;
	if (existing) return hit ? Promise.resolve(hit.value) : existing;

	// Clear failed requests as well as successful ones. Only the current request
	// may publish a value: a mutation can invalidate a request still in flight.
	const load = async () => fn();
	const request = load()
		.then((value) => {
			if (pending.get(key) === request) {
				store.set(key, { value, expiresAt: Date.now() + ttlMs });
			}
			return value;
		})
		.finally(() => {
			if (pending.get(key) === request) pending.delete(key);
		});
	pending.set(key, request);

	if (hit) {
		void request.catch(() => {});
		return Promise.resolve(hit.value);
	}
	return request;
}

export function invalidate(key: string): void {
	store.delete(key);
	pending.delete(key);
}
