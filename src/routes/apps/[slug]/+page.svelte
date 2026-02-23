<script lang="ts">
	import AppDetail from '$lib/components/apps/AppDetail.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const ui = getUI();

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

	async function handleAction(action: 'start' | 'stop' | 'restart') {
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

<AppDetail app={data.app} logs={data.logs} onaction={handleAction} ondelete={handleDelete} />
