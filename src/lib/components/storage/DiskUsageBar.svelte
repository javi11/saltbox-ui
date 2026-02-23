<script lang="ts">
	import { formatBytes } from '$lib/utils/format';

	let { label, used, total, color = 'amber' }: { label: string; used: number; total: number; color?: string } = $props();
	const percent = $derived(total > 0 ? (used / total) * 100 : 0);
	const colorMap: Record<string, string> = { amber: 'bg-amber', blue: 'bg-blue', green: 'bg-green' };
</script>

<div class="space-y-1.5">
	<div class="flex justify-between text-xs">
		<span class="text-text-secondary">{label}</span>
		<span class="font-mono text-text-tertiary">{formatBytes(used)} / {formatBytes(total)} ({percent.toFixed(1)}%)</span>
	</div>
	<div class="h-2.5 bg-surface-active rounded-full overflow-hidden">
		<div class="h-full rounded-full transition-all duration-500 ease-out {colorMap[color] || 'bg-amber'}" style="width: {percent}%"></div>
	</div>
</div>
