import type { AppCategory } from '$lib/types/app';
import type { Status } from '$lib/types/common';

export const CATEGORY_LABELS: Record<AppCategory, string> = {
	media: 'Media',
	pvr: 'PVR',
	downloaders: 'Downloaders',
	tools: 'Tools',
	monitoring: 'Monitoring',
	network: 'Network'
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string; dotColor: string }> = {
	running: { label: 'Running', color: 'text-green', dotColor: 'bg-green' },
	stopped: { label: 'Stopped', color: 'text-text-secondary', dotColor: 'bg-text-secondary' },
	error: { label: 'Error', color: 'text-red', dotColor: 'bg-red' },
	updating: { label: 'Updating', color: 'text-blue', dotColor: 'bg-blue' },
	installing: { label: 'Installing', color: 'text-yellow', dotColor: 'bg-yellow' }
};

export const NAV_ITEMS = [
	{ href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
	{ href: '/apps', label: 'Apps', icon: 'Grid3x3' },
	{ href: '/storage', label: 'Storage', icon: 'HardDrive' },
	{ href: '/docker', label: 'Docker', icon: 'Container' },
	{ href: '/system', label: 'System', icon: 'Activity' }
] as const;
