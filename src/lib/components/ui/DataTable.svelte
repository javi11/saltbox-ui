<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		columns,
		children
	}: {
		columns: { key: string; label: string; class?: string }[];
		children: Snippet;
	} = $props();
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border">
				{#each columns as col}
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider {col.class || ''}">{col.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{@render children()}
		</tbody>
	</table>
</div>
