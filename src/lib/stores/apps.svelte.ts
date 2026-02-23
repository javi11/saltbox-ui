import type { AppCategory } from '$lib/types/app';

let searchQuery = $state('');
let activeCategory = $state<AppCategory | 'all'>('all');
let viewMode = $state<'grid' | 'list'>('grid');

export function getAppsStore() {
	return {
		get searchQuery() { return searchQuery; },
		set searchQuery(v: string) { searchQuery = v; },
		get activeCategory() { return activeCategory; },
		set activeCategory(v: AppCategory | 'all') { activeCategory = v; },
		get viewMode() { return viewMode; },
		set viewMode(v: 'grid' | 'list') { viewMode = v; },
	};
}
