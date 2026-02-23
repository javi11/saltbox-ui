<script lang="ts">
	import type { SystemHealth } from '$lib/types/system';
	import { formatBytes } from '$lib/utils/format';
	import Card from '$lib/components/ui/Card.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

	let { health }: { health: SystemHealth } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	<Card>
		<h3 class="text-sm font-medium text-text mb-3">Server Info</h3>
		<dl class="space-y-2 text-sm">
			<div class="flex justify-between"><dt class="text-text-secondary">Hostname</dt><dd class="font-mono text-text-tertiary">{health.hostname}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">OS</dt><dd class="font-mono text-text-tertiary">{health.os}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Kernel</dt><dd class="font-mono text-text-tertiary">{health.kernel}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Uptime</dt><dd class="font-mono text-text-tertiary">{health.uptime}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Load Average</dt><dd class="font-mono text-text-tertiary">{health.loadAverage.join(' / ')}</dd></div>
		</dl>
	</Card>

	<Card>
		<h3 class="text-sm font-medium text-text mb-3">CPU</h3>
		<dl class="space-y-2 text-sm mb-4">
			<div class="flex justify-between"><dt class="text-text-secondary">Model</dt><dd class="font-mono text-xs text-text-tertiary">{health.cpu.model}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Cores</dt><dd class="font-mono text-text-tertiary">{health.cpu.cores}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Temperature</dt><dd class="font-mono text-text-tertiary">{health.cpu.temp}°C</dd></div>
		</dl>
		<ProgressBar value={health.cpu.usage} max={100} color="auto" label="Usage" />
	</Card>

	<Card>
		<h3 class="text-sm font-medium text-text mb-3">Memory</h3>
		<div class="space-y-3">
			<ProgressBar value={health.memory.used} max={health.memory.total} color="auto" label="RAM ({formatBytes(health.memory.used)} / {formatBytes(health.memory.total)})" />
			<ProgressBar value={health.memory.swapUsed} max={health.memory.swapTotal} color="blue" label="Swap ({formatBytes(health.memory.swapUsed)} / {formatBytes(health.memory.swapTotal)})" />
		</div>
	</Card>

	<Card>
		<h3 class="text-sm font-medium text-text mb-3">Network</h3>
		<dl class="space-y-2 text-sm">
			<div class="flex justify-between"><dt class="text-text-secondary">Interface</dt><dd class="font-mono text-text-tertiary">{health.network.interface}</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Download</dt><dd class="font-mono text-text-tertiary">{formatBytes(health.network.rx)}/s</dd></div>
			<div class="flex justify-between"><dt class="text-text-secondary">Upload</dt><dd class="font-mono text-text-tertiary">{formatBytes(health.network.tx)}/s</dd></div>
		</dl>
	</Card>
</div>
