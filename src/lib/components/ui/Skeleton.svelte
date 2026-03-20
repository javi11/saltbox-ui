<script lang="ts">
	let { class: className = '', lines = 1, height = 'h-4', width = 'w-full' }: {
		class?: string;
		lines?: number;
		height?: string;
		width?: string;
	} = $props();
</script>

{#each Array(lines) as _}
	<div class="animate-pulse rounded bg-surface-hover {height} {width} {className}"></div>
{/each}
