import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { resolveRoot } from './config.js';

const WS_MARKER = '.workspace.yaml';
const WS_DOC = 'workspace.md';
const TABS_FILE = 'tabs.json';

export function getWorkspacePath(config, name) {
  const root = resolveRoot(config);
  // Support dotted paths for sub-workspaces: "project.subproject"
  const parts = name.split('.');
  return path.join(root, ...parts);
}

export function workspaceExists(config, name) {
  const wsPath = getWorkspacePath(config, name);
  return fs.existsSync(path.join(wsPath, WS_MARKER));
}

export function createWorkspace(config, name, opts = {}) {
  const wsPath = getWorkspacePath(config, name);
  if (fs.existsSync(path.join(wsPath, WS_MARKER))) {
    throw new Error(`Workspace "${name}" already exists at ${wsPath}`);
  }

  fs.mkdirSync(wsPath, { recursive: true });

  const now = new Date().toISOString().split('T')[0];
  const meta = {
    name: name.split('.').pop(), // leaf name
    status: opts.status || config.workspace_defaults?.status || 'active',
    created: now,
    last_opened: now,
    tags: opts.tags || config.workspace_defaults?.tags || [],
    parent: opts.parent || null,
  };

  // Write .workspace.yaml
  fs.writeFileSync(
    path.join(wsPath, WS_MARKER),
    yaml.dump(meta, { lineWidth: -1 })
  );

  // Write workspace.md
  const mdContent = `---
${yaml.dump(meta, { lineWidth: -1 }).trim()}
---

# ${meta.name}

## Purpose


## Notes


## Links

`;
  fs.writeFileSync(path.join(wsPath, WS_DOC), mdContent);

  // Initialize empty tabs file
  fs.writeFileSync(path.join(wsPath, TABS_FILE), '[]\n');

  return { path: wsPath, meta };
}

export function readWorkspaceMeta(wsPath) {
  const markerPath = path.join(wsPath, WS_MARKER);
  if (!fs.existsSync(markerPath)) return null;
  const raw = fs.readFileSync(markerPath, 'utf-8');
  return yaml.load(raw);
}

export function updateWorkspaceMeta(wsPath, updates) {
  const meta = readWorkspaceMeta(wsPath);
  if (!meta) throw new Error(`No workspace found at ${wsPath}`);
  const updated = { ...meta, ...updates };
  fs.writeFileSync(
    path.join(wsPath, WS_MARKER),
    yaml.dump(updated, { lineWidth: -1 })
  );
  return updated;
}

export function findAllWorkspaces(config) {
  const root = resolveRoot(config);
  const workspaces = [];
  if (!fs.existsSync(root)) return workspaces;
  walkForWorkspaces(root, root, workspaces);
  return workspaces;
}

function walkForWorkspaces(dir, root, results) {
  const markerPath = path.join(dir, WS_MARKER);
  if (fs.existsSync(markerPath)) {
    const meta = readWorkspaceMeta(dir);
    const relPath = path.relative(root, dir);
    results.push({
      name: relPath || meta?.name || path.basename(dir),
      path: dir,
      meta,
    });
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') && entry.name !== '.ws') continue;
    if (entry.name === 'node_modules') continue;
    walkForWorkspaces(path.join(dir, entry.name), root, results);
  }
}

export function buildWorkspaceTree(config) {
  const workspaces = findAllWorkspaces(config);
  const root = { name: 'root', children: [], workspaces: [] };

  for (const ws of workspaces) {
    const parts = ws.name.split(path.sep);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, children: [], workspaces: [] };
        node.children.push(child);
      }
      if (i === parts.length - 1) {
        child.meta = ws.meta;
        child.path = ws.path;
      }
      node = child;
    }
  }

  return root;
}

export function readTabs(wsPath) {
  const tabsPath = path.join(wsPath, TABS_FILE);
  if (!fs.existsSync(tabsPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(tabsPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function writeTabs(wsPath, tabs) {
  fs.writeFileSync(
    path.join(wsPath, TABS_FILE),
    JSON.stringify(tabs, null, 2) + '\n'
  );
}
