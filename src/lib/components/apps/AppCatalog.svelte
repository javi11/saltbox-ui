<script lang="ts">
	import type { AppCatalogEntry, AppSource, CustomAppDefinition } from '$lib/types/app';
	import { CATEGORY_LABELS } from '$lib/utils/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import CustomAppModal from './CustomAppModal.svelte';
	import { Download, Check, Loader2, Box, Puzzle, Wrench, Plus, Pencil, Trash2 } from 'lucide-svelte';

	let {
		catalog,
		open = $bindable(false),
		oninstall,
		oncreate,
		onupdate,
		ondelete
	}: {
		catalog: AppCatalogEntry[];
		open?: boolean;
		oninstall?: (slug: string) => Promise<void>;
		oncreate?: (def: CustomAppDefinition) => Promise<void>;
		onupdate?: (slug: string, def: CustomAppDefinition) => Promise<void>;
		ondelete?: (slug: string) => Promise<void>;
	} = $props();

	let search = $state('');
	let activeTab = $state<AppSource | 'custom'>('saltbox');
	let installingSlug = $state<string | null>(null);
	let deletingSlug = $state<string | null>(null);

	let customModalOpen = $state(false);
	let editingApp = $state<CustomAppDefinition | undefined>(undefined);

	async function handleInstall(slug: string) {
		installingSlug = slug;
		try {
			await oninstall?.(slug);
		} finally {
			installingSlug = null;
		}
	}

	async function handleDelete(slug: string) {
		deletingSlug = slug;
		try {
			await ondelete?.(slug);
		} finally {
			deletingSlug = null;
		}
	}

	function openCreateModal() {
		editingApp = undefined;
		customModalOpen = true;
	}

	function openEditModal(entry: AppCatalogEntry) {
		editingApp = {
			slug: entry.slug,
			name: entry.name,
			category: entry.category,
			description: entry.description,
			image: ''
		};
		customModalOpen = true;
	}

	async function handleSave(def: CustomAppDefinition) {
		if (editingApp) {
			await onupdate?.(editingApp.slug, def);
		} else {
			await oncreate?.(def);
		}
	}

	const saltboxApps = $derived(catalog.filter((a) => a.source === 'saltbox'));
	const sandboxApps = $derived(catalog.filter((a) => a.source === 'sandbox'));
	const customApps = $derived(catalog.filter((a) => a.source === 'custom'));

	const filtered = $derived.by(() => {
		if (activeTab === 'custom') {
			if (search.length === 0) return customApps;
			const q = search.toLowerCase();
			return customApps.filter(
				(a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
			);
		}
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
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px {activeTab === 'custom'
					? 'border-amber text-amber'
					: 'border-transparent text-text-tertiary hover:text-text'}"
				onclick={() => (activeTab = 'custom')}
			>
				<Wrench size={14} />
				Custom
				<span
					class="ml-1 text-xs px-1.5 py-0.5 rounded-full {activeTab === 'custom'
						? 'bg-amber/15 text-amber'
						: 'bg-surface-active text-text-tertiary'}">{customApps.length}</span
				>
			</button>
		</div>

		{#if activeTab === 'custom'}
			<div class="flex items-center gap-2">
				<div class="flex-1">
					<SearchBar bind:value={search} placeholder="Search custom apps..." />
				</div>
				<Button variant="primary" size="sm" onclick={openCreateModal}>
					<Plus size={13} /> Add
				</Button>
			</div>
		{:else}
			<SearchBar bind:value={search} placeholder="Search {activeTab} roles..." />
		{/if}

		<div class="max-h-80 overflow-y-auto space-y-1">
			{#if activeTab === 'custom' && filtered.length === 0 && search.length === 0}
				<div class="flex flex-col items-center justify-center py-8 gap-3 text-center">
					<Wrench size={28} class="text-text-tertiary" />
					<p class="text-sm text-text-tertiary">No custom apps yet.</p>
					<Button variant="primary" size="sm" onclick={openCreateModal}>
						<Plus size={13} /> Add custom app
					</Button>
				</div>
			{:else}
				{#each filtered as entry (entry.slug)}
					<div
						class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-hover transition-colors"
					>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-text">{entry.name}</span>
								<span class="text-xs text-text-tertiary">{CATEGORY_LABELS[entry.category]}</span>
							</div>
							<p class="text-xs text-text-tertiary mt-0.5 truncate">{entry.description}</p>
						</div>
						<div class="flex items-center gap-1.5 shrink-0 ml-2">
							{#if entry.source === 'custom'}
								<button
									class="p-1 text-text-tertiary hover:text-amber transition-colors cursor-pointer"
									title="Edit definition"
									onclick={() => openEditModal(entry)}
								>
									<Pencil size={13} />
								</button>
								<button
									class="p-1 text-text-tertiary hover:text-red transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
									title="Delete definition"
									disabled={deletingSlug === entry.slug}
									onclick={() => handleDelete(entry.slug)}
								>
									{#if deletingSlug === entry.slug}
										<Loader2 size={13} class="animate-spin" />
									{:else}
										<Trash2 size={13} />
									{/if}
								</button>
							{/if}
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
					</div>
				{:else}
					<p class="text-sm text-text-tertiary text-center py-6">
						{search.length > 0
							? `No ${activeTab} apps matching "${search}"`
							: `No ${activeTab} roles found`}
					</p>
				{/each}
			{/if}
		</div>
	</div>
</Modal>

<CustomAppModal
	bind:open={customModalOpen}
	existing={editingApp}
	onsave={handleSave}
/>
