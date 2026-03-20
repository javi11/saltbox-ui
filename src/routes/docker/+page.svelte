<script lang="ts">
	import ContainerList from '$lib/components/docker/ContainerList.svelte';
	import LogViewer from '$lib/components/docker/LogViewer.svelte';
	import MetricCard from '$lib/components/ui/MetricCard.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { invalidateAll } from '$app/navigation';
	import { getUI } from '$lib/stores/ui.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { createSSE } from '$lib/utils/sse.svelte';
	import { Container as ContainerIcon, Play, Square, Cpu, MemoryStick } from 'lucide-svelte';
	import type { Container } from '$lib/types/container';

	let { data } = $props();
	const ui = getUI();

	let logViewerOpen = $state(false);
	let logContainerName = $state('');
	let logs = $state<import('$lib/types/container').ContainerLog[]>([]);
	let filterState = $state<'all' | 'running' | 'stopped' | 'error'>('all');

	// Live container updates via SSE
	let liveContainers = $state<Container[] | null>(null);
	const containerSSE = createSSE('/api/sse/containers');
	containerSSE.on('containers', (d: unknown) => { liveContainers = d as Container[]; });

	const containers = $derived(liveContainers);
	const running = $derived(containers?.filter((c) => c.state === 'running') ?? []);
	const stopped = $derived(containers?.filter((c) => c.state === 'stopped') ?? []);
	const errors = $derived(containers?.filter((c) => c.state === 'error') ?? []);
	const totalCpu = $derived(running.reduce((sum, c) => sum + c.cpu, 0));
	const totalMemory = $derived(running.reduce((sum, c) => sum + c.memory, 0));

	const filtered = $derived(
		containers
			? (filterState === 'all'
				? containers
				: containers.filter((c) => c.state === filterState))
			: null
	);

	async function handleAction(id: string, action: 'start' | 'stop' | 'restart') {
		const name = containers?.find(c => c.id === id)?.name || id;
		ui.addToast(`${action} ${name}...`, 'info');
		const res = await fetch(`/api/containers/${id}/action`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action })
		});
		const result = await res.json();
		if (result.success) {
			ui.addToast(`${name} ${action}ed successfully`, 'success');
			await invalidateAll();
		} else {
			ui.addToast(`Failed to ${action} ${name}`, 'error');
		}
	}

	async function handleLogs(name: string) {
		logContainerName = name;
		const res = await fetch(`/api/containers/${name}/logs`);
		logs = await res.json();
		logViewerOpen = true;
	}
</script>

<svelte:head>
	<title>Docker — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-lg font-semibold text-text">Docker</h1>

	<!-- Stats -->
	{#if containers}
		<div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
			<MetricCard label="Total" value={String(containers.length)} icon={ContainerIcon} />
			<MetricCard label="Running" value={String(running.length)} icon={Play} />
			<MetricCard label="Stopped" value={String(stopped.length)} icon={Square} />
			<MetricCard label="CPU Usage" value={totalCpu.toFixed(1)} unit="%" icon={Cpu} />
			<MetricCard label="Memory" value={formatBytes(totalMemory)} icon={MemoryStick} />
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
			{#each Array(5) as _}
				<div class="bg-surface border border-border rounded-lg p-4 space-y-2">
					<Skeleton width="w-16" height="h-3" />
					<Skeleton width="w-20" height="h-6" />
				</div>
			{/each}
		</div>
	{/if}

	<!-- Filter tabs -->
	<div class="flex gap-1.5">
		{#each ['all', 'running', 'stopped', 'error'] as state}
			<button
				class="px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer
					{filterState === state ? 'bg-amber/15 text-amber border border-amber/30' : 'bg-surface-hover text-text-secondary border border-transparent hover:text-text'}"
				onclick={() => (filterState = state as typeof filterState)}
			>
				{state.charAt(0).toUpperCase() + state.slice(1)}
			</button>
		{/each}
	</div>

	<!-- Container table -->
	<div class="bg-surface border border-border rounded-lg">
		{#if filtered}
			<ContainerList containers={filtered} onaction={handleAction} onlogs={handleLogs} />
		{:else}
			<div class="p-4 space-y-3">
				{#each Array(8) as _}
					<div class="flex items-center gap-4">
						<Skeleton width="w-32" height="h-4" />
						<Skeleton width="w-48" height="h-3" />
						<Skeleton width="w-16" height="h-3" />
						<Skeleton width="w-12" height="h-3" class="ml-auto" />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<LogViewer {logs} containerName={logContainerName} bind:open={logViewerOpen} />
