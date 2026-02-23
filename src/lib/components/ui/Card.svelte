<script lang="ts">
	import type { Snippet } from 'svelte';

	let { padding = 'md', children }: { padding?: 'none' | 'sm' | 'md' | 'lg'; children: Snippet } = $props();

	const paddings: Record<string, string> = {
		none: '',
		sm: 'p-3',
		md: 'p-4',
		lg: 'p-6'
	};
</script>

<div class="bg-surface border border-border rounded-lg {paddings[padding]}">
	{@render children()}
</div>
