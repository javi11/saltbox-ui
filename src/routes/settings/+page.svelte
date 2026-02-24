<script lang="ts">
	import { CheckCircle, AlertTriangle, GitCommit, Tag, GitBranch, Clock, ExternalLink, Info } from 'lucide-svelte';

	let { data } = $props();
	const versionStatus = $derived(data.versionStatus);
	const current = $derived(versionStatus.current);
	const latestRelease = $derived(versionStatus.latestRelease);
	const latestDevCommit = $derived(versionStatus.latestDevCommit);
	const outdated = $derived(versionStatus.outdated);
	const isLocalBuild = $derived(versionStatus.isLocalBuild);

	function formatDate(iso: string): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	const githubBase = `https://github.com/javi11/saltbox-ui`;
	const isDevChannel = $derived(current.channel === 'dev');
	const latestLabel = $derived(isDevChannel ? (latestDevCommit ?? 'unknown') : (latestRelease?.tag ?? 'unknown'));
	const compareUrl = $derived(isDevChannel
		? `${githubBase}/commits/main`
		: (latestRelease?.url ?? `${githubBase}/releases/latest`));
</script>

<svelte:head>
	<title>Settings — Saltbox</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-lg font-semibold text-text">Settings</h1>

	<!-- Version Card -->
	<div class="bg-surface border border-border rounded-lg">
		<div class="px-4 py-3 border-b border-border flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Tag size={16} class="text-text-secondary" />
				<h2 class="text-sm font-medium text-text">Saltbox UI Version</h2>
			</div>

			{#if !isLocalBuild}
				{#if outdated}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber border border-amber/25">
						<AlertTriangle size={12} />
						Update available
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green/10 text-green border border-green/25">
						<CheckCircle size={12} />
						Up to date
					</span>
				{/if}
			{/if}
		</div>

		<div class="p-4 space-y-5">
			{#if isLocalBuild}
				<div class="flex items-start gap-3 p-3 bg-blue/10 border border-blue/20 rounded-md">
					<Info size={15} class="text-blue mt-0.5 shrink-0" />
					<p class="text-sm text-text-secondary">
						Running a local build — version metadata is only available in CI-built images from
						<a href="{githubBase}/pkgs/container/saltbox-ui" target="_blank" rel="noopener" class="text-blue underline underline-offset-2">GHCR</a>.
					</p>
				</div>
			{/if}

			<!-- Current version -->
			<div>
				<p class="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Current</p>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<div class="bg-bg border border-border rounded-md px-3 py-2">
						<div class="flex items-center gap-1.5 mb-1">
							<Tag size={11} class="text-text-tertiary" />
							<p class="text-xs text-text-tertiary">Version</p>
						</div>
						<p class="text-sm font-mono text-text">{current.tag}</p>
					</div>
					<div class="bg-bg border border-border rounded-md px-3 py-2">
						<div class="flex items-center gap-1.5 mb-1">
							<GitCommit size={11} class="text-text-tertiary" />
							<p class="text-xs text-text-tertiary">Commit</p>
						</div>
						<p class="text-sm font-mono text-text">{current.commit}</p>
					</div>
					<div class="bg-bg border border-border rounded-md px-3 py-2">
						<div class="flex items-center gap-1.5 mb-1">
							<GitBranch size={11} class="text-text-tertiary" />
							<p class="text-xs text-text-tertiary">Channel</p>
						</div>
						<p class="text-sm font-mono text-text">{current.channel}</p>
					</div>
					{#if current.buildDate}
						<div class="bg-bg border border-border rounded-md px-3 py-2">
							<div class="flex items-center gap-1.5 mb-1">
								<Clock size={11} class="text-text-tertiary" />
								<p class="text-xs text-text-tertiary">Built</p>
							</div>
							<p class="text-sm font-mono text-text">{formatDate(current.buildDate)}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Latest available -->
			<div>
				<p class="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
					Latest available ({isDevChannel ? 'dev' : 'release'})
				</p>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{#if isDevChannel}
						<div class="bg-bg border border-border rounded-md px-3 py-2">
							<div class="flex items-center gap-1.5 mb-1">
								<GitCommit size={11} class="text-text-tertiary" />
								<p class="text-xs text-text-tertiary">Commit</p>
							</div>
							<p class="text-sm font-mono text-text">{latestDevCommit ?? '—'}</p>
						</div>
					{:else}
						<div class="bg-bg border border-border rounded-md px-3 py-2">
							<div class="flex items-center gap-1.5 mb-1">
								<Tag size={11} class="text-text-tertiary" />
								<p class="text-xs text-text-tertiary">Version</p>
							</div>
							<p class="text-sm font-mono text-text">{latestRelease?.tag ?? '—'}</p>
						</div>
						{#if latestRelease?.publishedAt}
							<div class="bg-bg border border-border rounded-md px-3 py-2">
								<div class="flex items-center gap-1.5 mb-1">
									<Clock size={11} class="text-text-tertiary" />
									<p class="text-xs text-text-tertiary">Released</p>
								</div>
								<p class="text-sm font-mono text-text">{formatDate(latestRelease.publishedAt)}</p>
							</div>
						{/if}
					{/if}
				</div>
			</div>

			{#if outdated}
				<a
					href={compareUrl}
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium bg-amber/15 hover:bg-amber/25 text-amber border border-amber/30 transition-colors"
				>
					<ExternalLink size={14} />
					{isDevChannel ? 'View new commits on GitHub' : `View release ${latestLabel} on GitHub`}
				</a>
			{:else if !isLocalBuild}
				<a
					href="{githubBase}/releases"
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
				>
					<ExternalLink size={13} />
					View all releases on GitHub
				</a>
			{/if}
		</div>
	</div>
</div>
