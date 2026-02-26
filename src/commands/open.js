import { loadConfig } from '../config.js';
import {
  getWorkspacePath,
  workspaceExists,
  readTabs,
  updateWorkspaceMeta,
} from '../workspace.js';
import { getAdapterForConfig } from '../adapters/index.js';

export async function openCommand(name, opts) {
  const config = loadConfig();

  if (!workspaceExists(config, name)) {
    console.error(`Workspace "${name}" does not exist. Create it with: ws create ${name}`);
    process.exit(1);
  }

  const wsPath = getWorkspacePath(config, name);
  console.log(`Opening workspace: ${name}`);
  console.log(`  Path: ${wsPath}`);

  // Update last_opened
  const now = new Date().toISOString().split('T')[0];
  updateWorkspaceMeta(wsPath, { last_opened: now, status: 'active' });

  // Restore terminal session
  if (opts.terminal !== false) {
    const terminal = getAdapterForConfig(config, 'terminal');
    if (terminal) {
      const sessionName = name.replace(/\//g, '-');
      try {
        if (!terminal.sessionExists(sessionName)) {
          terminal.createSession(sessionName, wsPath);
          console.log(`  Terminal: created session "${sessionName}"`);
        } else {
          console.log(`  Terminal: session "${sessionName}" exists`);
        }
      } catch (err) {
        console.log(`  Terminal: skipped (${err.message})`);
      }
    }
  }

  // Restore browser tabs
  if (opts.browser !== false) {
    const browser = getAdapterForConfig(config, 'browser');
    if (browser) {
      const tabs = readTabs(wsPath);
      if (tabs.length > 0) {
        try {
          const opened = browser.openTabs(tabs);
          console.log(`  Browser: restored ${opened}/${tabs.length} tabs`);
        } catch (err) {
          console.log(`  Browser: failed to restore tabs (${err.message})`);
        }
      } else {
        console.log('  Browser: no saved tabs');
      }
    }
  }

  // Open editor
  if (opts.editor !== false) {
    const editor = getAdapterForConfig(config, 'editor');
    if (editor) {
      try {
        editor.open(wsPath);
        console.log(`  Editor: opened ${editor.name}`);
      } catch (err) {
        console.log(`  Editor: failed (${err.message})`);
      }
    }
  }

  // Show task summary if available
  const tasks = getAdapterForConfig(config, 'tasks');
  if (tasks) {
    try {
      const summary = tasks.getSummary(wsPath);
      if (summary) {
        console.log(`  Tasks: ${summary.split('\n').length} items`);
      }
    } catch {
      // silent
    }
  }

  console.log(`\nWorkspace "${name}" is open.`);
}
