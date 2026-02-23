<script lang="ts">
	import AppGrid from '$lib/components/apps/AppGrid.svelte';
	import CategoryFilter from '$lib/components/apps/CategoryFilter.svelte';
	import AppCatalog from '$lib/components/apps/AppCatalog.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getAppsStore } from '$lib/stores/apps.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { Plus, LayoutGrid, List } from 'lucide-svelte';
	import type { AppCategory } from '$lib/types/app';

	let { data } = $props();
	const store = getAppsStore();
	const ui = getUI();

	let catalogOpen = $state(false);

	const filtered = $derived(
		data.apps.filter((app) => {
			const matchesCategory = store.activeCategory === 'all' || app.category === store.activeCategory;
			const matchesSearch = store.searchQuery === '' || app.name.toLowerCase().includes(store.searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);

	function handleAction(action: string, slug: string) {
		ui.addToast(`${action} ${slug}...`, 'info');
	}
</script>

<svelte:head>
	<title>Apps — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-semibold text-text">Apps</h1>
		<div class="flex items-center gap-2">
			<div class="flex items-center border border-border rounded-md">
				<button
					class="p-1.5 transition-colors cursor-pointer {store.viewMode === 'grid' ? 'text-amber bg-surface-hover' : 'text-text-tertiary hover:text-text'}"
					onclick={() => (store.viewMode = 'grid')}
				>
					<LayoutGrid size={16} />
				</button>
				<button
					class="p-1.5 transition-colors cursor-pointer {store.viewMode === 'list' ? 'text-amber bg-surface-hover' : 'text-text-tertiary hover:text-text'}"
					onclick={() => (store.viewMode = 'list')}
				>
					<List size={16} />
				</button>
			</div>
			<Button variant="primary" onclick={() => (catalogOpen = true)}>
				<Plus size={14} /> Install App
			</Button>
		</div>
	</div>

	<div class="flex flex-col sm:flex-row gap-4">
		<div class="w-full sm:w-64">
			<SearchBar bind:value={store.searchQuery} placeholder="Search apps..." />
		</div>
		<CategoryFilter bind:active={store.activeCategory} />
	</div>

	<AppGrid apps={filtered} onaction={handleAction} />

	<AppCatalog catalog={data.catalog} bind:open={catalogOpen} />
</div>
