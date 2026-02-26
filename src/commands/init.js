import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { loadConfig, resolveRoot } from '../config.js';
import { getAdapterForConfig } from '../adapters/index.js';
import { writeWsGitignore } from '../workspace.js';
import { run } from '../exec.js';

const WS_MARKER = '.workspace.yaml';
const WS_DOC = 'workspace.md';
const TABS_FILE = 'tabs.json';

export async function initCommand(opts) {
  const config = loadConfig();
  const root = resolveRoot(config);
  const targetDir = path.resolve(opts.path || process.cwd());

  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`Not a directory: ${targetDir}`);
    process.exit(1);
  }

  if (fs.existsSync(path.join(targetDir, WS_MARKER))) {
    console.error(`Already a workspace: ${targetDir}`);
    process.exit(1);
  }

  const name = opts.name || path.basename(targetDir);
  console.log(`Initializing workspace in existing directory: ${targetDir}`);

  // Write workspace metadata (never overwrites existing files)
  const now = new Date().toISOString().split('T')[0];
  const meta = {
    name,
    status: 'active',
    created: now,
    last_opened: now,
    tags: opts.tags || [],
    parent: null,
  };

  fs.writeFileSync(
    path.join(targetDir, WS_MARKER),
    yaml.dump(meta, { lineWidth: -1 })
  );
  console.log(`  Created ${WS_MARKER}`);

  if (!fs.existsSync(path.join(targetDir, WS_DOC))) {
    const mdContent = `---
${yaml.dump(meta, { lineWidth: -1 }).trim()}
---

# ${name}

## Purpose


## Notes


## Links

`;
    fs.writeFileSync(path.join(targetDir, WS_DOC), mdContent);
    console.log(`  Created ${WS_DOC}`);
  } else {
    console.log(`  ${WS_DOC} already exists, skipping`);
  }

  if (!fs.existsSync(path.join(targetDir, TABS_FILE))) {
    fs.writeFileSync(path.join(targetDir, TABS_FILE), '[]\n');
    console.log(`  Created ${TABS_FILE}`);
  }

  // Write or append workspace entries to .gitignore
  writeWsGitignore(targetDir);
  console.log('  Updated .gitignore');

  // Initialize task tracker
  if (opts.tasks !== false) {
    const tasks = getAdapterForConfig(config, 'tasks');
    if (tasks) {
      try {
        const result = tasks.init(targetDir);
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
        const sessionName = name.replace(/\//g, '-');
        const result = terminal.createSession(sessionName, targetDir);
        if (result?.already) {
          console.log(`  Terminal (${terminal.name}): session already exists`);
        } else if (result?.ok) {
          console.log(`  Terminal (${terminal.name}): session "${sessionName}" created`);
        }
      } catch (err) {
        console.log(`  Terminal (${terminal.name}): skipped (${err.message})`);
      }
    }
  }

  // If the directory is outside the workspaces root, offer to link it in
  if (!targetDir.startsWith(root)) {
    if (opts.link) {
      const linkPath = path.join(root, name);
      if (fs.existsSync(linkPath)) {
        console.log(`\n  Cannot link: ${linkPath} already exists`);
      } else {
        fs.mkdirSync(root, { recursive: true });
        fs.symlinkSync(targetDir, linkPath);
        console.log(`\n  Linked into workspaces root: ${linkPath} -> ${targetDir}`);
      }
    } else {
      console.log(`\n  Note: this directory is outside your workspaces root (${root}).`);
      console.log(`  It won't appear in ws list/tree unless you run:`);
      console.log(`    ws init --path ${targetDir} --link`);
      console.log(`  Or move/symlink it into ${root}/`);
    }
  }

  console.log(`\nWorkspace "${name}" initialized.`);
}
