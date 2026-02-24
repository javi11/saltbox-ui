<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, Grid3x3, HardDrive, Container, Activity, Settings, PanelLeftClose, PanelLeft } from 'lucide-svelte';
	import { getUI } from '$lib/stores/ui.svelte';

	const ui = getUI();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/apps', label: 'Apps', icon: Grid3x3 },
		{ href: '/storage', label: 'Storage', icon: HardDrive },
		{ href: '/docker', label: 'Docker', icon: Container },
		{ href: '/system', label: 'System', icon: Activity },
		{ href: '/settings', label: 'Settings', icon: Settings },
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="fixed left-0 top-0 h-full bg-surface border-r border-border flex flex-col transition-all duration-200 ease-out z-40"
	class:w-60={!ui.sidebarCollapsed}
	class:w-16={ui.sidebarCollapsed}
>
	<!-- Logo -->
	<div class="h-12 flex items-center px-4 border-b border-border">
		{#if !ui.sidebarCollapsed}
			<span class="font-mono font-bold text-amber tracking-widest text-sm">SALTBOX</span>
		{:else}
			<span class="font-mono font-bold text-amber text-sm mx-auto">SB</span>
		{/if}
	</div>

	<!-- Navigation -->
	<nav class="flex-1 py-2">
		{#each navItems as item}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				class="flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-all duration-150 relative
					{active ? 'bg-surface-hover text-amber' : 'text-text-secondary hover:text-text hover:bg-surface-hover'}"
			>
				{#if active}
					<div class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber rounded-r"></div>
				{/if}
				<item.icon size={18} />
				{#if !ui.sidebarCollapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Collapse toggle -->
	<div class="p-2 border-t border-border">
		<button
			onclick={() => ui.toggleSidebar()}
			class="flex items-center justify-center w-full p-2 rounded-md text-text-tertiary hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
		>
			{#if ui.sidebarCollapsed}
				<PanelLeft size={18} />
			{:else}
				<PanelLeftClose size={18} />
			{/if}
		</button>
	</div>
</aside>
