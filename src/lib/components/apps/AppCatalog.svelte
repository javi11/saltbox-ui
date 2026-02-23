<script lang="ts">
	import type { AppCatalogEntry, AppSource } from '$lib/types/app';
	import { CATEGORY_LABELS } from '$lib/utils/constants';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { Download, Check, Loader2, Box, Puzzle } from 'lucide-svelte';

	let {
		catalog,
		open = $bindable(false),
		oninstall
	}: {
		catalog: AppCatalogEntry[];
		open?: boolean;
		oninstall?: (slug: string) => Promise<void>;
	} = $props();

	let search = $state('');
	let activeTab = $state<AppSource>('saltbox');
	let installingSlug = $state<string | null>(null);

	async function handleInstall(slug: string) {
		installingSlug = slug;
		try {
			await oninstall?.(slug);
		} finally {
			installingSlug = null;
		}
	}

	const saltboxApps = $derived(catalog.filter((a) => a.source === 'saltbox'));
	const sandboxApps = $derived(catalog.filter((a) => a.source === 'sandbox'));

	const filtered = $derived.by(() => {
		const source = activeTab === 'saltbox' ? saltboxApps : sandboxApps;
		if (search.length === 0) return source;
		const q = search.toLowerCase();
		return source.filter(
			(a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
		);
	});
</script>

<Modal bind:open title="Install App">
	<div class="space-y-4">
		<div class="flex gap-1 border-b border-border">
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px {activeTab === 'saltbox'
					? 'border-amber text-amber'
					: 'border-transparent text-text-tertiary hover:text-text'}"
				onclick={() => (activeTab = 'saltbox')}
			>
				<Box size={14} />
				Saltbox
				<span
					class="ml-1 text-xs px-1.5 py-0.5 rounded-full {activeTab === 'saltbox'
						? 'bg-amber/15 text-amber'
						: 'bg-surface-active text-text-tertiary'}">{saltboxApps.length}</span
				>
			</button>
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px {activeTab === 'sandbox'
					? 'border-amber text-amber'
					: 'border-transparent text-text-tertiary hover:text-text'}"
				onclick={() => (activeTab = 'sandbox')}
			>
				<Puzzle size={14} />
				Sandbox
				<span
					class="ml-1 text-xs px-1.5 py-0.5 rounded-full {activeTab === 'sandbox'
						? 'bg-amber/15 text-amber'
						: 'bg-surface-active text-text-tertiary'}">{sandboxApps.length}</span
				>
			</button>
		</div>

		<SearchBar bind:value={search} placeholder="Search {activeTab} roles..." />

		<div class="max-h-80 overflow-y-auto space-y-1">
			{#each filtered as entry (entry.slug)}
				<div
					class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-hover transition-colors"
				>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-text">{entry.name}</span>
							<span class="text-xs text-text-tertiary">{CATEGORY_LABELS[entry.category]}</span>
						</div>
						<p class="text-xs text-text-tertiary mt-0.5">{entry.description}</p>
					</div>
					{#if entry.installed}
						<span class="flex items-center gap-1 text-xs text-green">
							<Check size={14} /> Installed
						</span>
					{:else}
						<Button
							size="sm"
							variant="primary"
							disabled={installingSlug === entry.slug}
							onclick={() => handleInstall(entry.slug)}
						>
							{#if installingSlug === entry.slug}
								<Loader2 size={12} class="animate-spin" /> Installing...
							{:else}
								<Download size={12} /> Install
							{/if}
						</Button>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-text-tertiary text-center py-6">
					{search.length > 0
						? `No ${activeTab} roles matching "${search}"`
						: `No ${activeTab} roles found`}
				</p>
			{/each}
		</div>
	</div>
</Modal>
