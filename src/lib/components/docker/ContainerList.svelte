<script lang="ts">
	import type { Container } from '$lib/types/container';
	import { formatBytes } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Play, Square, RotateCw, FileText } from 'lucide-svelte';

	let { containers, onaction, onlogs }: {
		containers: Container[];
		onaction?: (id: string, action: 'start' | 'stop' | 'restart') => void;
		onlogs?: (name: string) => void;
	} = $props();

	const statusVariant = (state: string) => {
		if (state === 'running') return 'success' as const;
		if (state === 'error') return 'error' as const;
		return 'default' as const;
	};
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border">
				<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
				<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Image</th>
				<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">State</th>
				<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">CPU %</th>
				<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Memory</th>
			<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">RSS</th>
				<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Net I/O</th>
				<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each containers as c (c.id)}
				<tr class="hover:bg-surface-hover transition-colors">
					<td class="py-2.5 px-3 font-mono text-text">{c.name}</td>
					<td class="py-2.5 px-3 font-mono text-xs text-text-tertiary max-w-48 truncate">{c.image}</td>
					<td class="py-2.5 px-3"><Badge variant={statusVariant(c.state)}>{c.state}</Badge></td>
					<td class="py-2.5 px-3 text-right font-mono text-text-secondary">{c.cpu.toFixed(1)}%</td>
					<td class="py-2.5 px-3 text-right font-mono text-text-secondary">{formatBytes(c.memory)}</td>
				<td class="py-2.5 px-3 text-right font-mono text-text-secondary">{c.memoryRss > 0 ? formatBytes(c.memoryRss) : '—'}</td>
					<td class="py-2.5 px-3 text-right font-mono text-xs text-text-tertiary">
						↓{formatBytes(c.networkRx)} ↑{formatBytes(c.networkTx)}
					</td>
					<td class="py-2.5 px-3">
						<div class="flex items-center justify-end gap-1">
							<button class="p-1 rounded text-text-tertiary hover:text-amber hover:bg-surface-active transition-colors cursor-pointer" onclick={() => onlogs?.(c.name)} title="Logs">
								<FileText size={14} />
							</button>
							{#if c.state === 'running'}
								<button class="p-1 rounded text-text-tertiary hover:text-amber hover:bg-surface-active transition-colors cursor-pointer" onclick={() => onaction?.(c.id, 'restart')} title="Restart">
									<RotateCw size={14} />
								</button>
								<button class="p-1 rounded text-text-tertiary hover:text-red hover:bg-surface-active transition-colors cursor-pointer" onclick={() => onaction?.(c.id, 'stop')} title="Stop">
									<Square size={14} />
								</button>
							{:else}
								<button class="p-1 rounded text-text-tertiary hover:text-green hover:bg-surface-active transition-colors cursor-pointer" onclick={() => onaction?.(c.id, 'start')} title="Start">
									<Play size={14} />
								</button>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
