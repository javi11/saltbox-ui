import type { CustomAppDefinition } from '$lib/types/app';
import { getCustomApps, customAppRunArgs } from './custom-apps';
import { getApps, getInstallTag } from './saltbox';
import { startJob } from './jobs';
import { shellEscape } from './host-exec';

export interface AppJobResult {
	success: boolean;
	jobId?: string;
	error?: string;
}

const command = (args: string[]) => args.map(shellEscape).join(' ');

export async function startUpdateAll(): Promise<AppJobResult> {
	try {
		const [apps, customApps] = await Promise.all([getApps(), getCustomApps()]);
		const customSlugs = new Set(customApps.map((app) => app.slug));
		const tags = await Promise.all(apps.filter((app) => !customSlugs.has(app.slug)).map((app) => getInstallTag(app.slug)));
		const steps: string[] = [];
		const installedTags = [...new Set(tags.filter((tag): tag is string => !!tag))];
		if (installedTags.length) steps.push(command(['sb', 'install', installedTags.join(',')]));
		for (const custom of customApps.filter((app) => apps.some((installed) => installed.slug === app.slug))) {
			steps.push(customAppCommand(custom, true));
		}
		if (!steps.length) return { success: false, error: 'No installed apps with a known deployment definition' };
		const job = startJob('sh', ['-c', steps.join(' && ')], { resource: 'apps' });
		return { success: true, jobId: job.id };
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'Unable to start update' };
	}
}

function customAppCommand(custom: CustomAppDefinition, update: boolean): string {
	const pull = command(['docker', 'pull', custom.image]);
	if (!update) return `${pull} && ${command(['docker', ...customAppRunArgs(custom)])}`;
	const backup = `${custom.slug}-saltbox-ui-backup`;
	const runArgs = customAppRunArgs(custom, backup);
	const image = runArgs.pop()!;
	// Keep inherited anonymous volumes, but still honor newly configured paths.
	const newVolumes = (custom.volumes ?? []).filter((volume) => !volume.includes(':')).map((volume) =>
		`case "$previous_mounts" in *${shellEscape(`|${volume}|`)}*) ;; *) set -- "$@" '-v' ${shellEscape(volume)};; esac`
	).join('\n');
	// Retain the old container and its volumes until the replacement starts.
	// A failed pull never touches it; a failed run restores its name and state.
	return `${pull} && previous_running=$(${command(['docker', 'inspect', '-f', '{{.State.Running}}', custom.slug])}) &&
previous_mounts=$(${command(['docker', 'inspect', '-f', '{{range .Mounts}}{{printf "|%s|" .Destination}}{{end}}', custom.slug])}) &&
${command(['docker', 'rename', custom.slug, backup])} &&
{
set --
${newVolumes}
if ${command(['docker', 'stop', backup])} && ${command(['docker', ...runArgs])} "$@" ${shellEscape(image)}; then
	${command(['docker', 'rm', backup])}
else
	update_exit=$?
	${command(['docker', 'rm', '-f', custom.slug])} >/dev/null 2>&1 || true
	${command(['docker', 'rename', backup, custom.slug])} && {
		if [ "$previous_running" = true ]; then ${command(['docker', 'start', custom.slug])}; fi
	}
	exit "$update_exit"
fi
}`;
}

export async function startAppJob(slug: string, update = false): Promise<AppJobResult> {
	if (!/^[a-z0-9-]+$/.test(slug)) return { success: false, error: 'Invalid app slug' };
	try {
		const custom = (await getCustomApps()).find((app) => app.slug === slug);
		if (custom) {
			// Pull before touching a running container, so a registry failure leaves it running.
			const job = startJob('sh', ['-c', customAppCommand(custom, update)], { tty: false, resource: 'apps' });
			return { success: true, jobId: job.id };
		}
		const tag = await getInstallTag(slug);
		if (!tag) return { success: false, error: `No install role found for ${slug}` };
		const job = startJob('sb', ['install', tag], { resource: 'apps' });
		return { success: true, jobId: job.id };
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'Unable to start app job' };
	}
}
