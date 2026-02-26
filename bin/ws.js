#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommand } from '../src/commands/setup.js';
import { createCommand } from '../src/commands/create.js';
import { openCommand } from '../src/commands/open.js';
import { closeCommand } from '../src/commands/close.js';
import { listCommand } from '../src/commands/list.js';
import { treeCommand } from '../src/commands/tree.js';
import { configCommand } from '../src/commands/config.js';
import { initCommand } from '../src/commands/init.js';
import { archiveCommand } from '../src/commands/archive.js';

const program = new Command();

program
  .name('ws')
  .description('Portable workspace manager')
  .version('0.1.0');

program
  .command('setup')
  .description('Install workspace system dependencies')
  .option('--dry-run', 'Show what would be installed without installing')
  .action(setupCommand);

program
  .command('create <name>')
  .description('Create a new workspace')
  .option('-p, --parent <workspace>', 'Create as sub-workspace of an existing workspace')
  .option('-t, --tags <tags>', 'Comma-separated tags', (v) => v.split(','))
  .option('--no-tasks', 'Skip task tracker initialization')
  .option('--no-terminal', 'Skip terminal session creation')
  .option('--template <name>', 'Use a workspace template (default, startup, research)')
  .action(createCommand);

program
  .command('init')
  .description('Convert an existing directory into a workspace')
  .option('--path <dir>', 'Directory to initialize (defaults to current directory)')
  .option('-n, --name <name>', 'Workspace name (defaults to directory name)')
  .option('-t, --tags <tags>', 'Comma-separated tags', (v) => v.split(','))
  .option('--link', 'Symlink into workspaces root if directory is outside it')
  .option('--no-tasks', 'Skip task tracker initialization')
  .option('--no-terminal', 'Skip terminal session creation')
  .action(initCommand);

program
  .command('open <name>')
  .description('Open a workspace (restore terminal, browser tabs, editor)')
  .option('--no-browser', 'Skip browser tab restoration')
  .option('--no-terminal', 'Skip terminal session')
  .option('--no-editor', 'Skip editor launch')
  .action(openCommand);

program
  .command('close [name]')
  .description('Close a workspace (save browser tabs, update metadata)')
  .option('--no-browser', 'Skip browser tab capture')
  .action(closeCommand);

program
  .command('list')
  .description('List all workspaces')
  .option('-s, --status <status>', 'Filter by status (active, paused, archived, abandoned)')
  .option('--stale <days>', 'Show workspaces not opened in N days', parseInt)
  .option('--json', 'Output as JSON')
  .action(listCommand);

program
  .command('tree')
  .description('Show workspace hierarchy')
  .option('--json', 'Output as JSON')
  .action(treeCommand);

program
  .command('config')
  .description('View or modify configuration')
  .argument('[action]', 'get, set, preset, or show')
  .argument('[key]', 'Config key (e.g., adapters.browser)')
  .argument('[value]', 'Value to set')
  .action(configCommand);

program
  .command('archive <name>')
  .description('Archive a workspace')
  .action(archiveCommand);

program.parse();
