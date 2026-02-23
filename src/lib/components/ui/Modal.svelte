<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		title = '',
		children
	}: {
		open?: boolean;
		title?: string;
		children: Snippet;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		onkeydown={handleKeydown}
	>
		<div class="absolute inset-0 bg-black/60" role="button" tabindex="-1" onclick={() => (open = false)} onkeydown={handleKeydown}></div>
		<div class="relative bg-surface border border-border rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in">
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h2 class="text-base font-semibold text-text">{title}</h2>
				<button onclick={() => (open = false)} class="text-text-tertiary hover:text-text transition-colors cursor-pointer">
					<X size={18} />
				</button>
			</div>
			<div class="p-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
