<script lang="ts">
	import type { BackupEntry } from '$lib/types/system';
	import { formatBytes, formatDuration, formatRelativeTime } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { backups }: { backups: BackupEntry[] } = $props();

	const statusVariant = (status: string) => {
		if (status === 'completed') return 'success' as const;
		if (status === 'failed') return 'error' as const;
		return 'info' as const;
	};
</script>

<div class="bg-surface border border-border rounded-lg">
	<div class="px-4 py-3 border-b border-border">
		<h3 class="text-sm font-medium text-text">Backup History</h3>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border">
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Time</th>
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
					<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Size</th>
					<th class="text-right py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Duration</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each backups as backup (backup.id)}
					<tr class="hover:bg-surface-hover transition-colors">
						<td class="py-2.5 px-3 font-mono text-xs text-text-tertiary">{formatRelativeTime(backup.timestamp)}</td>
						<td class="py-2.5 px-3"><Badge variant={backup.type === 'full' ? 'info' : 'default'}>{backup.type}</Badge></td>
						<td class="py-2.5 px-3"><Badge variant={statusVariant(backup.status)}>{backup.status}</Badge></td>
						<td class="py-2.5 px-3 text-right font-mono text-text-secondary">{backup.size > 0 ? formatBytes(backup.size) : '-'}</td>
						<td class="py-2.5 px-3 text-right font-mono text-text-secondary">{formatDuration(backup.duration)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
