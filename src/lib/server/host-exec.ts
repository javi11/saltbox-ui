import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// nsenter flags: -t 1 targets host PID 1; -m -u -i -n enters mount, UTS, IPC, and network namespaces
const NSENTER_PREFIX = ['-t', '1', '-m', '-u', '-i', '-n', '--'];

// Clean environment for host-side execution — avoids leaking container env vars
// and ensures Ansible correctly detects the process as root.
const HOST_ENV: Record<string, string> = {
	HOME: '/root',
	USER: 'root',
	LOGNAME: 'root',
	PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
	LANG: 'en_US.UTF-8',
	TERM: 'dumb',
	ANSIBLE_FORCE_COLOR: '0'
};

/**
 * Execute a command on the host via nsenter.
 * Requires the container to run with `pid: host` and `privileged: true`.
 */
export async function hostExec(
	command: string,
	args: string[],
	options: { timeout?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
	return execFileAsync('nsenter', [...NSENTER_PREFIX, command, ...args], {
		timeout: options.timeout,
		env: HOST_ENV
	});
}

function shellEscape(s: string): string {
	return "'" + s.replace(/'/g, "'\\''" ) + "'";
}

/**
 * Spawn a long-running command on the host via nsenter.
 * Returns a ChildProcess with stdout/stderr streams.
 *
 * When `tty` is true the command is wrapped with `script` so that the child
 * sees an allocated pseudo-terminal — required by tools like `sb` that refuse
 * to run without a TTY.
 */
export function hostSpawn(
	command: string,
	args: string[],
	options?: { tty?: boolean }
): ChildProcess {
	if (options?.tty) {
		const shellCmd = [command, ...args].map(shellEscape).join(' ');
		return spawn('nsenter', [...NSENTER_PREFIX, 'script', '-qefc', shellCmd, '/dev/null'], {
			stdio: ['pipe', 'pipe', 'pipe'],
			env: HOST_ENV
		});
	}

	return spawn('nsenter', [...NSENTER_PREFIX, command, ...args], {
		stdio: ['ignore', 'pipe', 'pipe'],
		env: HOST_ENV
	});
}
