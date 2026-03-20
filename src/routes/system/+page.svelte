<script lang="ts">
	import MetricsPanel from '$lib/components/system/MetricsPanel.svelte';
	import BackupStatus from '$lib/components/system/BackupStatus.svelte';
	import TraefikRoutes from '$lib/components/system/TraefikRoutes.svelte';
	import ServiceHealth from '$lib/components/system/ServiceHealth.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { createSSE } from '$lib/utils/sse.svelte';
	import type { SystemHealth } from '$lib/types/system';

	let { data } = $props();

	// Live health updates via SSE
	let liveHealth = $state<SystemHealth | null>(null);
	const healthSSE = createSSE('/api/sse/system');
	healthSSE.on('health', (d: unknown) => { liveHealth = d as SystemHealth; });
</script>

<svelte:head>
	<title>System — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-lg font-semibold text-text">System</h1>

	{#await data.services}
		<div class="bg-surface border border-border rounded-lg animate-pulse h-24"></div>
	{:then services}
		<ServiceHealth {services} />
	{/await}

	{#if liveHealth}
		<MetricsPanel health={liveHealth} />
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each Array(4) as _}
				<div class="bg-surface border border-border rounded-lg p-4 space-y-3">
					<Skeleton width="w-20" height="h-4" />
					<Skeleton height="h-3" />
					<Skeleton width="w-3/4" height="h-3" />
					<Skeleton height="h-2" />
				</div>
			{/each}
		</div>
	{/if}

	<BackupStatus backups={data.backups} />
	<TraefikRoutes routes={data.routes} />
</div>
