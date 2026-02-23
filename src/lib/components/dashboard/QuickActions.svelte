<script lang="ts">
	import { Download, Archive, RotateCw, Trash2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUI } from '$lib/stores/ui.svelte';

	const ui = getUI();

	async function handleAction(name: string, action: string) {
		ui.addToast(`${name}...`, 'info');
		const res = await fetch('/api/actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action })
		});
		const result = await res.json();
		if (result.success) {
			ui.addToast(`${name} completed`, 'success');
		} else {
			ui.addToast(`${name} failed`, 'error');
		}
	}
</script>

<div class="bg-surface border border-border rounded-lg">
	<div class="px-4 py-3 border-b border-border">
		<h3 class="text-sm font-medium text-text">Quick Actions</h3>
	</div>
	<div class="p-4 grid grid-cols-2 gap-2">
		<Button variant="default" onclick={() => handleAction('Update All', 'updateAll')}>
			<Download size={14} />
			Update All
		</Button>
		<Button variant="default" onclick={() => handleAction('Backup', 'backupNow')}>
			<Archive size={14} />
			Backup Now
		</Button>
		<Button variant="default" onclick={() => handleAction('Restart Traefik', 'restartTraefik')}>
			<RotateCw size={14} />
			Restart Traefik
		</Button>
		<Button variant="default" onclick={() => handleAction('Clear Logs', 'clearLogs')}>
			<Trash2 size={14} />
			Clear Logs
		</Button>
	</div>
</div>
