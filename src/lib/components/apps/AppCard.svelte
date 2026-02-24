<script lang="ts">
	import type { SaltboxApp } from '$lib/types/app';
	import { STATUS_CONFIG, CATEGORY_LABELS } from '$lib/utils/constants';
	import { formatBytes } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { ExternalLink, RotateCw, Square, Play, RefreshCcw } from 'lucide-svelte';

	let { app, onaction }: { app: SaltboxApp; onaction?: (action: string, slug: string) => void } = $props();

	const statusCfg = $derived(STATUS_CONFIG[app.status]);
	const badgeVariant = $derived(
		app.status === 'running' ? 'success' as const :
		app.status === 'error' ? 'error' as const :
		app.status === 'stopped' ? 'default' as const : 'info' as const
	);
</script>

<a href="/apps/{app.slug}" class="block bg-surface border border-border rounded-lg p-4 hover:border-border-light transition-colors duration-150 group">
	<div class="flex items-start justify-between mb-3">
		<div>
			<h3 class="text-sm font-semibold text-text group-hover:text-amber transition-colors">{app.name}</h3>
			<span class="text-xs text-text-tertiary">{CATEGORY_LABELS[app.category]}</span>
		</div>
		<Badge variant={badgeVariant}>{statusCfg.label}</Badge>
	</div>

	<div class="space-y-2 text-xs font-mono text-text-secondary">
		<div class="flex justify-between">
			<span>Version</span>
			<span class="text-text-tertiary">{app.version}</span>
		</div>
		{#if app.subdomain}
			<div class="flex justify-between">
				<span>Domain</span>
				<span class="text-text-tertiary">{app.subdomain}.domain.com</span>
			</div>
		{/if}
		{#if app.status === 'running'}
			<div class="flex justify-between">
				<span>CPU / MEM</span>
				<span class="text-text-tertiary">{app.cpu.toFixed(1)}% / {formatBytes(app.memory)}</span>
			</div>
		{/if}
	</div>

	<!-- Actions row -->
	<div class="flex items-center gap-1 mt-3 pt-3 border-t border-border">
		{#if app.subdomain}
			<button
				class="p-1.5 rounded text-text-tertiary hover:text-amber hover:bg-surface-hover transition-colors cursor-pointer"
				onclick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://${app.subdomain}.domain.com`, '_blank'); }}
				title="Open"
			>
				<ExternalLink size={14} />
			</button>
		{/if}
		{#if app.status === 'running'}
			<button class="p-1.5 rounded text-text-tertiary hover:text-amber hover:bg-surface-hover transition-colors cursor-pointer" onclick={(e) => { e.stopPropagation(); e.preventDefault(); onaction?.('restart', app.slug); }} title="Restart">
				<RotateCw size={14} />
			</button>
			<button class="p-1.5 rounded text-text-tertiary hover:text-red hover:bg-surface-hover transition-colors cursor-pointer" onclick={(e) => { e.stopPropagation(); e.preventDefault(); onaction?.('stop', app.slug); }} title="Stop">
				<Square size={14} />
			</button>
		{:else if app.status === 'stopped'}
			<button class="p-1.5 rounded text-text-tertiary hover:text-green hover:bg-surface-hover transition-colors cursor-pointer" onclick={(e) => { e.stopPropagation(); e.preventDefault(); onaction?.('start', app.slug); }} title="Start">
				<Play size={14} />
			</button>
		{/if}
		<button class="p-1.5 rounded text-text-tertiary hover:text-amber hover:bg-surface-hover transition-colors cursor-pointer ml-auto" onclick={(e) => { e.stopPropagation(); e.preventDefault(); onaction?.('update', app.slug); }} title="Update">
			<RefreshCcw size={14} />
		</button>
	</div>
</a>
