<script lang="ts">
	import MountTree from '$lib/components/storage/MountTree.svelte';
	import DiskUsageBar from '$lib/components/storage/DiskUsageBar.svelte';
	import RcloneStatus from '$lib/components/storage/RcloneStatus.svelte';
	import MergeFSConfigView from '$lib/components/storage/MergeFSConfigView.svelte';
	import MetricCard from '$lib/components/ui/MetricCard.svelte';
	import { formatBytes } from '$lib/utils/format';
	import { HardDrive, Cloud, GitMerge, Database } from 'lucide-svelte';

	let { data } = $props();

	const local = $derived(data.mountTree.children?.find(c => c.path === '/mnt/local'));
	const remote = $derived(data.mountTree.children?.find(c => c.path === '/mnt/remote'));
	const union = $derived(data.mountTree.children?.find(c => c.path === '/mnt/unionfs'));
</script>

<svelte:head>
	<title>Storage — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-lg font-semibold text-text">Storage</h1>

	<!-- Overview cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
		<MetricCard label="Local Storage" value={formatBytes(local?.used ?? 0)} unit="used" subtext="{formatBytes(local?.available ?? 0)} available" percent={local ? (local.used / local.size) * 100 : 0} icon={HardDrive} />
		<MetricCard label="Cloud Storage" value={formatBytes(remote?.used ?? 0)} unit="used" subtext="{formatBytes(remote?.available ?? 0)} available" percent={remote ? (remote.used / remote.size) * 100 : 0} icon={Cloud} />
		<MetricCard label="Union (MergeFS)" value={formatBytes(union?.used ?? 0)} unit="used" subtext="{formatBytes(union?.available ?? 0)} available" percent={union ? (union.used / union.size) * 100 : 0} icon={GitMerge} />
		<MetricCard label="Total Capacity" value={formatBytes(union?.size ?? 0)} unit="" subtext="{formatBytes((union?.size ?? 0) - (union?.used ?? 0))} free" icon={Database} />
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Mount tree -->
		<div class="bg-surface border border-border rounded-lg">
			<div class="px-4 py-3 border-b border-border">
				<h3 class="text-sm font-medium text-text">Mount Tree</h3>
			</div>
			<div class="p-2">
				<MountTree mount={data.mountTree} />
			</div>
		</div>

		<!-- Disk usage -->
		<div class="bg-surface border border-border rounded-lg">
			<div class="px-4 py-3 border-b border-border">
				<h3 class="text-sm font-medium text-text">Disk Usage</h3>
			</div>
			<div class="p-4 space-y-4">
				{#if local}
					<DiskUsageBar label="Local (/mnt/local)" used={local.used} total={local.size} color="amber" />
				{/if}
				{#if remote}
					<DiskUsageBar label="Cloud (/mnt/remote)" used={remote.used} total={remote.size} color="blue" />
				{/if}
				{#if union}
					<DiskUsageBar label="Union (/mnt/unionfs)" used={union.used} total={union.size} color="green" />
				{/if}
			</div>
		</div>
	</div>

	<!-- Rclone remotes -->
	<div>
		<h2 class="text-sm font-medium text-text mb-4">Rclone Remotes</h2>
		<RcloneStatus remotes={data.remotes} />
	</div>

	<!-- MergeFS config -->
	<MergeFSConfigView config={data.mergeFSConfig} />
</div>
