<script lang="ts">
	import type { MergeFSConfig } from '$lib/types/storage';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { config }: { config: MergeFSConfig } = $props();

	const modeVariant = (mode: string) => {
		if (mode === 'RW') return 'success' as const;
		if (mode === 'RO') return 'warning' as const;
		return 'default' as const;
	};
</script>

<Card>
	<h3 class="text-sm font-medium text-text mb-4">MergeFS Configuration</h3>

	<div class="space-y-4">
		<div>
			<span class="text-xs text-text-secondary uppercase tracking-wider">Mount Point</span>
			<p class="font-mono text-sm text-text mt-1">{config.mountPoint}</p>
		</div>

		<div>
			<span class="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Branches</span>
			<div class="space-y-2">
				{#each config.branches as branch}
					<div class="flex items-center justify-between bg-bg rounded-md px-3 py-2">
						<span class="font-mono text-sm text-text-secondary">{branch.path}</span>
						<Badge variant={modeVariant(branch.mode)}>{branch.mode}</Badge>
					</div>
				{/each}
			</div>
		</div>

		<div>
			<span class="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Policies</span>
			<div class="grid grid-cols-3 gap-2">
				{#each Object.entries(config.policy) as [key, value]}
					<div class="bg-bg rounded-md px-3 py-2 text-center">
						<span class="text-xs text-text-tertiary block">{key}</span>
						<span class="font-mono text-sm text-text">{value}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="flex justify-between text-sm">
			<span class="text-text-secondary">Cache Timeout</span>
			<span class="font-mono text-text-tertiary">{config.cacheTimeout}s</span>
		</div>
	</div>
</Card>
