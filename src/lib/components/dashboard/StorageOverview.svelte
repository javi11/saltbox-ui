<script lang="ts">
	import { formatBytes } from '$lib/utils/format';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

	let { local, remote, union }: { local: { used: number; total: number }; remote: { used: number; total: number }; union: { used: number; total: number } } = $props();
</script>

<div class="bg-surface border border-border rounded-lg">
	<div class="px-4 py-3 border-b border-border">
		<h3 class="text-sm font-medium text-text">Storage Overview</h3>
	</div>
	<div class="p-4 space-y-4">
		<div>
			<div class="flex justify-between text-xs mb-1.5">
				<span class="text-text-secondary">Local</span>
				<span class="font-mono text-text-secondary">{formatBytes(local.used)} / {formatBytes(local.total)}</span>
			</div>
			<ProgressBar value={local.used} max={local.total} color="amber" height="md" />
		</div>
		<div>
			<div class="flex justify-between text-xs mb-1.5">
				<span class="text-text-secondary">Cloud (Remote)</span>
				<span class="font-mono text-text-secondary">{formatBytes(remote.used)} / {formatBytes(remote.total)}</span>
			</div>
			<ProgressBar value={remote.used} max={remote.total} color="blue" height="md" />
		</div>
		<div>
			<div class="flex justify-between text-xs mb-1.5">
				<span class="text-text-secondary">Union (MergeFS)</span>
				<span class="font-mono text-text-secondary">{formatBytes(union.used)} / {formatBytes(union.total)}</span>
			</div>
			<ProgressBar value={union.used} max={union.total} color="green" height="md" />
		</div>
	</div>
</div>
