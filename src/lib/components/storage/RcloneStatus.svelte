<script lang="ts">
	import type { RcloneRemote } from '$lib/types/storage';
	import { formatBytes } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Cloud, ArrowUp, ArrowDown, AlertCircle } from 'lucide-svelte';

	let { remotes }: { remotes: RcloneRemote[] } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
	{#each remotes as remote}
		<div class="bg-surface border border-border rounded-lg p-4">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<Cloud size={16} class="text-text-tertiary" />
					<span class="text-sm font-medium text-text">{remote.name}</span>
				</div>
				<Badge variant={remote.connected ? 'success' : 'error'}>
					{remote.connected ? 'Connected' : 'Disconnected'}
				</Badge>
			</div>
			<div class="space-y-1.5 text-xs font-mono text-text-secondary">
				<div class="flex justify-between">
					<span>Type</span>
					<span class="text-text-tertiary">{remote.type}</span>
				</div>
				<div class="flex justify-between">
					<span class="flex items-center gap-1"><ArrowUp size={10} /> Upload</span>
					<span class="text-text-tertiary">{formatBytes(remote.bandwidth.up)}/s</span>
				</div>
				<div class="flex justify-between">
					<span class="flex items-center gap-1"><ArrowDown size={10} /> Download</span>
					<span class="text-text-tertiary">{formatBytes(remote.bandwidth.down)}/s</span>
				</div>
				<div class="flex justify-between">
					<span>Transferred</span>
					<span class="text-text-tertiary">{formatBytes(remote.transferred)}</span>
				</div>
				{#if remote.errors > 0}
					<div class="flex items-center gap-1 text-red mt-1">
						<AlertCircle size={12} /> {remote.errors} errors
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
