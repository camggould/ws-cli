import { run, runLive, isInstalled } from '../../exec.js';

export const zellij = {
  name: 'zellij',
  description: 'Zellij terminal workspace',

  setup: {
    check: () => isInstalled('zellij'),
    install: { brew: 'zellij' },
  },

  sessionExists(name) {
    const result = run('zellij', ['list-sessions']);
    if (!result.ok) return false;
    return result.stdout.split('\n').some((line) => line.trim().startsWith(name));
  },

  createSession(name, wsPath) {
    if (this.sessionExists(name)) return { ok: true, already: true };
    return run('zellij', ['--session', name], { cwd: wsPath });
  },

  attachSession(name) {
    return runLive('zellij', ['attach', name]);
  },

  killSession(name) {
    return run('zellij', ['kill-session', name]);
  },

  listSessions() {
    const result = run('zellij', ['list-sessions']);
    if (!result.ok) return [];
    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => ({ name: line.trim(), windows: 0, attached: false }));
  },
};
