import path from 'path';
import { loadConfig, resolveRoot } from '../config.js';
import { createWorkspace, getWorkspacePath, workspaceExists } from '../workspace.js';
import { getAdapterForConfig } from '../adapters/index.js';

export async function createCommand(name, opts) {
  const config = loadConfig();
  const root = resolveRoot(config);

  // Resolve name for sub-workspaces
  let fullName = name;
  if (opts.parent) {
    if (!workspaceExists(config, opts.parent)) {
      console.error(`Parent workspace "${opts.parent}" does not exist.`);
      process.exit(1);
    }
    fullName = `${opts.parent}${path.sep}${name}`;
  }

  if (workspaceExists(config, fullName)) {
    console.error(`Workspace "${fullName}" already exists.`);
    process.exit(1);
  }

  console.log(`Creating workspace: ${fullName}`);

  // Create workspace directory and metadata
  const { path: wsPath, meta } = createWorkspace(config, fullName, {
    tags: opts.tags,
    parent: opts.parent || null,
    status: 'active',
  });

  console.log(`  Directory: ${wsPath}`);
  console.log(`  Status: ${meta.status}`);
  if (meta.tags?.length) console.log(`  Tags: ${meta.tags.join(', ')}`);
  if (meta.parent) console.log(`  Parent: ${meta.parent}`);

  // Initialize task tracker
  if (opts.tasks !== false) {
    const tasks = getAdapterForConfig(config, 'tasks');
    if (tasks) {
      try {
        const result = tasks.init(wsPath);
        if (result?.already) {
          console.log(`  Tasks (${tasks.name}): already initialized`);
        } else if (result?.ok) {
          console.log(`  Tasks (${tasks.name}): initialized`);
        } else {
          console.log(`  Tasks (${tasks.name}): init failed (is ${tasks.name} installed?)`);
        }
      } catch (err) {
        console.log(`  Tasks (${tasks.name}): skipped (${err.message})`);
      }
    }
  }

  // Create terminal session
  if (opts.terminal !== false) {
    const terminal = getAdapterForConfig(config, 'terminal');
    if (terminal) {
      try {
        const sessionName = fullName.replace(/\//g, '-');
        const result = terminal.createSession(sessionName, wsPath);
        if (result?.already) {
          console.log(`  Terminal (${terminal.name}): session already exists`);
        } else if (result?.ok) {
          console.log(`  Terminal (${terminal.name}): session "${sessionName}" created`);
        } else {
          console.log(`  Terminal (${terminal.name}): session creation failed`);
        }
      } catch (err) {
        console.log(`  Terminal (${terminal.name}): skipped (${err.message})`);
      }
    }
  }

  // Initialize git if not already a repo
  const { run } = await import('../exec.js');
  const gitCheck = run('git', ['rev-parse', '--git-dir'], { cwd: wsPath });
  if (!gitCheck.ok) {
    run('git', ['init'], { cwd: wsPath });
    console.log('  Git: initialized');
  }

  console.log(`\nWorkspace "${fullName}" created. Open with: ws open ${fullName}`);
}
