<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, LayoutDashboard, Grid3x3, HardDrive, Container, Activity, RotateCw, Download, Trash2 } from 'lucide-svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import type { Component } from 'svelte';

	const ui = getUI();

	let query = $state('');
	let selectedIndex = $state(0);

	interface PaletteItem {
		id: string;
		label: string;
		category: string;
		icon: Component<{ size?: number; class?: string }>;
		action: () => void;
	}

	const items: PaletteItem[] = [
		{ id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigation', icon: LayoutDashboard, action: () => navigate('/') },
		{ id: 'nav-apps', label: 'Go to Apps', category: 'Navigation', icon: Grid3x3, action: () => navigate('/apps') },
		{ id: 'nav-storage', label: 'Go to Storage', category: 'Navigation', icon: HardDrive, action: () => navigate('/storage') },
		{ id: 'nav-docker', label: 'Go to Docker', category: 'Navigation', icon: Container, action: () => navigate('/docker') },
		{ id: 'nav-system', label: 'Go to System', category: 'Navigation', icon: Activity, action: () => navigate('/system') },
		{ id: 'act-update', label: 'Update All Apps', category: 'Actions', icon: Download, action: () => runAction('Update All') },
		{ id: 'act-restart-traefik', label: 'Restart Traefik', category: 'Actions', icon: RotateCw, action: () => runAction('Restart Traefik') },
		{ id: 'act-clear-logs', label: 'Clear Logs', category: 'Actions', icon: Trash2, action: () => runAction('Clear Logs') },
	];

	const filtered = $derived(
		query.length === 0
			? items
			: items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
	);

	function navigate(path: string) {
		ui.commandPaletteOpen = false;
		query = '';
		goto(path);
	}

	function runAction(name: string) {
		ui.commandPaletteOpen = false;
		query = '';
		ui.addToast(`${name} triggered`, 'info');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			ui.commandPaletteOpen = false;
			query = '';
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && filtered[selectedIndex]) {
			filtered[selectedIndex].action();
		}
	}

	$effect(() => {
		if (query) selectedIndex = 0;
	});
</script>

{#if ui.commandPaletteOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onkeydown={handleKeydown}>
		<div class="absolute inset-0 bg-black/60" role="button" tabindex="-1" onclick={() => { ui.commandPaletteOpen = false; query = ''; }} onkeydown={(e) => { if (e.key === 'Escape') { ui.commandPaletteOpen = false; query = ''; }}}></div>
		<div class="relative w-full max-w-lg bg-surface border border-border rounded-lg overflow-hidden animate-fade-in">
			<!-- Search input -->
			<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
				<Search size={16} class="text-text-tertiary flex-shrink-0" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					bind:value={query}
					placeholder="Type a command or search..."
					autofocus
					class="flex-1 bg-transparent text-sm text-text placeholder:text-text-tertiary focus:outline-none"
				/>
			</div>

			<!-- Results -->
			<div class="max-h-72 overflow-y-auto py-2">
				{#if filtered.length === 0}
					<div class="px-4 py-8 text-center text-sm text-text-tertiary">No results found</div>
				{:else}
					{#each filtered as item, i}
						<button
							class="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors cursor-pointer
								{i === selectedIndex ? 'bg-surface-hover text-text' : 'text-text-secondary hover:bg-surface-hover'}"
							onclick={() => item.action()}
							onmouseenter={() => (selectedIndex = i)}
						>
							<item.icon size={16} class="flex-shrink-0 {i === selectedIndex ? 'text-amber' : 'text-text-tertiary'}" />
							<span class="flex-1">{item.label}</span>
							<span class="text-xs text-text-tertiary">{item.category}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
