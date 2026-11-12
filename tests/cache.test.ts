import { expect, test } from 'bun:test';
import { cached, invalidate } from '../src/lib/server/cache';

test('a failed cold load can be retried', async () => {
	await expect(cached('retry', 1000, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
	expect(await cached('retry', 1000, async () => 'recovered')).toBe('recovered');
});

test('invalidating during a load prevents old data from repopulating the cache', async () => {
	let finish!: (value: string) => void;
	const old = cached('mutation', 1000, () => new Promise<string>((resolve) => { finish = resolve; }));
	invalidate('mutation');
	expect(await cached('mutation', 1000, async () => 'new')).toBe('new');
	finish('old');
	await old;
	expect(await cached('mutation', 1000, async () => 'unexpected')).toBe('new');
});

test('concurrent callers share the same request', async () => {
	let calls = 0;
	const load = async () => { calls++; return 'value'; };
	expect(await Promise.all([cached('shared', 1000, load), cached('shared', 1000, load)])).toEqual(['value', 'value']);
	expect(calls).toBe(1);
});
