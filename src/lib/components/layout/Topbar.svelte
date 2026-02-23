<script lang="ts">
	import { page } from '$app/state';
	import { Command, Search } from 'lucide-svelte';
	import { getUI } from '$lib/stores/ui.svelte';

	let { hostname = 'saltbox-server', status = 'healthy' }: { hostname?: string; status?: string } = $props();
	const ui = getUI();

	const breadcrumb = $derived(() => {
		const path = page.url.pathname;
		if (path === '/') return 'Dashboard';
		const segments = path.split('/').filter(Boolean);
		return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ');
	});
</script>

<header class="h-12 bg-surface border-b border-border flex items-center justify-between px-4">
	<div class="flex items-center gap-2">
		<span class="text-sm text-text-secondary">{breadcrumb()}</span>
	</div>

	<div class="flex items-center gap-4">
		<!-- Cmd+K trigger -->
		<button
			onclick={() => ui.toggleCommandPalette()}
			class="flex items-center gap-2 px-2.5 py-1 bg-surface-hover border border-border rounded-md text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
		>
			<Search size={12} />
			<span>Search</span>
			<kbd class="flex items-center gap-0.5 text-[10px] font-mono opacity-60">
				<Command size={10} />K
			</kbd>
		</button>

		<!-- Server status -->
		<div class="flex items-center gap-2">
			<div
				class="w-2 h-2 rounded-full"
				class:bg-green={status === 'healthy'}
				class:bg-yellow={status === 'degraded'}
				class:bg-red={status === 'down'}
			></div>
			<span class="text-xs font-mono text-text-secondary">{hostname}</span>
		</div>
	</div>
</header>
