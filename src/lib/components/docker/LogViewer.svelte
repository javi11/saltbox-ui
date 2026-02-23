<script lang="ts">
	import type { ContainerLog } from '$lib/types/container';
	import { X } from 'lucide-svelte';

	let {
		logs,
		containerName,
		open = $bindable(false)
	}: {
		logs: ContainerLog[];
		containerName: string;
		open?: boolean;
	} = $props();

	let logContainer: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (logs && logContainer) {
			logContainer.scrollTop = logContainer.scrollHeight;
		}
	});
</script>

{#if open}
	<div class="fixed inset-y-0 right-0 w-full max-w-2xl z-50 bg-surface border-l border-border flex flex-col animate-slide-in">
		<div class="flex items-center justify-between px-4 py-3 border-b border-border">
			<div class="flex items-center gap-2">
				<h3 class="text-sm font-medium text-text">Logs</h3>
				<span class="text-xs font-mono text-text-tertiary">{containerName}</span>
			</div>
			<button onclick={() => (open = false)} class="p-1 text-text-tertiary hover:text-text transition-colors cursor-pointer">
				<X size={18} />
			</button>
		</div>
		<div bind:this={logContainer} class="flex-1 overflow-y-auto p-4 bg-bg font-mono text-xs">
			{#each logs as log}
				<div class="py-0.5 flex gap-3 hover:bg-surface-hover">
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
		</div>
	</div>
{/if}
