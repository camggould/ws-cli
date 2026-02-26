import { run, runLive, isInstalled } from '../../exec.js';

export const tmux = {
  name: 'tmux',
  description: 'Terminal multiplexer',

  setup: {
    check: () => isInstalled('tmux'),
    install: { brew: 'tmux' },
  },

  sessionExists(name) {
    const result = run('tmux', ['has-session', '-t', name]);
    return result.ok;
  },

  createSession(name, wsPath) {
    if (this.sessionExists(name)) return { ok: true, already: true };
    return run('tmux', ['new-session', '-d', '-s', name, '-c', wsPath]);
  },

  attachSession(name) {
    // If we're already in tmux, switch client; otherwise attach
    if (process.env.TMUX) {
      return runLive('tmux', ['switch-client', '-t', name]);
    }
    return runLive('tmux', ['attach', '-t', name]);
  },

  killSession(name) {
    return run('tmux', ['kill-session', '-t', name]);
  },

  listSessions() {
    const result = run('tmux', [
      'list-sessions',
      '-F',
      '#{session_name}:#{session_windows}:#{session_attached}',
    ]);
    if (!result.ok) return [];
    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, windows, attached] = line.split(':');
        return { name, windows: parseInt(windows), attached: attached === '1' };
      });
  },
};
