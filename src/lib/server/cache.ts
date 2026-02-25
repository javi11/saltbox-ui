interface Entry<T> {
	value: T;
	expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const hit = store.get(key) as Entry<T> | undefined;
	if (hit && Date.now() < hit.expiresAt) return Promise.resolve(hit.value);
	return fn().then((v) => {
		store.set(key, { value: v, expiresAt: Date.now() + ttlMs });
		return v;
	});
}

export function invalidate(key: string): void {
	store.delete(key);
}
