<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		size = 'md',
		disabled = false,
		full = false,
		onclick,
		children
	}: {
		variant?: 'default' | 'primary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		full?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const variants: Record<string, string> = {
		default: 'bg-surface-hover hover:bg-surface-active text-text border border-border',
		primary: 'bg-amber/15 hover:bg-amber/25 text-amber border border-amber/30',
		danger: 'bg-red/10 hover:bg-red/20 text-red border border-red/30',
		ghost: 'hover:bg-surface-hover text-text-secondary'
	};

	const sizes: Record<string, string> = {
		sm: 'px-2.5 py-1 text-xs',
		md: 'px-3.5 py-1.5 text-sm',
		lg: 'px-5 py-2.5 text-sm'
	};
</script>

<button
	class="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none cursor-pointer {variants[variant]} {sizes[size]} {full ? 'w-full' : ''}"
	{disabled}
	{onclick}
>
	{@render children()}
</button>
