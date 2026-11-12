<script lang="ts">
	import AppDetail from '$lib/components/apps/AppDetail.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { requestJob, jobFailure } from '$lib/utils/wait-for-job';
	import { onDestroy } from 'svelte';
	import { createSSE } from '$lib/utils/sse.svelte';
	import type { Container } from '$lib/types/container';
	const operations = new AbortController();
	onDestroy(() => operations.abort());

	let { data } = $props();
	let liveContainers = $state<Container[]>([]);
	const containersSSE = createSSE('/api/sse/containers');
	containersSSE.on('containers', (value) => { liveContainers = value as Container[]; });
	const app = $derived.by(() => {
		const live = liveContainers.find((container) => container.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') === data.app.slug);
		return live ? { ...data.app, cpu: live.cpu, memory: live.memory, memoryLimit: live.memoryLimit } : data.app;
	});
	const ui = getUI();
	let isUpdating = $state(false);

	async function handleDelete(deleteData: boolean) {
		ui.addToast(`Deleting ${data.app.name}...`, 'info');
		try {
			const res = await fetch(`/api/apps/${data.app.slug}/delete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deleteData })
			});
			const result = await res.json();
			if (result.success) {
				ui.addToast(`${data.app.name} deleted successfully`, 'success');
				goto('/apps');
			} else {
				ui.addToast(`Failed to delete ${data.app.name}`, 'error');
			}
		} catch {
			ui.addToast(`Failed to delete ${data.app.name}`, 'error');
		}
	}

	async function handleAction(action: 'start' | 'stop' | 'restart' | 'update') {
		if (action === 'update') {
			if (isUpdating) return;
			ui.addToast(`Updating ${data.app.name}...`, 'info');
			isUpdating = true;
			try {
				const job = await requestJob(`/api/apps/${data.app.slug}/update`, operations.signal);
				if (job.status !== 'completed') throw new Error(jobFailure(job));
				ui.addToast(`Update ${data.app.name} completed`, 'success');
				await invalidateAll();
			} catch (error) {
				if (!operations.signal.aborted) ui.addToast(`Failed to update ${data.app.name}: ${error instanceof Error ? error.message : error}`, 'error');
			} finally {
				isUpdating = false;
			}
			return;
		}

		ui.addToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${data.app.name}...`, 'info');
		try {
			const res = await fetch(`/api/apps/${data.app.slug}/action`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});
			const result = await res.json();
			if (result.success) {
				ui.addToast(`${data.app.name} ${action}ed successfully`, 'success');
				await invalidateAll();
			} else {
				ui.addToast(`Failed to ${action} ${data.app.name}`, 'error');
			}
		} catch {
			ui.addToast(`Failed to ${action} ${data.app.name}`, 'error');
		}
	}
</script>

<svelte:head>
	<title>{data.app.name} — Saltbox</title>
</svelte:head>

<AppDetail {app} logs={data.logs} onaction={handleAction} ondelete={handleDelete} {isUpdating} />
