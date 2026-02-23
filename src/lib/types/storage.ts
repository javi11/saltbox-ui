export interface MountPoint {
	path: string;
	type: 'local' | 'remote' | 'union';
	size: number;
	used: number;
	available: number;
	filesystem: string;
	children?: MountPoint[];
}

export interface RcloneRemote {
	name: string;
	type: string;
	connected: boolean;
	bandwidth: { up: number; down: number };
	transferred: number;
	errors: number;
}

export interface MergeFSBranch {
	path: string;
	mode: 'RW' | 'RO' | 'NC';
}

export interface MergeFSConfig {
	mountPoint: string;
	branches: MergeFSBranch[];
	policy: {
		create: string;
		search: string;
		action: string;
	};
	cacheTimeout: number;
}
