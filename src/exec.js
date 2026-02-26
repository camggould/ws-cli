import { execFileSync, execFile as execFileCb } from 'child_process';

/**
 * Run a command safely using execFile (no shell interpolation).
 * Pass the command as separate args: run('git', ['status', '--porcelain'])
 */
export function run(cmd, args = [], opts = {}) {
  try {
    const result = execFileSync(cmd, args, {
      encoding: 'utf-8',
      timeout: opts.timeout || 15000,
      cwd: opts.cwd,
      stdio: opts.stdio || ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...opts.env },
    });
    return { ok: true, stdout: result.trim(), code: 0 };
  } catch (err) {
    return {
      ok: false,
      stdout: (err.stdout || '').trim(),
      stderr: (err.stderr || '').trim(),
      code: err.status,
    };
  }
}

/**
 * Run a command with inherited stdio (visible to user).
 */
export function runLive(cmd, args = [], opts = {}) {
  try {
    execFileSync(cmd, args, {
      cwd: opts.cwd,
      stdio: 'inherit',
      env: { ...process.env, ...opts.env },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a command is available on PATH.
 */
export function isInstalled(cmd) {
  const result = run('which', [cmd]);
  return result.ok;
}

/**
 * Run a shell command when shell features are needed (pipes, redirects).
 * Only use with trusted, hardcoded command strings — never with user input.
 */
export function runShell(shellCmd, opts = {}) {
  try {
    const result = execFileSync('/bin/sh', ['-c', shellCmd], {
      encoding: 'utf-8',
      timeout: opts.timeout || 15000,
      cwd: opts.cwd,
      stdio: opts.stdio || ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...opts.env },
    });
    return { ok: true, stdout: result.trim(), code: 0 };
  } catch (err) {
    return {
      ok: false,
      stdout: (err.stdout || '').trim(),
      stderr: (err.stderr || '').trim(),
      code: err.status,
    };
  }
}

/**
 * Spawn a detached process (for opening editors, etc.).
 */
export function spawnDetached(cmd, args = [], opts = {}) {
  const child = execFileCb(cmd, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return child;
}
