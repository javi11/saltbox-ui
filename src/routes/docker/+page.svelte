<script lang="ts">
	import ContainerList from '$lib/components/docker/ContainerList.svelte';
	import LogViewer from '$lib/components/docker/LogViewer.svelte';
	import MetricCard from '$lib/components/ui/MetricCard.svelte';
	import { invalidateAll } from '$app/navigation';
	import { getUI } from '$lib/stores/ui.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { Container, Play, Square, Cpu, MemoryStick } from 'lucide-svelte';

	let { data } = $props();
	const ui = getUI();

	let logViewerOpen = $state(false);
	let logContainerName = $state('');
	let logs = $state<import('$lib/types/container').ContainerLog[]>([]);
	let filterState = $state<'all' | 'running' | 'stopped' | 'error'>('all');

	const filtered = $derived(
		filterState === 'all'
			? data.containers
			: data.containers.filter((c) => c.state === filterState)
	);

	async function handleAction(id: string, action: 'start' | 'stop' | 'restart') {
		const name = data.containers.find(c => c.id === id)?.name || id;
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
	<div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
		<MetricCard label="Total" value={String(data.stats.total)} icon={Container} />
		<MetricCard label="Running" value={String(data.stats.running)} icon={Play} />
		<MetricCard label="Stopped" value={String(data.stats.stopped)} icon={Square} />
		<MetricCard label="CPU Usage" value={data.stats.totalCpu.toFixed(1)} unit="%" icon={Cpu} />
		<MetricCard label="Memory" value={formatBytes(data.stats.totalMemory)} icon={MemoryStick} />
	</div>

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
		<ContainerList containers={filtered} onaction={handleAction} onlogs={handleLogs} />
	</div>
</div>

<LogViewer {logs} containerName={logContainerName} bind:open={logViewerOpen} />
