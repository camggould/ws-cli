import { run, spawnDetached, isInstalled } from '../../exec.js';

export const vscode = {
  name: 'vscode',
  description: 'Visual Studio Code',

  setup: {
    check: () => isInstalled('code'),
    install: { brew: 'visual-studio-code', cask: true },
  },

  open(wsPath) {
    spawnDetached('code', [wsPath]);
    return { ok: true };
  },
};
