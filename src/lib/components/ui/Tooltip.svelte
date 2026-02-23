<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		text,
		children
	}: {
		text: string;
		children: Snippet;
	} = $props();
</script>

<div class="relative group inline-flex">
	{@render children()}
	<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-surface-active border border-border rounded-md text-xs text-text whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
		{text}
	</div>
</div>
