<script lang="ts">
	import { Search } from 'lucide-svelte';

	let {
		value = $bindable(''),
		placeholder = 'Search...'
	}: {
		value?: string;
		placeholder?: string;
	} = $props();
</script>

<div class="relative">
	<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
	<input
		type="text"
		bind:value
		{placeholder}
		class="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 transition-colors duration-150"
	/>
</div>
