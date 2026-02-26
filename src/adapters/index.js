import { chromeCli } from './browser/chrome-cli.js';
import { brotab } from './browser/brotab.js';
import { beads } from './tasks/beads.js';
import { taskwarrior } from './tasks/taskwarrior.js';
import { tmux } from './terminal/tmux.js';
import { zellij } from './terminal/zellij.js';
import { cursor } from './editor/cursor.js';
import { vscode } from './editor/vscode.js';

const REGISTRY = {
  browser: {
    'chrome-cli': chromeCli,
    brotab: brotab,
  },
  tasks: {
    beads: beads,
    taskwarrior: taskwarrior,
  },
  terminal: {
    tmux: tmux,
    zellij: zellij,
  },
  editor: {
    cursor: cursor,
    vscode: vscode,
  },
};

export function getAdapter(category, name) {
  const categoryAdapters = REGISTRY[category];
  if (!categoryAdapters) {
    throw new Error(`Unknown adapter category: ${category}`);
  }
  const adapter = categoryAdapters[name];
  if (!adapter) {
    const available = Object.keys(categoryAdapters).join(', ');
    throw new Error(
      `Unknown ${category} adapter: "${name}". Available: ${available}`
    );
  }
  return adapter;
}

export function getAdapterForConfig(config, category) {
  const name = config.adapters[category];
  if (!name) return null;
  return getAdapter(category, name);
}

export function listAdapters() {
  const result = {};
  for (const [category, adapters] of Object.entries(REGISTRY)) {
    result[category] = Object.entries(adapters).map(([name, adapter]) => ({
      name,
      description: adapter.description || '',
    }));
  }
  return result;
}
