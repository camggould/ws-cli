import { loadConfig } from '../config.js';
import { findAllWorkspaces } from '../workspace.js';

export async function listCommand(opts) {
  const config = loadConfig();
  let workspaces = findAllWorkspaces(config);

  // Filter by status
  if (opts.status) {
    workspaces = workspaces.filter((ws) => ws.meta?.status === opts.status);
  }

  // Filter by staleness
  if (opts.stale) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - opts.stale);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    workspaces = workspaces.filter((ws) => {
      const lastOpened = ws.meta?.last_opened || ws.meta?.created;
      return lastOpened && lastOpened < cutoffStr;
    });
  }

  if (opts.json) {
    console.log(JSON.stringify(workspaces, null, 2));
    return;
  }

  if (workspaces.length === 0) {
    console.log('No workspaces found.');
    return;
  }

  // Table output
  const nameWidth = Math.max(20, ...workspaces.map((w) => w.name.length)) + 2;
  const header = 'NAME'.padEnd(nameWidth) + 'STATUS'.padEnd(12) + 'LAST OPENED'.padEnd(14) + 'TAGS';
  console.log(header);
  console.log('-'.repeat(header.length + 10));

  for (const ws of workspaces) {
    const name = ws.name.padEnd(nameWidth);
    const status = (ws.meta?.status || 'unknown').padEnd(12);
    const lastOpened = (ws.meta?.last_opened || '-').padEnd(14);
    const tags = (ws.meta?.tags || []).join(', ');
    console.log(`${name}${status}${lastOpened}${tags}`);
  }

  console.log(`\n${workspaces.length} workspace(s)`);
}
