<script lang="ts">
	import { Download, Archive, RotateCw, Trash2, GitBranch } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { invalidateAll } from '$app/navigation';

	const ui = getUI();

	let updating = $state(false);
	let updatingSaltbox = $state(false);
	let showUpdateModal = $state(false);

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
					const detail = job.output?.length
						? job.output.slice(-3).join('\n')
						: `exit code ${job.exitCode ?? 'unknown'}`;
					ui.addToast(`${label} failed: ${detail}`, 'error');
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
		try {
			const res = await fetch('/api/actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				const detail = body?.error || `server error (${res.status})`;
				ui.addToast(`${name} failed: ${detail}`, 'error');
				return;
			}

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
				ui.addToast(`${name} failed: ${result.error || 'unknown error'}`, 'error');
			}
		} catch {
			ui.addToast(`${name} failed: could not reach server`, 'error');
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
				onclick={() => (showUpdateModal = true)}
			>
				<GitBranch size={14} />
				Update Saltbox
			</Button>
		</div>
	</div>
</div>

<Modal bind:open={showUpdateModal} title="Update Saltbox">
	<div class="space-y-4">
		<p class="text-sm text-text-secondary">
			This will update Saltbox to the latest version. During the update, <strong class="text-text">all Docker containers will be restarted</strong>, which may cause temporary service interruptions.
		</p>
		<p class="text-sm text-text-secondary">
			The UI may also become temporarily unresponsive while the update is applied. Please wait for the process to complete.
		</p>
		<div class="flex justify-end gap-2 pt-2">
			<Button variant="default" onclick={() => (showUpdateModal = false)}>Cancel</Button>
			<Button
				variant="primary"
				onclick={() => {
					showUpdateModal = false;
					handleAction('Update Saltbox', 'updateSaltbox');
				}}
			>
				<GitBranch size={14} />
				Update
			</Button>
		</div>
	</div>
</Modal>

{#if updatingSaltbox}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-sm gap-4">
		<GitBranch size={40} class="text-primary animate-pulse" />
		<p class="text-text text-lg font-medium">Updating Saltbox...</p>
		<p class="text-text-secondary text-sm">All Docker containers are being restarted. Please wait.</p>
	</div>
{/if}
