<script lang="ts">
	import HealthCards from '$lib/components/dashboard/HealthCards.svelte';
	import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
	import StorageOverview from '$lib/components/dashboard/StorageOverview.svelte';
	import QuickActions from '$lib/components/dashboard/QuickActions.svelte';
	import { formatBytes, formatPercent } from '$lib/utils/format';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-semibold text-text">Dashboard</h1>
		<div class="flex items-center gap-2 text-xs font-mono text-text-tertiary">
			<span class="w-2 h-2 rounded-full bg-green"></span>
			{data.runningCount} / {data.totalCount} containers
		</div>
	</div>

	<!-- Health metrics -->
	<HealthCards health={data.health} />

	<!-- Top containers -->
	<div class="bg-surface border border-border rounded-lg">
		<div class="px-4 py-3 border-b border-border">
			<h3 class="text-sm font-medium text-text">Top Containers by CPU</h3>
		</div>
		<div class="divide-y divide-border">
			{#each data.topContainers as container}
				<div class="px-4 py-2.5 flex items-center justify-between">
					<span class="text-sm font-mono text-text">{container.name}</span>
					<div class="flex items-center gap-4 text-xs font-mono text-text-secondary">
						<span>CPU {container.cpu.toFixed(1)}%</span>
						<span>MEM {formatBytes(container.memory)}</span>
					</div>
				</div>
			{/each}
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
