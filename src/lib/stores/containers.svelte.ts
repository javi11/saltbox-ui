let selectedContainerId = $state<string | null>(null);
let logViewerOpen = $state(false);
let filterState = $state<'all' | 'running' | 'stopped' | 'error'>('all');

export function getContainersStore() {
	return {
		get selectedContainerId() { return selectedContainerId; },
		set selectedContainerId(v: string | null) { selectedContainerId = v; },
		get logViewerOpen() { return logViewerOpen; },
		set logViewerOpen(v: boolean) { logViewerOpen = v; },
		get filterState() { return filterState; },
		set filterState(v: 'all' | 'running' | 'stopped' | 'error') { filterState = v; },
		openLogs(id: string) {
			selectedContainerId = id;
			logViewerOpen = true;
		},
		closeLogs() {
			logViewerOpen = false;
		}
	};
}
