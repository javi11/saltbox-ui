<script lang="ts">
	import { GitBranch, Tag, RefreshCw, AlertTriangle, CheckCircle, Terminal, Wifi } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUI } from '$lib/stores/ui.svelte';

	let { data } = $props();
	const ui = getUI();

	type Channel = 'dev' | 'release';

	let selectedChannel = $state<Channel>('dev');
	let updating = $state(false);
	let jobOutput = $state<string[]>([]);
	let jobStatus = $state<'idle' | 'running' | 'completed' | 'failed'>('idle');
	let reconnecting = $state(false);

	const POLL_INTERVAL = 2500;
	const MAX_POLLS = 200;

	async function pollJob(jobId: string): Promise<'completed' | 'failed' | 'reconnecting'> {
		for (let i = 0; i < MAX_POLLS; i++) {
			await new Promise((r) => setTimeout(r, POLL_INTERVAL));
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				if (!res.ok) break;
				const job = await res.json();
				jobOutput = job.output ?? [];
				if (job.status === 'completed') {
					jobStatus = 'completed';
					return 'completed';
				}
				if (job.status === 'failed') {
					jobStatus = 'failed';
					return 'failed';
				}
			} catch {
				// Server may have restarted — switch to reconnect mode
				reconnecting = true;
				await waitForReconnect();
				return 'reconnecting';
			}
		}
		jobStatus = 'failed';
		return 'failed';
	}

	async function waitForReconnect(): Promise<void> {
		const RECONNECT_INTERVAL = 3000;
		const MAX_ATTEMPTS = 60;
		for (let i = 0; i < MAX_ATTEMPTS; i++) {
			await new Promise((r) => setTimeout(r, RECONNECT_INTERVAL));
			try {
				const res = await fetch('/api/self-update', { method: 'GET' });
				if (res.ok) {
					window.location.reload();
					return;
				}
			} catch {
				// still down
			}
		}
	}

	async function handleUpdate() {
		if (selectedChannel === 'release' && !data.latestRelease) {
			ui.addToast('No release available', 'error');
			return;
		}

		updating = true;
		jobStatus = 'running';
		jobOutput = [];

		try {
			const res = await fetch('/api/self-update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ channel: selectedChannel })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				ui.addToast(`Update failed: ${body?.error ?? res.status}`, 'error');
				jobStatus = 'failed';
				updating = false;
				return;
			}

			const result = await res.json();
			if (!result.success || !result.jobId) {
				ui.addToast(`Update failed: ${result.error ?? 'unknown error'}`, 'error');
				jobStatus = 'failed';
				updating = false;
				return;
			}

			ui.addToast('Update started', 'info');
			const finalStatus = await pollJob(result.jobId);

			if (finalStatus === 'completed') {
				ui.addToast('Update completed', 'success');
			} else if (finalStatus === 'failed' && !reconnecting) {
				ui.addToast('Update failed', 'error');
			}
		} catch {
			ui.addToast('Could not reach server', 'error');
			jobStatus = 'failed';
		}

		updating = false;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	const channelLabel = $derived(
		selectedChannel === 'dev'
			? 'Dev (main branch)'
			: data.latestRelease
				? `Latest Release (${data.latestRelease.tag})`
				: 'Latest Release'
	);
</script>

<svelte:head>
	<title>Settings — Saltbox</title>
</svelte:head>

{#if reconnecting}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-sm gap-4">
		<Wifi size={40} class="text-amber animate-pulse" />
		<p class="text-text text-lg font-medium">Update applied — reconnecting...</p>
		<p class="text-text-secondary text-sm">The UI will reload automatically once the server is back.</p>
	</div>
{/if}

<div class="space-y-6">
	<h1 class="text-lg font-semibold text-text">Settings</h1>

	<!-- Self-Update Card -->
	<div class="bg-surface border border-border rounded-lg">
		<div class="px-4 py-3 border-b border-border flex items-center gap-2">
			<RefreshCw size={16} class="text-text-secondary" />
			<h2 class="text-sm font-medium text-text">Self Update</h2>
		</div>

		<div class="p-4 space-y-5">
			{#if !data.version.configured}
				<div class="flex items-start gap-3 p-3 bg-yellow/10 border border-yellow/20 rounded-md">
					<AlertTriangle size={16} class="text-yellow mt-0.5 shrink-0" />
					<div class="text-sm text-text-secondary">
						<span class="text-text font-medium">SALTBOX_UI_DIR not set.</span>
						Set this environment variable to the directory where saltbox-ui is installed on the host
						(e.g. <code class="font-mono bg-surface px-1 rounded">/opt/saltbox-ui</code>), then
						restart the container.
					</div>
				</div>
			{:else}
				<!-- Current Version -->
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
					<div class="bg-bg border border-border rounded-md px-3 py-2">
						<p class="text-xs text-text-tertiary mb-1">Current Tag</p>
						<p class="text-sm font-mono text-text">{data.version.tag}</p>
					</div>
					<div class="bg-bg border border-border rounded-md px-3 py-2">
						<p class="text-xs text-text-tertiary mb-1">Commit</p>
						<p class="text-sm font-mono text-text">{data.version.commit}</p>
					</div>
					<div class="bg-bg border border-border rounded-md px-3 py-2">
						<p class="text-xs text-text-tertiary mb-1">Branch</p>
						<p class="text-sm font-mono text-text">{data.version.branch}</p>
					</div>
				</div>

				<!-- Channel Selector -->
				<div class="space-y-2">
					<p class="text-xs font-medium text-text-secondary uppercase tracking-wide">Update Channel</p>
					<div class="grid grid-cols-2 gap-2">
						<button
							onclick={() => (selectedChannel = 'dev')}
							class="flex items-start gap-3 p-3 rounded-md border transition-all cursor-pointer text-left
								{selectedChannel === 'dev'
								? 'border-amber/40 bg-amber/10'
								: 'border-border bg-bg hover:border-border-hover hover:bg-surface-hover'}"
						>
							<GitBranch
								size={16}
								class="mt-0.5 shrink-0 {selectedChannel === 'dev' ? 'text-amber' : 'text-text-secondary'}"
							/>
							<div>
								<p class="text-sm font-medium {selectedChannel === 'dev' ? 'text-amber' : 'text-text'}">
									Dev
								</p>
								<p class="text-xs text-text-secondary mt-0.5">main branch — latest commits</p>
							</div>
						</button>

						<button
							onclick={() => (selectedChannel = 'release')}
							disabled={!data.latestRelease}
							class="flex items-start gap-3 p-3 rounded-md border transition-all text-left
								{!data.latestRelease
								? 'opacity-40 cursor-not-allowed border-border bg-bg'
								: selectedChannel === 'release'
									? 'border-amber/40 bg-amber/10 cursor-pointer'
									: 'border-border bg-bg hover:border-border-hover hover:bg-surface-hover cursor-pointer'}"
						>
							<Tag
								size={16}
								class="mt-0.5 shrink-0 {selectedChannel === 'release' ? 'text-amber' : 'text-text-secondary'}"
							/>
							<div>
								<p class="text-sm font-medium {selectedChannel === 'release' ? 'text-amber' : 'text-text'}">
									Release
								</p>
								{#if data.latestRelease}
									<p class="text-xs text-text-secondary mt-0.5">
										{data.latestRelease.tag} · {formatDate(data.latestRelease.publishedAt)}
									</p>
								{:else}
									<p class="text-xs text-text-secondary mt-0.5">no releases found</p>
								{/if}
							</div>
						</button>
					</div>
				</div>

				<!-- Update Button -->
				<div class="flex items-center gap-3">
					<Button variant="primary" disabled={updating} onclick={handleUpdate}>
						<RefreshCw size={14} class={updating ? 'animate-spin' : ''} />
						{updating ? 'Updating...' : `Update to ${channelLabel}`}
					</Button>
					{#if jobStatus === 'completed'}
						<span class="flex items-center gap-1.5 text-sm text-green">
							<CheckCircle size={14} />
							Completed
						</span>
					{:else if jobStatus === 'failed'}
						<span class="flex items-center gap-1.5 text-sm text-red">
							<AlertTriangle size={14} />
							Failed
						</span>
					{/if}
				</div>

				<!-- Job Output -->
				{#if jobOutput.length > 0 || jobStatus === 'running'}
					<div class="rounded-md border border-border bg-bg overflow-hidden">
						<div class="flex items-center gap-2 px-3 py-2 border-b border-border">
							<Terminal size={13} class="text-text-tertiary" />
							<span class="text-xs text-text-secondary font-mono">Output</span>
							{#if jobStatus === 'running'}
								<span class="ml-auto flex items-center gap-1.5 text-xs text-amber">
									<span class="w-1.5 h-1.5 rounded-full bg-amber animate-pulse"></span>
									Running
								</span>
							{/if}
						</div>
						<div class="p-3 max-h-72 overflow-y-auto font-mono text-xs text-text-secondary space-y-0.5">
							{#each jobOutput as line}
								<div class="leading-5">{line}</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
