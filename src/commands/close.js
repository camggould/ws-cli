import { loadConfig } from '../config.js';
import {
  getWorkspacePath,
  workspaceExists,
  writeTabs,
  updateWorkspaceMeta,
} from '../workspace.js';
import { getAdapterForConfig } from '../adapters/index.js';

export async function closeCommand(name, opts) {
  const config = loadConfig();

  // If no name given, try to infer from current directory
  if (!name) {
    const cwd = process.cwd();
    const root = config.root.replace(/^~/, process.env.HOME);
    if (cwd.startsWith(root)) {
      const rel = cwd.slice(root.length + 1).split('/')[0];
      if (rel) name = rel;
    }
    if (!name) {
      console.error('No workspace name given and not inside a workspace.');
      process.exit(1);
    }
  }

  if (!workspaceExists(config, name)) {
    console.error(`Workspace "${name}" does not exist.`);
    process.exit(1);
  }

  const wsPath = getWorkspacePath(config, name);
  console.log(`Closing workspace: ${name}`);

  // Save browser tabs
  if (opts.browser !== false) {
    const browser = getAdapterForConfig(config, 'browser');
    if (browser) {
      try {
        const tabs = browser.listTabs();
        if (tabs.length > 0) {
          writeTabs(wsPath, tabs);
          console.log(`  Browser: saved ${tabs.length} tabs`);
        } else {
          console.log('  Browser: no tabs to save');
        }
      } catch (err) {
        console.log(`  Browser: failed to capture tabs (${err.message})`);
      }
    }
  }

  // Update metadata
  updateWorkspaceMeta(wsPath, { status: 'paused' });
  console.log('  Status: paused');

  console.log(`\nWorkspace "${name}" closed. Resume with: ws open ${name}`);
}
