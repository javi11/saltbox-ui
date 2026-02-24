import { startJob } from './jobs';

const SALTBOX_UI_DIR = process.env.SALTBOX_UI_DIR ?? '';
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'javi11/saltbox-ui';

export interface SelfVersion {
	configured: boolean;
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

export async function getSelfVersion(): Promise<SelfVersion> {
	return {
		configured: !!SALTBOX_UI_DIR,
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

export function selfUpdate(channel: 'dev' | 'release'): ReturnType<typeof startJob> {
	if (!SALTBOX_UI_DIR) {
		throw new Error('SALTBOX_UI_DIR is not configured');
	}

	const dir = SALTBOX_UI_DIR;
	const imageTag = channel === 'dev' ? 'dev' : 'latest';
	const image = `ghcr.io/${GITHUB_REPO}:${imageTag}`;

	const script = [
		`docker pull ${image}`,
		`CHANNEL=${imageTag} docker compose -f '${dir}/docker-compose.yml' up -d saltbox-ui`
	].join(' && ');

	return startJob('sh', ['-c', script]);
}
