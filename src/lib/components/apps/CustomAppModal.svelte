<script lang="ts">
	import type { CustomAppDefinition, AppCategory } from '$lib/types/app';
	import { CATEGORY_LABELS } from '$lib/utils/constants';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Plus, Trash2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		existing = undefined,
		onsave,
		oncancel
	}: {
		open?: boolean;
		existing?: CustomAppDefinition;
		onsave?: (def: CustomAppDefinition) => Promise<void>;
		oncancel?: () => void;
	} = $props();

	const CATEGORIES = Object.entries(CATEGORY_LABELS) as [AppCategory, string][];
	const RESTART_OPTIONS = [
		{ value: 'unless-stopped', label: 'Unless stopped' },
		{ value: 'always', label: 'Always' },
		{ value: 'on-failure', label: 'On failure' },
		{ value: 'no', label: 'Never' }
	] as const;

	let name = $state('');
	let slug = $state('');
	let slugManuallyEdited = $state(false);
	let category = $state<AppCategory>('tools');
	let description = $state('');
	let image = $state('');
	let port = $state('');
	let restart = $state<CustomAppDefinition['restart']>('unless-stopped');
	let volumes = $state<{ id: number; value: string }[]>([]);
	let envVars = $state<{ id: number; key: string; value: string }[]>([]);
	let nextId = $state(0);
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) {
			if (existing) {
				name = existing.name;
				slug = existing.slug;
				slugManuallyEdited = true;
				category = existing.category;
				description = existing.description ?? '';
				image = existing.image;
				port = existing.port ? String(existing.port) : '';
				restart = existing.restart ?? 'unless-stopped';
				volumes = (existing.volumes ?? []).map((v) => ({ id: nextId++, value: v }));
				envVars = Object.entries(existing.environment ?? {}).map(([k, v]) => ({
					id: nextId++,
					key: k,
					value: v
				}));
			} else {
				name = '';
				slug = '';
				slugManuallyEdited = false;
				category = 'tools';
				description = '';
				image = '';
				port = '';
				restart = 'unless-stopped';
				volumes = [];
				envVars = [];
				error = '';
			}
		}
	});

	function derivedSlug(n: string): string {
		return n
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function handleNameInput(e: Event) {
		name = (e.target as HTMLInputElement).value;
		if (!slugManuallyEdited) {
			slug = derivedSlug(name);
		}
	}

	function handleSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
		slugManuallyEdited = true;
	}

	function addVolume() {
		volumes = [...volumes, { id: nextId++, value: '' }];
	}

	function removeVolume(id: number) {
		volumes = volumes.filter((v) => v.id !== id);
	}

	function addEnvVar() {
		envVars = [...envVars, { id: nextId++, key: '', value: '' }];
	}

	function removeEnvVar(id: number) {
		envVars = envVars.filter((e) => e.id !== id);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (!name.trim()) { error = 'Name is required'; return; }
		if (!slug.trim()) { error = 'Slug is required'; return; }
		if (!/^[a-z0-9-]+$/.test(slug)) { error = 'Slug may only contain lowercase letters, numbers, and hyphens'; return; }
		if (!image.trim()) { error = 'Docker image is required'; return; }

		const portNum = port ? parseInt(port, 10) : undefined;
		if (port && (isNaN(portNum!) || portNum! < 1 || portNum! > 65535)) {
			error = 'Port must be a valid number between 1 and 65535';
			return;
		}

		const env: Record<string, string> = {};
		for (const ev of envVars) {
			if (ev.key.trim()) env[ev.key.trim()] = ev.value;
		}

		const def: CustomAppDefinition = {
			slug: slug.trim(),
			name: name.trim(),
			category,
			description: description.trim(),
			image: image.trim(),
			...(portNum ? { port: portNum } : {}),
			...(volumes.filter((v) => v.value.trim()).length
				? { volumes: volumes.filter((v) => v.value.trim()).map((v) => v.value.trim()) }
				: {}),
			...(Object.keys(env).length ? { environment: env } : {}),
			restart
		};

		saving = true;
		try {
			await onsave?.(def);
			open = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save';
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		open = false;
		oncancel?.();
	}
</script>

<Modal bind:open title={existing ? 'Edit Custom App' : 'Add Custom App'}>
	<form class="space-y-4" onsubmit={handleSubmit}>
		<!-- Name + Slug -->
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-1">
				<label class="block text-xs font-medium text-text-secondary" for="ca-name">
					Name <span class="text-red">*</span>
				</label>
				<input
					id="ca-name"
					type="text"
					class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50"
					placeholder="My App"
					value={name}
					oninput={handleNameInput}
					required
				/>
			</div>
			<div class="space-y-1">
				<label class="block text-xs font-medium text-text-secondary" for="ca-slug">
					Slug <span class="text-red">*</span>
				</label>
				<input
					id="ca-slug"
					type="text"
					class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 font-mono"
					placeholder="my-app"
					value={slug}
					oninput={handleSlugInput}
					required
				/>
			</div>
		</div>

		<!-- Category + Restart -->
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-1">
				<label class="block text-xs font-medium text-text-secondary" for="ca-category">Category</label>
				<select
					id="ca-category"
					class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text focus:outline-none focus:border-amber/50 cursor-pointer"
					bind:value={category}
				>
					{#each CATEGORIES as [val, label]}
						<option value={val}>{label}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-1">
				<label class="block text-xs font-medium text-text-secondary" for="ca-restart">Restart policy</label>
				<select
					id="ca-restart"
					class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text focus:outline-none focus:border-amber/50 cursor-pointer"
					bind:value={restart}
				>
					{#each RESTART_OPTIONS as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Docker Image + Port -->
		<div class="grid grid-cols-3 gap-3">
			<div class="col-span-2 space-y-1">
				<label class="block text-xs font-medium text-text-secondary" for="ca-image">
					Docker image <span class="text-red">*</span>
				</label>
				<input
					id="ca-image"
					type="text"
					class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 font-mono"
					placeholder="nginx:latest"
					bind:value={image}
					required
				/>
			</div>
			<div class="space-y-1">
				<label class="block text-xs font-medium text-text-secondary" for="ca-port">Port</label>
				<input
					id="ca-port"
					type="number"
					min="1"
					max="65535"
					class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50"
					placeholder="8080"
					bind:value={port}
				/>
			</div>
		</div>

		<!-- Description -->
		<div class="space-y-1">
			<label class="block text-xs font-medium text-text-secondary" for="ca-desc">Description</label>
			<input
				id="ca-desc"
				type="text"
				class="w-full px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50"
				placeholder="Short description of the app"
				bind:value={description}
			/>
		</div>

		<!-- Volumes -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-text-secondary">Volumes</span>
				<button
					type="button"
					class="flex items-center gap-1 text-xs text-amber hover:text-amber/80 transition-colors cursor-pointer"
					onclick={addVolume}
				>
					<Plus size={12} /> Add volume
				</button>
			</div>
			{#each volumes as vol (vol.id)}
				<div class="flex items-center gap-2">
					<input
						type="text"
						class="flex-1 px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 font-mono"
						placeholder="/host/path:/container/path"
						bind:value={vol.value}
					/>
					<button
						type="button"
						class="text-text-tertiary hover:text-red transition-colors cursor-pointer shrink-0"
						onclick={() => removeVolume(vol.id)}
					>
						<Trash2 size={14} />
					</button>
				</div>
			{/each}
		</div>

		<!-- Environment Variables -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-text-secondary">Environment variables</span>
				<button
					type="button"
					class="flex items-center gap-1 text-xs text-amber hover:text-amber/80 transition-colors cursor-pointer"
					onclick={addEnvVar}
				>
					<Plus size={12} /> Add variable
				</button>
			</div>
			{#each envVars as ev (ev.id)}
				<div class="flex items-center gap-2">
					<input
						type="text"
						class="w-2/5 px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 font-mono"
						placeholder="KEY"
						bind:value={ev.key}
					/>
					<span class="text-text-tertiary text-xs shrink-0">=</span>
					<input
						type="text"
						class="flex-1 px-2.5 py-1.5 text-sm bg-surface-hover border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 font-mono"
						placeholder="value"
						bind:value={ev.value}
					/>
					<button
						type="button"
						class="text-text-tertiary hover:text-red transition-colors cursor-pointer shrink-0"
						onclick={() => removeEnvVar(ev.id)}
					>
						<Trash2 size={14} />
					</button>
				</div>
			{/each}
		</div>

		{#if error}
			<p class="text-xs text-red">{error}</p>
		{/if}

		<div class="flex justify-end gap-2 pt-1">
			<Button variant="default" onclick={handleCancel}>Cancel</Button>
			<Button variant="primary" disabled={saving}>
				{saving ? (existing ? 'Saving…' : 'Adding…') : (existing ? 'Save changes' : 'Add app')}
			</Button>
		</div>
	</form>
</Modal>
