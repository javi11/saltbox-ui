const GITHUB_REPO = process.env.GITHUB_REPO ?? 'javi11/saltbox-ui';

export interface SelfVersion {
	tag: string;
	commit: string;
	channel: string;
	buildDate: string;
}

export interface LatestRelease {
	tag: string;
	publishedAt: string;
	url: string;
}

export interface VersionStatus {
	current: SelfVersion;
	latestRelease: LatestRelease | null;
	latestDevCommit: string | null;
	outdated: boolean;
	isLocalBuild: boolean;
}

export function getSelfVersion(): SelfVersion {
	return {
		tag: process.env.BUILD_VERSION ?? 'unknown',
		commit: (process.env.BUILD_COMMIT ?? 'unknown').slice(0, 7),
		channel: process.env.CHANNEL ?? 'latest',
		buildDate: process.env.BUILD_DATE ?? ''
	};
}

export async function getLatestRelease(): Promise<LatestRelease | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
			headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
			signal: AbortSignal.timeout(8_000)
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { tag_name: string; published_at: string; html_url: string };
		return { tag: data.tag_name, publishedAt: data.published_at, url: data.html_url };
	} catch {
		return null;
	}
}

export async function getLatestDevCommit(): Promise<string | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
			headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
			signal: AbortSignal.timeout(8_000)
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { sha: string };
		return data.sha.slice(0, 7);
	} catch {
		return null;
	}
}

export async function getVersionStatus(): Promise<VersionStatus> {
	const current = getSelfVersion();
	const isLocalBuild = current.tag === 'unknown' || current.commit === 'unknown';

	const [latestRelease, latestDevCommit] = await Promise.all([
		getLatestRelease(),
		getLatestDevCommit()
	]);

	let outdated = false;
	if (!isLocalBuild) {
		if (current.channel === 'dev') {
			outdated = latestDevCommit !== null && latestDevCommit !== current.commit;
		} else {
			outdated = latestRelease !== null && latestRelease.tag !== current.tag;
		}
	}

	return { current, latestRelease, latestDevCommit, outdated, isLocalBuild };
}
