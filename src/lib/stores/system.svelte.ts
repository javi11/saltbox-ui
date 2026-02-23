let refreshInterval = $state(30000);

export function getSystemStore() {
	return {
		get refreshInterval() { return refreshInterval; },
		set refreshInterval(v: number) { refreshInterval = v; },
	};
}
