<script lang="ts">
	import type { MountPoint } from '$lib/types/storage';
	import { formatBytes } from '$lib/utils/format';
	import { HardDrive, Cloud, GitMerge } from 'lucide-svelte';
	import MountTree from './MountTree.svelte';

	let { mount, depth = 0 }: { mount: MountPoint; depth?: number } = $props();
	let expanded = $state(true);

	const icon = $derived(
		mount.type === 'local' ? HardDrive :
		mount.type === 'remote' ? Cloud : GitMerge
	);
	const typeColor = $derived(
		mount.type === 'local' ? 'text-amber' :
		mount.type === 'remote' ? 'text-blue' : 'text-green'
	);
</script>

<div>
	<button
		class="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-surface-hover transition-colors text-left cursor-pointer"
		style="padding-left: {depth * 20 + 8}px"
		onclick={() => (expanded = !expanded)}
	>
		{#if mount.type === 'local'}
			<HardDrive size={14} class={typeColor} />
		{:else if mount.type === 'remote'}
			<Cloud size={14} class={typeColor} />
		{:else}
			<GitMerge size={14} class={typeColor} />
		{/if}
		<span class="text-sm font-mono text-text flex-1">{mount.path}</span>
		{#if mount.size > 0}
			<span class="text-xs font-mono text-text-tertiary">{formatBytes(mount.used)} / {formatBytes(mount.size)}</span>
		{/if}
	</button>
	{#if expanded && mount.children}
		{#each mount.children as child}
			<MountTree mount={child} depth={depth + 1} />
		{/each}
	{/if}
</div>
