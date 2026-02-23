<script lang="ts">
	import type { ActivityEvent } from '$lib/types/system';
	import { formatRelativeTime } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { events }: { events: ActivityEvent[] } = $props();

	const severityMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
		success: 'success',
		error: 'error',
		warning: 'warning',
		info: 'info'
	};
</script>

<div class="bg-surface border border-border rounded-lg">
	<div class="px-4 py-3 border-b border-border">
		<h3 class="text-sm font-medium text-text">Recent Activity</h3>
	</div>
	<div class="divide-y divide-border max-h-[400px] overflow-y-auto">
		{#each events as event}
			<div class="px-4 py-3 flex items-start gap-3">
				<div class="mt-0.5">
					<Badge variant={severityMap[event.severity]}>{event.severity}</Badge>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm text-text truncate">{event.title}</p>
					<p class="text-xs text-text-tertiary mt-0.5">{event.description}</p>
				</div>
				<span class="text-xs text-text-tertiary font-mono whitespace-nowrap">{formatRelativeTime(event.timestamp)}</span>
			</div>
		{/each}
	</div>
</div>
