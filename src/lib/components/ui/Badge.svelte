<script lang="ts">
	import type { Snippet } from 'svelte';

	let { variant = 'default', children }: { variant?: 'default' | 'success' | 'error' | 'warning' | 'info'; children: Snippet } = $props();

	const colors: Record<string, string> = {
		default: 'bg-surface-active text-text-secondary',
		success: 'bg-green/15 text-green',
		error: 'bg-red/15 text-red',
		warning: 'bg-yellow/15 text-yellow',
		info: 'bg-blue/15 text-blue'
	};
</script>

<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium font-mono {colors[variant]}">
	{@render children()}
</span>
