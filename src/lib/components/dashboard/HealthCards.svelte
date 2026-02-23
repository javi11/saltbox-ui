<script lang="ts">
	import { Cpu, MemoryStick, HardDrive, Network } from 'lucide-svelte';
	import MetricCard from '$lib/components/ui/MetricCard.svelte';
	import type { SystemHealth } from '$lib/types/system';
	import { formatBytes } from '$lib/utils/format';

	let { health }: { health: SystemHealth } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
	<MetricCard
		label="CPU"
		value={health.cpu.usage.toFixed(1)}
		unit="%"
		subtext="{health.cpu.cores} cores · {health.cpu.temp}°C"
		percent={health.cpu.usage}
		icon={Cpu}
	/>
	<MetricCard
		label="Memory"
		value={formatBytes(health.memory.used)}
		unit="/ {formatBytes(health.memory.total)}"
		subtext="{formatBytes(health.memory.available)} available"
		percent={(health.memory.used / health.memory.total) * 100}
		icon={MemoryStick}
	/>
	<MetricCard
		label="Disk"
		value={formatBytes(health.disk.used)}
		unit="/ {formatBytes(health.disk.total)}"
		subtext="{formatBytes(health.disk.available)} free"
		percent={(health.disk.used / health.disk.total) * 100}
		icon={HardDrive}
	/>
	<MetricCard
		label="Network"
		value={formatBytes(health.network.rx) + '/s'}
		unit=""
		subtext="↑ {formatBytes(health.network.tx)}/s · {health.network.interface}"
		icon={Network}
	/>
</div>
