<script lang="ts">
	import MetricsPanel from '$lib/components/system/MetricsPanel.svelte';
	import BackupStatus from '$lib/components/system/BackupStatus.svelte';
	import TraefikRoutes from '$lib/components/system/TraefikRoutes.svelte';
	import ServiceHealth from '$lib/components/system/ServiceHealth.svelte';

	let { data } = $props();
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
	<MetricsPanel health={data.health} />
	<BackupStatus backups={data.backups} />
	<TraefikRoutes routes={data.routes} />
</div>
