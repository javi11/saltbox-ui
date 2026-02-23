<div class="space-y-6 animate-fade-in">
	<!-- Header skeleton -->
	<div class="space-y-2">
		<div class="h-7 w-48 bg-surface rounded-md animate-shimmer"></div>
		<div class="h-4 w-72 bg-surface rounded-md animate-shimmer [animation-delay:75ms]"></div>
	</div>

	<!-- Metric cards row -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each { length: 4 } as _}
			<div class="h-24 bg-surface rounded-lg animate-shimmer"></div>
		{/each}
	</div>

	<!-- Content blocks -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="h-64 bg-surface rounded-lg animate-shimmer [animation-delay:100ms]"></div>
		<div class="h-64 bg-surface rounded-lg animate-shimmer [animation-delay:150ms]"></div>
	</div>
</div>
