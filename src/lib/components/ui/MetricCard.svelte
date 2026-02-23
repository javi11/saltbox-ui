<script lang="ts">
	import type { Component } from 'svelte';

	let {
		label,
		value,
		unit = '',
		subtext = '',
		percent,
		icon: Icon
	}: {
		label: string;
		value: string;
		unit?: string;
		subtext?: string;
		percent?: number;
		icon?: Component<{ size?: number; class?: string }>;
	} = $props();
</script>

<div class="bg-surface border border-border rounded-lg p-4">
	<div class="flex items-center justify-between mb-3">
		<span class="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</span>
		{#if Icon}
			<Icon size={16} class="text-text-tertiary" />
		{/if}
	</div>
	<div class="flex items-baseline gap-1">
		<span class="text-2xl font-mono font-semibold text-text">{value}</span>
		{#if unit}
			<span class="text-sm font-mono text-text-secondary">{unit}</span>
		{/if}
	</div>
	{#if percent !== undefined}
		<div class="mt-3 h-1.5 bg-surface-active rounded-full overflow-hidden">
			<div
				class="h-full rounded-full transition-all duration-500 ease-out"
				class:bg-green={percent < 60}
				class:bg-yellow={percent >= 60 && percent < 80}
				class:bg-red={percent >= 80}
				style="width: {Math.min(percent, 100)}%"
			></div>
		</div>
	{/if}
	{#if subtext}
		<p class="mt-2 text-xs text-text-tertiary font-mono">{subtext}</p>
	{/if}
</div>
