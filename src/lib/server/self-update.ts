import { hostExec } from './host-exec';
import { startJob } from './jobs';

const SALTBOX_UI_DIR = process.env.SALTBOX_UI_DIR ?? '';
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'javi11/saltbox-ui';

export interface SelfVersion {
	configured: boolean;
	tag: string;
	commit: string;
	branch: string;
}

export interface LatestRelease {
	tag: string;
	publishedAt: string;
	url: string;
}

export async function getSelfVersion(): Promise<SelfVersion> {
	if (!SALTBOX_UI_DIR) {
		return { configured: false, tag: 'unknown', commit: 'unknown', branch: 'unknown' };
	}

	try {
		const [describeResult, branchResult] = await Promise.all([
			hostExec('git', ['-C', SALTBOX_UI_DIR, 'describe', '--tags', '--always', '--long'], {
				timeout: 10_000
			}),
			hostExec('git', ['-C', SALTBOX_UI_DIR, 'rev-parse', '--abbrev-ref', 'HEAD'], {
				timeout: 10_000
			})
		]);

		// Format: v1.2.3-4-gabcdef1 (tag-commits-ghash) or just a commit hash if no tags
		const describe = describeResult.stdout.trim();
		const branch = branchResult.stdout.trim();

		// Extract short commit from describe or separate call
		const parts = describe.match(/^(.*)-(\d+)-g([0-9a-f]+)$/);
		if (parts) {
			return {
				configured: true,
				tag: parts[1],
				commit: parts[3],
				branch
			};
		}

		// No tags yet — describe returns the raw commit hash
		return { configured: true, tag: 'untagged', commit: describe.slice(0, 7), branch };
	} catch {
		return { configured: true, tag: 'unknown', commit: 'unknown', branch: 'unknown' };
	}
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

	const script =
		channel === 'dev'
			? [
					`git -C '${dir}' fetch origin`,
					`git -C '${dir}' checkout main`,
					`git -C '${dir}' pull origin main`,
					`docker compose -f '${dir}/docker-compose.yml' up -d --build`
				].join(' && ')
			: [
					`git -C '${dir}' fetch --tags origin`,
					`LATEST=$(git -C '${dir}' describe --tags $(git -C '${dir}' rev-list --tags --max-count=1))`,
					`git -C '${dir}' checkout "$LATEST"`,
					`docker compose -f '${dir}/docker-compose.yml' up -d --build`
				].join(' && ');

	return startJob('sh', ['-c', script]);
}
