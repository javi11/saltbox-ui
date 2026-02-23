interface ToastData {
	id: number;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

let sidebarCollapsed = $state(false);
let commandPaletteOpen = $state(false);
let toasts = $state<ToastData[]>([]);
let nextToastId = 0;

export function getUI() {
	return {
		get sidebarCollapsed() { return sidebarCollapsed; },
		set sidebarCollapsed(v: boolean) { sidebarCollapsed = v; },
		get commandPaletteOpen() { return commandPaletteOpen; },
		set commandPaletteOpen(v: boolean) { commandPaletteOpen = v; },
		get toasts() { return toasts; },
		toggleSidebar() { sidebarCollapsed = !sidebarCollapsed; },
		toggleCommandPalette() { commandPaletteOpen = !commandPaletteOpen; },
		addToast(message: string, type: ToastData['type'] = 'info') {
			const id = nextToastId++;
			toasts = [...toasts, { id, message, type }];
			setTimeout(() => {
				toasts = toasts.filter((t) => t.id !== id);
			}, 4000);
		},
		removeToast(id: number) {
			toasts = toasts.filter((t) => t.id !== id);
		}
	};
}
