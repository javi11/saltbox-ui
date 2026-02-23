<script lang="ts">
	import { Download, Archive, RotateCw, Trash2, GitBranch } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { invalidateAll } from '$app/navigation';

	const ui = getUI();

	let updating = $state(false);
	let updatingSaltbox = $state(false);

	async function pollJob(jobId: string, label: string): Promise<boolean> {
		const POLL_INTERVAL = 3000;
		const MAX_POLLS = 100;

		for (let i = 0; i < MAX_POLLS; i++) {
			await new Promise((r) => setTimeout(r, POLL_INTERVAL));
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				if (!res.ok) break;
				const job = await res.json();
				if (job.status === 'completed') {
					ui.addToast(`${label} completed`, 'success');
					await invalidateAll();
					return true;
				}
				if (job.status === 'failed') {
					ui.addToast(`${label} failed`, 'error');
					return false;
				}
			} catch {
				break;
			}
		}
		ui.addToast(`${label} timed out`, 'error');
		return false;
	}

	async function handleAction(name: string, action: string) {
		ui.addToast(`${name}...`, 'info');
		const res = await fetch('/api/actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action })
		});
		const result = await res.json();

		if (action === 'updateAll' && result.success && result.jobId) {
			updating = true;
			await pollJob(result.jobId, 'Update All');
			updating = false;
			return;
		}

		if (action === 'updateSaltbox' && result.success && result.jobId) {
			updatingSaltbox = true;
			await pollJob(result.jobId, 'Update Saltbox');
			updatingSaltbox = false;
			return;
		}

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
		<Button variant="default" disabled={updating} onclick={() => handleAction('Update All', 'updateAll')}>
			<Download size={14} />
			{updating ? 'Updating...' : 'Update All'}
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
		<div class="col-span-2">
			<Button
				variant="primary"
				full
				disabled={updatingSaltbox}
				onclick={() => handleAction('Update Saltbox', 'updateSaltbox')}
			>
				<GitBranch size={14} />
				{updatingSaltbox ? 'Updating Saltbox...' : 'Update Saltbox'}
			</Button>
		</div>
	</div>
</div>
