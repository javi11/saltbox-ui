<script lang="ts">
	import AppDetail from '$lib/components/apps/AppDetail.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.app.name} — Saltbox</title>
</svelte:head>

<AppDetail app={data.app} logs={data.logs} />
