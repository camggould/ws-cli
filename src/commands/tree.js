import { loadConfig } from '../config.js';
import { buildWorkspaceTree, findAllWorkspaces } from '../workspace.js';

export async function treeCommand(opts) {
  const config = loadConfig();

  if (opts.json) {
    const workspaces = findAllWorkspaces(config);
    console.log(JSON.stringify(workspaces, null, 2));
    return;
  }

  const tree = buildWorkspaceTree(config);

  if (tree.children.length === 0) {
    console.log('No workspaces found.');
    return;
  }

  console.log(`Workspaces (${config.root})\n`);
  for (let i = 0; i < tree.children.length; i++) {
    const isLast = i === tree.children.length - 1;
    printNode(tree.children[i], '', isLast);
  }
}

function printNode(node, prefix, isLast) {
  const connector = isLast ? '└── ' : '├── ';
  const statusIcon = getStatusIcon(node.meta?.status);
  const tags = node.meta?.tags?.length ? ` [${node.meta.tags.join(', ')}]` : '';
  const stale = getStaleIndicator(node.meta?.last_opened);

  console.log(`${prefix}${connector}${statusIcon} ${node.name}${tags}${stale}`);

  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  for (let i = 0; i < node.children.length; i++) {
    const childIsLast = i === node.children.length - 1;
    printNode(node.children[i], childPrefix, childIsLast);
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'active':
      return '●';
    case 'paused':
      return '◐';
    case 'archived':
      return '○';
    case 'abandoned':
      return '✗';
    default:
      return '?';
  }
}

function getStaleIndicator(lastOpened) {
  if (!lastOpened) return '';
  const days = Math.floor(
    (Date.now() - new Date(lastOpened).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days > 30) return ` (${days}d stale)`;
  if (days > 7) return ` (${days}d)`;
  return '';
}
