<script lang="ts">
	import HealthCards from '$lib/components/dashboard/HealthCards.svelte';
	import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
	import StorageOverview from '$lib/components/dashboard/StorageOverview.svelte';
	import QuickActions from '$lib/components/dashboard/QuickActions.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { createSSE } from '$lib/utils/sse.svelte';
	import type { SystemHealth } from '$lib/types/system';
	import type { Container } from '$lib/types/container';

	let { data } = $props();

	// Live health updates via SSE
	let liveHealth = $state<SystemHealth | null>(null);
	const healthSSE = createSSE('/api/sse/system');
	healthSSE.on('health', (d: unknown) => { liveHealth = d as SystemHealth; });

	// Live container updates via SSE
	let liveContainers = $state<Container[] | null>(null);
	const containerSSE = createSSE('/api/sse/containers');
	containerSSE.on('containers', (d: unknown) => { liveContainers = d as Container[]; });

	const runningContainers = $derived(
		liveContainers ? liveContainers.filter((c) => c.state === 'running') : null
	);
	const topContainers = $derived(
		runningContainers
			? [...runningContainers].sort((a, b) => b.cpu - a.cpu).slice(0, 5)
			: null
	);
	const runningCount = $derived(runningContainers?.length ?? 0);
	const totalCount = $derived(liveContainers?.length ?? 0);
</script>

<svelte:head>
	<title>Dashboard — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-semibold text-text">Dashboard</h1>
		<div class="flex items-center gap-2 text-xs font-mono text-text-tertiary">
			{#if liveContainers}
				<span class="w-2 h-2 rounded-full bg-green"></span>
				{runningCount} / {totalCount} containers
			{:else}
				<Skeleton width="w-32" height="h-3" />
			{/if}
		</div>
	</div>

	<!-- Health metrics -->
	{#if liveHealth}
		<HealthCards health={liveHealth} />
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
			{#each Array(4) as _}
				<div class="bg-surface border border-border rounded-lg p-4 space-y-3">
					<Skeleton width="w-16" height="h-3" />
					<Skeleton width="w-24" height="h-6" />
					<Skeleton height="h-2" />
				</div>
			{/each}
		</div>
	{/if}

	<!-- Top containers -->
	<div class="bg-surface border border-border rounded-lg">
		<div class="px-4 py-3 border-b border-border">
			<h3 class="text-sm font-medium text-text">Top Containers by CPU</h3>
		</div>
		<div class="divide-y divide-border">
			{#if topContainers}
				{#each topContainers as container}
					<div class="px-4 py-2.5 flex items-center justify-between">
						<span class="text-sm font-mono text-text">{container.name}</span>
						<div class="flex items-center gap-4 text-xs font-mono text-text-secondary">
							<span>CPU {container.cpu.toFixed(1)}%</span>
							<span>MEM {formatBytes(container.memory)}</span>
						</div>
					</div>
				{/each}
			{:else}
				{#each Array(5) as _}
					<div class="px-4 py-2.5 flex items-center justify-between">
						<Skeleton width="w-32" height="h-4" />
						<Skeleton width="w-40" height="h-3" />
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Bottom grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<div class="lg:col-span-2">
			{#await data.activity}
				<div class="bg-surface border border-border rounded-lg animate-pulse h-48"></div>
			{:then events}
				<ActivityFeed {events} />
			{/await}
		</div>
		<div class="space-y-4">
			<StorageOverview
				local={{ used: 850000000000, total: 2000000000000 }}
				remote={{ used: 32000000000000, total: 50000000000000 }}
				union={{ used: 32850000000000, total: 52000000000000 }}
			/>
			<QuickActions />
		</div>
	</div>
</div>
