<script lang="ts">
	import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-svelte';

	let {
		message,
		type = 'info',
		visible = $bindable(true)
	}: {
		message: string;
		type?: 'success' | 'error' | 'warning' | 'info';
		visible?: boolean;
	} = $props();

	const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
	const colors = {
		success: 'border-green/30 text-green',
		error: 'border-red/30 text-red',
		warning: 'border-yellow/30 text-yellow',
		info: 'border-blue/30 text-blue'
	};

	$effect(() => {
		if (visible) {
			const timer = setTimeout(() => (visible = false), 4000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if visible}
	<div class="fixed bottom-4 right-4 z-[60] bg-surface border rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg animate-slide-in {colors[type]}">
		{#if type === 'success'}<CheckCircle size={18} />
		{:else if type === 'error'}<XCircle size={18} />
		{:else if type === 'warning'}<AlertTriangle size={18} />
		{:else}<Info size={18} />
		{/if}
		<span class="text-sm text-text">{message}</span>
	</div>
{/if}
