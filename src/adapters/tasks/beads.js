import fs from 'fs';
import path from 'path';
import { run, runLive, isInstalled } from '../../exec.js';

export const beads = {
  name: 'beads',
  description: 'Git-backed issue tracker for AI coding agents',

  setup: {
    check: () => isInstalled('bd'),
    install: { npm: '@anthropic-ai/beads', pipx: 'beads-cli' },
    installNote:
      'Install beads: see https://github.com/steveyegge/beads for latest instructions',
  },

  isInitialized(wsPath) {
    return fs.existsSync(path.join(wsPath, '.beads'));
  },

  init(wsPath) {
    if (this.isInitialized(wsPath)) return { ok: true, already: true };
    return run('bd', ['init'], { cwd: wsPath });
  },

  listIssues(wsPath) {
    const result = run('bd', ['list'], { cwd: wsPath });
    if (!result.ok) return [];
    return result.stdout;
  },

  getSummary(wsPath) {
    if (!this.isInitialized(wsPath)) return null;
    const result = run('bd', ['list'], { cwd: wsPath });
    if (!result.ok) return null;
    return result.stdout;
  },
};
