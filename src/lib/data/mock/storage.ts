import type { MountPoint, RcloneRemote, MergeFSConfig } from '$lib/types/storage';

export const mountTree: MountPoint = {
	path: '/mnt',
	type: 'local',
	size: 0,
	used: 0,
	available: 0,
	filesystem: '-',
	children: [
		{
			path: '/mnt/local',
			type: 'local',
			size: 2000000000000,
			used: 850000000000,
			available: 1150000000000,
			filesystem: 'ext4',
			children: [
				{ path: '/mnt/local/Media', type: 'local', size: 2000000000000, used: 620000000000, available: 1380000000000, filesystem: 'ext4' },
				{ path: '/mnt/local/downloads', type: 'local', size: 2000000000000, used: 180000000000, available: 1820000000000, filesystem: 'ext4' },
				{ path: '/mnt/local/transcodes', type: 'local', size: 2000000000000, used: 50000000000, available: 1950000000000, filesystem: 'ext4' },
			]
		},
		{
			path: '/mnt/remote',
			type: 'remote',
			size: 50000000000000,
			used: 32000000000000,
			available: 18000000000000,
			filesystem: 'rclone (google)',
			children: [
				{ path: '/mnt/remote/Media', type: 'remote', size: 50000000000000, used: 31500000000000, available: 18500000000000, filesystem: 'rclone (google)' },
				{ path: '/mnt/remote/Backups', type: 'remote', size: 50000000000000, used: 500000000000, available: 49500000000000, filesystem: 'rclone (google)' },
			]
		},
		{
			path: '/mnt/unionfs',
			type: 'union',
			size: 52000000000000,
			used: 32850000000000,
			available: 19150000000000,
			filesystem: 'mergerfs',
			children: [
				{ path: '/mnt/unionfs/Media', type: 'union', size: 52000000000000, used: 32120000000000, available: 19880000000000, filesystem: 'mergerfs' },
				{ path: '/mnt/unionfs/downloads', type: 'union', size: 52000000000000, used: 180000000000, available: 51820000000000, filesystem: 'mergerfs' },
			]
		}
	]
};

export const rcloneRemotes: RcloneRemote[] = [
	{ name: 'google', type: 'drive', connected: true, bandwidth: { up: 12582912, down: 31457280 }, transferred: 1099511627776, errors: 0 },
	{ name: 'dropbox', type: 'dropbox', connected: true, bandwidth: { up: 5242880, down: 10485760 }, transferred: 214748364800, errors: 2 },
	{ name: 'b2-backup', type: 'b2', connected: false, bandwidth: { up: 0, down: 0 }, transferred: 536870912000, errors: 0 },
];

export const mergeFSConfig: MergeFSConfig = {
	mountPoint: '/mnt/unionfs',
	branches: [
		{ path: '/mnt/local', mode: 'RW' },
		{ path: '/mnt/remote', mode: 'RO' },
	],
	policy: {
		create: 'epmfs',
		search: 'ff',
		action: 'all',
	},
	cacheTimeout: 60,
};
