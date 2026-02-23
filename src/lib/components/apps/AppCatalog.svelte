<script lang="ts">
	import type { AppCatalogEntry } from '$lib/types/app';
	import { CATEGORY_LABELS } from '$lib/utils/constants';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { Download, Check, Loader2 } from 'lucide-svelte';

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
	let installingSlug = $state<string | null>(null);

	async function handleInstall(slug: string) {
		installingSlug = slug;
		try {
			await oninstall?.(slug);
		} finally {
			installingSlug = null;
		}
	}

	const filtered = $derived(
		search.length === 0
			? catalog
			: catalog.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
	);
</script>

<Modal bind:open title="Install App">
	<div class="space-y-4">
		<SearchBar bind:value={search} placeholder="Search 106+ roles..." />
		<div class="max-h-80 overflow-y-auto space-y-1">
			{#each filtered as entry (entry.slug)}
				<div class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-hover transition-colors">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-text">{entry.name}</span>
							<span class="text-xs text-text-tertiary">{CATEGORY_LABELS[entry.category]}</span>
							{#if entry.official}
								<Badge variant="info">official</Badge>
							{/if}
						</div>
						<p class="text-xs text-text-tertiary mt-0.5">{entry.description}</p>
					</div>
					{#if entry.installed}
						<span class="flex items-center gap-1 text-xs text-green">
							<Check size={14} /> Installed
						</span>
					{:else}
						<Button size="sm" variant="primary" disabled={installingSlug === entry.slug} onclick={() => handleInstall(entry.slug)}>
							{#if installingSlug === entry.slug}
								<Loader2 size={12} class="animate-spin" /> Installing...
							{:else}
								<Download size={12} /> Install
							{/if}
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</Modal>
