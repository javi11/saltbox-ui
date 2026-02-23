<script lang="ts">
	import type { AppCategory } from '$lib/types/app';
	import { CATEGORY_LABELS } from '$lib/utils/constants';

	let { active = $bindable('all') }: { active?: AppCategory | 'all' } = $props();

	const categories: (AppCategory | 'all')[] = ['all', 'media', 'pvr', 'downloaders', 'tools', 'monitoring', 'network'];
</script>

<div class="flex flex-wrap gap-1.5">
	{#each categories as cat}
		<button
			class="px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer
				{active === cat ? 'bg-amber/15 text-amber border border-amber/30' : 'bg-surface-hover text-text-secondary border border-transparent hover:text-text'}"
			onclick={() => (active = cat)}
		>
			{cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
		</button>
	{/each}
</div>
