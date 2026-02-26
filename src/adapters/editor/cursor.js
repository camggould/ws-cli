import { run, spawnDetached, isInstalled } from '../../exec.js';

export const cursor = {
  name: 'cursor',
  description: 'Cursor editor',

  setup: {
    check: () => isInstalled('cursor'),
    install: { manual: 'Download from https://cursor.sh' },
  },

  open(wsPath) {
    spawnDetached('cursor', [wsPath]);
    return { ok: true };
  },
};
