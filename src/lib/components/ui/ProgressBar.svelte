<script lang="ts">
	let {
		value,
		max = 100,
		color = 'amber',
		height = 'md',
		label = ''
	}: {
		value: number;
		max?: number;
		color?: 'amber' | 'green' | 'red' | 'blue' | 'auto';
		height?: 'sm' | 'md' | 'lg';
		label?: string;
	} = $props();

	const percent = $derived(Math.min((value / max) * 100, 100));
	const resolvedColor = $derived(
		color === 'auto'
			? percent < 60 ? 'green' : percent < 80 ? 'yellow' : 'red'
			: color
	);
	const colorClasses: Record<string, string> = {
		amber: 'bg-amber',
		green: 'bg-green',
		red: 'bg-red',
		blue: 'bg-blue',
		yellow: 'bg-yellow'
	};
	const heights: Record<string, string> = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
</script>

{#if label}
	<div class="flex justify-between text-xs mb-1">
		<span class="text-text-secondary">{label}</span>
		<span class="font-mono text-text-secondary">{percent.toFixed(1)}%</span>
	</div>
{/if}
<div class="w-full bg-surface-active rounded-full overflow-hidden {heights[height]}">
	<div
		class="h-full rounded-full transition-all duration-500 ease-out {colorClasses[resolvedColor]}"
		style="width: {percent}%"
	></div>
</div>
