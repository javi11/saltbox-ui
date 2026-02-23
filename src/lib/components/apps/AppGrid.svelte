<script lang="ts">
	import type { SaltboxApp } from '$lib/types/app';
	import AppCard from './AppCard.svelte';

	let { apps, onaction }: { apps: SaltboxApp[]; onaction?: (action: string, slug: string) => void } = $props();
</script>

{#if apps.length === 0}
	<div class="text-center py-12">
		<p class="text-sm text-text-tertiary">No apps found</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each apps as app (app.slug)}
			<AppCard {app} {onaction} />
		{/each}
	</div>
{/if}
