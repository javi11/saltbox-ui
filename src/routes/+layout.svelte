<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import CommandPalette from '$lib/components/layout/CommandPalette.svelte';
	import { getUI } from '$lib/stores/ui.svelte';
	import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-svelte';

	let { children }: { children: Snippet } = $props();
	const ui = getUI();

	const toastIcons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
	const toastColors: Record<string, string> = {
		success: 'border-green/30',
		error: 'border-red/30',
		warning: 'border-yellow/30',
		info: 'border-blue/30'
	};

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			ui.toggleCommandPalette();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-screen bg-bg">
	<Sidebar />

	<div
		class="flex-1 flex flex-col transition-all duration-200 ease-out"
		class:ml-60={!ui.sidebarCollapsed}
		class:ml-16={ui.sidebarCollapsed}
	>
		<Topbar />
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>

<CommandPalette />

<!-- Toast container -->
{#each ui.toasts as toast, idx (toast.id)}
	{@const Icon = toastIcons[toast.type]}
	<div class="fixed right-4 z-[60] bg-surface border rounded-lg px-4 py-3 flex items-center gap-3 animate-slide-in {toastColors[toast.type]}" style="bottom: {16 + idx * 56}px">
		<Icon size={18} />
		<span class="text-sm text-text">{toast.message}</span>
	</div>
{/each}
