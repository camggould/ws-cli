import fs from 'fs';
import path from 'path';
import { loadConfig, resolveRoot } from '../config.js';
import { getWorkspacePath, workspaceExists, updateWorkspaceMeta } from '../workspace.js';
import { getAdapterForConfig } from '../adapters/index.js';

export async function archiveCommand(name) {
  const config = loadConfig();

  if (!workspaceExists(config, name)) {
    console.error(`Workspace "${name}" does not exist.`);
    process.exit(1);
  }

  const wsPath = getWorkspacePath(config, name);

  // Kill terminal session if it exists
  const terminal = getAdapterForConfig(config, 'terminal');
  if (terminal) {
    const sessionName = name.replace(/\//g, '-');
    try {
      if (terminal.sessionExists(sessionName)) {
        terminal.killSession(sessionName);
        console.log(`  Terminal: killed session "${sessionName}"`);
      }
    } catch {
      // silent
    }
  }

  // Update status
  updateWorkspaceMeta(wsPath, { status: 'archived' });

  // Move to .archive directory
  const root = resolveRoot(config);
  const archiveDir = path.join(root, '.archive');
  const archiveDest = path.join(archiveDir, name);

  fs.mkdirSync(path.dirname(archiveDest), { recursive: true });
  // If destination exists (e.g., parent dir from a child archive), merge via cpSync + rmSync
  if (fs.existsSync(archiveDest)) {
    fs.cpSync(wsPath, archiveDest, { recursive: true, force: true });
    fs.rmSync(wsPath, { recursive: true, force: true });
  } else {
    fs.renameSync(wsPath, archiveDest);
  }

  console.log(`Workspace "${name}" archived to ${archiveDest}`);
}
