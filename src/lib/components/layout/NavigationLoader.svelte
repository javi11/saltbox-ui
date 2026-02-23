<script lang="ts">
	import { navigating } from '$app/stores';
</script>

{#if $navigating}
	<div class="fixed top-0 left-0 right-0 z-50 h-0.5 bg-surface overflow-hidden">
		<div class="h-full w-1/3 bg-amber animate-shimmer rounded-full"></div>
	</div>
{/if}
