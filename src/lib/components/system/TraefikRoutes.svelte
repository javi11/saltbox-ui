<script lang="ts">
	import type { TraefikRoute } from '$lib/types/system';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Lock, Shield } from 'lucide-svelte';

	let { routes }: { routes: TraefikRoute[] } = $props();
</script>

<div class="bg-surface border border-border rounded-lg">
	<div class="px-4 py-3 border-b border-border">
		<h3 class="text-sm font-medium text-text">Traefik Routes</h3>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border">
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Rule</th>
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Service</th>
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">TLS</th>
					<th class="text-left py-2.5 px-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Middlewares</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each routes as route}
					<tr class="hover:bg-surface-hover transition-colors">
						<td class="py-2.5 px-3 font-mono text-xs text-text-secondary">{route.rule}</td>
						<td class="py-2.5 px-3 font-mono text-text">{route.service}</td>
						<td class="py-2.5 px-3">
							{#if route.tls}
								<Lock size={14} class="text-green" />
							{/if}
						</td>
						<td class="py-2.5 px-3">
							{#if route.middlewares.length > 0}
								{#each route.middlewares as mw}
									<Badge variant="default">
										<Shield size={10} />
										{mw}
									</Badge>
								{/each}
							{:else}
								<span class="text-xs text-text-tertiary">none</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
