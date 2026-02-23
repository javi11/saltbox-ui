<script lang="ts">
	import type { SaltboxApp } from '$lib/types/app';
	import type { ContainerLog } from '$lib/types/container';
	import { STATUS_CONFIG, CATEGORY_LABELS } from '$lib/utils/constants';
	import { formatBytes } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { ExternalLink, RotateCw, Square, Play, ArrowLeft, Trash2 } from 'lucide-svelte';

	let {
		app,
		logs = [],
		onaction,
		ondelete
	}: {
		app: SaltboxApp;
		logs?: ContainerLog[];
		onaction?: (action: 'start' | 'stop' | 'restart') => void;
		ondelete?: (deleteData: boolean) => void;
	} = $props();

	let activeTab = $state<'overview' | 'logs' | 'config' | 'network'>('overview');
	let showDeleteConfirm = $state(false);
	let deleteData = $state(false);
	let confirmName = $state('');

	const statusVariant = $derived(
		app.status === 'running' ? 'success' as const :
		app.status === 'error' ? 'error' as const :
		app.status === 'stopped' ? 'default' as const : 'info' as const
	);

	const tabs = ['overview', 'logs', 'config', 'network'] as const;
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-4">
			<a href="/apps" class="p-2 rounded-md text-text-tertiary hover:text-text hover:bg-surface-hover transition-colors">
				<ArrowLeft size={18} />
			</a>
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-lg font-semibold text-text">{app.name}</h1>
					<Badge variant={statusVariant}>{STATUS_CONFIG[app.status].label}</Badge>
				</div>
				<p class="text-sm text-text-secondary mt-0.5">{app.description}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if app.subdomain}
				<Button variant="ghost" onclick={() => window.open(`https://${app.subdomain}.domain.com`, '_blank')}>
					<ExternalLink size={14} /> Open
				</Button>
			{/if}
			{#if app.status === 'running'}
				<Button variant="default" onclick={() => onaction?.('restart')}><RotateCw size={14} /> Restart</Button>
				<Button variant="danger" onclick={() => onaction?.('stop')}><Square size={14} /> Stop</Button>
			{:else if app.status === 'stopped'}
				<Button variant="primary" onclick={() => onaction?.('start')}><Play size={14} /> Start</Button>
			{/if}
			<Button variant="danger" onclick={() => (showDeleteConfirm = true)}><Trash2 size={14} /> Delete</Button>
		</div>
	</div>

	<!-- Delete confirmation -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog">
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onclick={(e) => e.stopPropagation()}>
				<h2 class="text-lg font-semibold text-text mb-2">Delete {app.name}?</h2>
				<p class="text-sm text-text-secondary mb-4">
					This will remove the Docker container. This action cannot be undone.
				</p>
				<label class="flex items-start gap-3 p-3 rounded-md bg-red/5 border border-red/20 mb-4 cursor-pointer">
					<input type="checkbox" bind:checked={deleteData} class="mt-0.5 accent-red" />
					<div>
						<span class="text-sm font-medium text-red">Also delete <code class="text-xs">/opt/{app.slug}</code></span>
						<p class="text-xs text-text-tertiary mt-0.5">Removes all persistent data, configs, and databases for this app.</p>
					</div>
				</label>
				<p class="text-sm text-text-secondary mb-2">Type <strong class="text-text">{app.slug}</strong> to confirm:</p>
				<input
					type="text"
					bind:value={confirmName}
					placeholder={app.slug}
					class="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-amber/50 mb-4"
				/>
				<div class="flex justify-end gap-2">
					<Button variant="ghost" onclick={() => { showDeleteConfirm = false; confirmName = ''; deleteData = false; }}>Cancel</Button>
					<button
						disabled={confirmName !== app.slug}
						onclick={() => { showDeleteConfirm = false; ondelete?.(deleteData); }}
						class="px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
							{confirmName === app.slug
								? 'bg-red hover:bg-red/80 text-white'
								: 'bg-surface-hover text-text-tertiary cursor-not-allowed'}"
					>
						Delete {deleteData ? 'everything' : 'container'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-border">
		{#each tabs as tab}
			<button
				class="px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px
					{activeTab === tab ? 'text-amber border-amber' : 'text-text-secondary border-transparent hover:text-text'}"
				onclick={() => (activeTab = tab)}
			>
				{tab.charAt(0).toUpperCase() + tab.slice(1)}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	{#if activeTab === 'overview'}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Card>
				<h3 class="text-sm font-medium text-text mb-3">Details</h3>
				<dl class="space-y-2 text-sm">
					<div class="flex justify-between"><dt class="text-text-secondary">Category</dt><dd class="font-mono text-text-tertiary">{CATEGORY_LABELS[app.category]}</dd></div>
					<div class="flex justify-between"><dt class="text-text-secondary">Version</dt><dd class="font-mono text-text-tertiary">{app.version}</dd></div>
					<div class="flex justify-between"><dt class="text-text-secondary">Image</dt><dd class="font-mono text-text-tertiary text-xs">{app.image}</dd></div>
					<div class="flex justify-between"><dt class="text-text-secondary">Port</dt><dd class="font-mono text-text-tertiary">{app.port || 'N/A'}</dd></div>
					<div class="flex justify-between"><dt class="text-text-secondary">Uptime</dt><dd class="font-mono text-text-tertiary">{app.uptime}</dd></div>
				</dl>
			</Card>
			{#if app.status === 'running'}
				<Card>
					<h3 class="text-sm font-medium text-text mb-3">Resources</h3>
					<div class="space-y-4">
						<ProgressBar value={app.cpu} max={100} color="auto" label="CPU ({app.cpu.toFixed(1)}%)" />
						<ProgressBar value={app.memory} max={app.memoryLimit} color="auto" label="Memory ({formatBytes(app.memory)} / {formatBytes(app.memoryLimit)})" />
					</div>
				</Card>
			{/if}
		</div>

	{:else if activeTab === 'logs'}
		<div class="bg-bg border border-border rounded-lg p-4 font-mono text-xs max-h-[500px] overflow-y-auto">
			{#each logs as log}
				<div class="py-0.5 flex gap-3">
					<span class="text-text-tertiary whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
					<span class="uppercase w-12"
						class:text-green={log.level === 'info'}
						class:text-yellow={log.level === 'warn'}
						class:text-red={log.level === 'error'}
						class:text-text-tertiary={log.level === 'debug'}
					>{log.level}</span>
					<span class="text-text-secondary">{log.message}</span>
				</div>
			{/each}
			{#if logs.length === 0}
				<p class="text-text-tertiary text-center py-8">No logs available</p>
			{/if}
		</div>

	{:else if activeTab === 'config'}
		<Card>
			<h3 class="text-sm font-medium text-text mb-3">Configuration</h3>
			<div class="bg-bg rounded-md p-4 font-mono text-xs text-text-secondary">
				<pre>container_name: {app.slug}
image: {app.image}
subdomain: {app.subdomain || 'N/A'}
port: {app.port || 'N/A'}
memory_limit: {formatBytes(app.memoryLimit)}
restart_policy: unless-stopped
networks:
  - saltbox</pre>
			</div>
		</Card>

	{:else if activeTab === 'network'}
		<Card>
			<h3 class="text-sm font-medium text-text mb-3">Network</h3>
			<dl class="space-y-2 text-sm">
				{#if app.subdomain}
					<div class="flex justify-between"><dt class="text-text-secondary">Domain</dt><dd class="font-mono text-text-tertiary">{app.subdomain}.domain.com</dd></div>
				{/if}
				<div class="flex justify-between"><dt class="text-text-secondary">Internal Port</dt><dd class="font-mono text-text-tertiary">{app.port || 'N/A'}</dd></div>
				<div class="flex justify-between"><dt class="text-text-secondary">Network</dt><dd class="font-mono text-text-tertiary">saltbox</dd></div>
				<div class="flex justify-between"><dt class="text-text-secondary">TLS</dt><dd class="font-mono text-text-tertiary">Let's Encrypt (Traefik)</dd></div>
				<div class="flex justify-between"><dt class="text-text-secondary">Auth</dt><dd class="font-mono text-text-tertiary">Authelia SSO</dd></div>
			</dl>
		</Card>
	{/if}
</div>
