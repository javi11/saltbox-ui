<script lang="ts">
	import type { ServiceStatus } from '$lib/types/system';

	let { services }: { services: ServiceStatus[] } = $props();

	const statusColors: Record<string, string> = {
		healthy: 'bg-green',
		degraded: 'bg-yellow',
		down: 'bg-red',
		unknown: 'bg-text-tertiary'
	};
</script>

<div class="bg-surface border border-border rounded-lg">
	<div class="px-4 py-3 border-b border-border">
		<h3 class="text-sm font-medium text-text">Service Health</h3>
	</div>
	<div class="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
		{#each services as service}
			<div class="flex items-center gap-2.5 px-3 py-2 bg-bg rounded-md">
				<div class="w-2 h-2 rounded-full {statusColors[service.status]}" class:animate-pulse-slow={service.status === 'down'}></div>
				<div class="flex-1 min-w-0">
					<span class="text-sm text-text truncate block">{service.name}</span>
					{#if service.latency !== undefined}
						<span class="text-xs font-mono text-text-tertiary">{service.latency}ms</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
