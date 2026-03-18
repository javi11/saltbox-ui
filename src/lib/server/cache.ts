interface Entry<T> {
	value: T;
	expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const hit = store.get(key) as Entry<T> | undefined;
	if (hit && Date.now() < hit.expiresAt) return Promise.resolve(hit.value);

	// Stale entry exists — return it immediately, refresh in background
	if (hit) {
		if (!pending.has(key)) {
			const p = fn()
				.then((v) => {
					store.set(key, { value: v, expiresAt: Date.now() + ttlMs });
					pending.delete(key);
					return v;
				})
				.catch(() => {
					pending.delete(key);
					return hit.value;
				});
			pending.set(key, p);
		}
		return Promise.resolve(hit.value);
	}

	// No entry at all — must wait (deduplicate concurrent requests)
	const existing = pending.get(key);
	if (existing) return existing as Promise<T>;

	const p = fn().then((v) => {
		store.set(key, { value: v, expiresAt: Date.now() + ttlMs });
		pending.delete(key);
		return v;
	});
	pending.set(key, p);
	return p as Promise<T>;
}

export function invalidate(key: string): void {
	store.delete(key);
}
