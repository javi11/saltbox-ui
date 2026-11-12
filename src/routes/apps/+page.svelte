<script lang="ts">
	import AppGrid from '$lib/components/apps/AppGrid.svelte';
	import CategoryFilter from '$lib/components/apps/CategoryFilter.svelte';
	import AppCatalog from '$lib/components/apps/AppCatalog.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getAppsStore } from '$lib/stores/apps.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { Plus, LayoutGrid, List } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { requestJob, jobFailure } from '$lib/utils/wait-for-job';
	import { onDestroy } from 'svelte';
	import { createSSE } from '$lib/utils/sse.svelte';
	import type { Container } from '$lib/types/container';
	import type { AppCategory, CustomAppDefinition } from '$lib/types/app';

	let { data } = $props();
	const store = getAppsStore();
	const ui = getUI();

	let catalogOpen = $state(false);
	let updatingSlugs = $state<string[]>([]);
	const operations = new AbortController();
	onDestroy(() => operations.abort());
	let liveContainers = $state<Container[]>([]);
	const containerSSE = createSSE('/api/sse/containers');
	containerSSE.on('containers', (value) => { liveContainers = value as Container[]; });
	const appsWithMetrics = $derived(data.apps.map((app) => {
		const container = liveContainers.find((c) => c.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') === app.slug);
		return container ? { ...app, cpu: container.cpu, memory: container.memory, memoryLimit: container.memoryLimit } : app;
	}));

	const filtered = $derived(
		appsWithMetrics.filter((app) => {
			const matchesCategory = store.activeCategory === 'all' || app.category === store.activeCategory;
			const matchesSearch = store.searchQuery === '' || app.name.toLowerCase().includes(store.searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);

	async function handleAction(action: string, slug: string) {
		if (updatingSlugs.includes(slug)) return;
		updatingSlugs = [...updatingSlugs, slug];
		try {
			if (action === 'update') {
				ui.addToast(`Updating ${slug}...`, 'info');
				const job = await requestJob(`/api/apps/${slug}/update`, operations.signal);
				if (job.status !== 'completed') throw new Error(jobFailure(job));
			} else {
				const response = await fetch(`/api/apps/${slug}/action`, {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action }), signal: operations.signal
				});
				const result = await response.json();
				if (!response.ok || !result.success) throw new Error(result.error ?? 'Operation failed');
			}
			ui.addToast(`${action} ${slug} completed`, 'success');
			await invalidateAll();
		} catch (error) {
			if (!operations.signal.aborted) ui.addToast(`Failed to ${action} ${slug}: ${error instanceof Error ? error.message : error}`, 'error');
		} finally {
			updatingSlugs = updatingSlugs.filter((value) => value !== slug);
		}
	}

	async function handleInstall(slug: string) {
		ui.addToast(`Installing ${slug}...`, 'info');
		try {
			const job = await requestJob(`/api/apps/${slug}/install`, operations.signal);
			if (job.status !== 'completed') throw new Error(jobFailure(job));
			ui.addToast(`${slug} installed successfully`, 'success');
			await invalidateAll();
		} catch (error) {
			if (!operations.signal.aborted) ui.addToast(`Failed to install ${slug}: ${error instanceof Error ? error.message : error}`, 'error');
		}
	}

	async function handleCreateCustomApp(def: CustomAppDefinition) {
		const res = await fetch('/api/custom-apps', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(def)
		});
		const result = await res.json();
		if (result.success) {
			ui.addToast(`Custom app "${def.name}" added`, 'success');
			await invalidateAll();
		} else {
			throw new Error(result.error ?? 'Failed to create custom app');
		}
	}

	async function handleUpdateCustomApp(slug: string, def: CustomAppDefinition) {
		const res = await fetch(`/api/custom-apps/${slug}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(def)
		});
		const result = await res.json();
		if (result.success) {
			ui.addToast(`Custom app "${def.name}" updated`, 'success');
			await invalidateAll();
		} else {
			throw new Error(result.error ?? 'Failed to update custom app');
		}
	}

	async function handleDeleteCustomApp(slug: string) {
		const res = await fetch(`/api/custom-apps/${slug}`, { method: 'DELETE' });
		const result = await res.json();
		if (result.success) {
			ui.addToast(`Custom app "${slug}" removed`, 'success');
			await invalidateAll();
		} else {
			ui.addToast(result.error ?? `Failed to remove "${slug}"`, 'error');
		}
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

	<AppGrid apps={filtered} onaction={handleAction} {updatingSlugs} />

	<AppCatalog
		catalog={data.catalog}
		bind:open={catalogOpen}
		oninstall={handleInstall}
		oncreate={handleCreateCustomApp}
		onupdate={handleUpdateCustomApp}
		ondelete={handleDeleteCustomApp}
	/>
</div>
