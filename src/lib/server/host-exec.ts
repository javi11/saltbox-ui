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

/**
 * Spawn a long-running command on the host via nsenter.
 * Returns a ChildProcess with stdout/stderr streams.
 */
export function hostSpawn(command: string, args: string[]): ChildProcess {
	return spawn('nsenter', [...NSENTER_PREFIX, command, ...args], {
		stdio: ['ignore', 'pipe', 'pipe'],
		env: HOST_ENV
	});
}
