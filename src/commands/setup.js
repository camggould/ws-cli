import fs from 'fs';
import { loadConfig, resolveRoot } from '../config.js';
import { getAdapter, listAdapters } from '../adapters/index.js';
import { run, runLive, isInstalled } from '../exec.js';

export async function setupCommand(opts) {
  const config = loadConfig();
  const root = resolveRoot(config);

  console.log('ws setup — installing workspace system dependencies\n');

  // 1. Ensure workspaces root exists
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
    console.log(`  Created workspaces root: ${root}`);
  } else {
    console.log(`  Workspaces root exists: ${root}`);
  }

  // 2. Check each configured adapter
  const categories = ['browser', 'tasks', 'terminal', 'editor'];
  const missing = [];

  for (const category of categories) {
    const adapterName = config.adapters[category];
    if (!adapterName) {
      console.log(`  ${category}: (none configured)`);
      continue;
    }

    let adapter;
    try {
      adapter = getAdapter(category, adapterName);
    } catch (err) {
      console.log(`  ${category}: ⚠ ${err.message}`);
      continue;
    }

    const installed = adapter.setup?.check?.() ?? true;
    if (installed) {
      console.log(`  ${category}: ${adapterName} ✓`);
    } else {
      console.log(`  ${category}: ${adapterName} ✗ (not installed)`);
      missing.push({ category, name: adapterName, adapter });
    }
  }

  // 3. Check optional tools
  console.log('\n  Optional tools:');
  const optionalTools = [
    { cmd: 'fzf', brew: 'fzf', desc: 'Fuzzy finder for workspace selection' },
    { cmd: 'zoxide', brew: 'zoxide', desc: 'Smart directory jumping' },
    { cmd: 'jq', brew: 'jq', desc: 'JSON processing' },
  ];

  for (const tool of optionalTools) {
    if (isInstalled(tool.cmd)) {
      console.log(`  ${tool.cmd}: ✓ (${tool.desc})`);
    } else {
      console.log(`  ${tool.cmd}: ✗ (${tool.desc})`);
      missing.push({
        category: 'optional',
        name: tool.cmd,
        adapter: { setup: { install: { brew: tool.brew } } },
      });
    }
  }

  if (missing.length === 0) {
    console.log('\n  All dependencies installed!');
    return;
  }

  if (opts.dryRun) {
    console.log('\n  Dry run — would install:');
    for (const m of missing) {
      const install = m.adapter.setup?.install || {};
      if (install.brew) {
        console.log(`    brew install ${install.brew}`);
      } else if (install.pip) {
        console.log(`    pip install ${install.pip}`);
      } else if (install.npm) {
        console.log(`    npm install -g ${install.npm}`);
      } else if (install.manual) {
        console.log(`    Manual: ${install.manual}`);
      } else if (install.installNote) {
        console.log(`    ${install.installNote}`);
      }
    }
    return;
  }

  // 4. Install missing tools via brew where possible
  const brewInstalls = missing.filter((m) => m.adapter.setup?.install?.brew);
  const otherInstalls = missing.filter((m) => !m.adapter.setup?.install?.brew);

  if (brewInstalls.length > 0 && isInstalled('brew')) {
    const packages = brewInstalls.map((m) => m.adapter.setup.install.brew);
    console.log(`\n  Installing via brew: ${packages.join(', ')}`);
    runLive('brew', ['install', ...packages]);
  } else if (brewInstalls.length > 0) {
    console.log('\n  Homebrew not found. Install manually:');
    for (const m of brewInstalls) {
      console.log(`    brew install ${m.adapter.setup.install.brew}`);
    }
  }

  for (const m of otherInstalls) {
    const install = m.adapter.setup?.install || {};
    if (install.pip && isInstalled('pip')) {
      console.log(`\n  Installing via pip: ${install.pip}`);
      runLive('pip', ['install', install.pip]);
    } else if (install.npm && isInstalled('npm')) {
      console.log(`\n  Installing via npm: ${install.npm}`);
      runLive('npm', ['install', '-g', install.npm]);
    } else if (install.manual) {
      console.log(`\n  ${m.name}: ${install.manual}`);
    } else if (m.adapter.setup?.installNote) {
      console.log(`\n  ${m.name}: ${m.adapter.setup.installNote}`);
    }
  }

  console.log('\n  Setup complete. Run `ws setup` again to verify.');
}
