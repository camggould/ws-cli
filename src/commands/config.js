import {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  applyPreset,
  listPresets,
} from '../config.js';
import { listAdapters } from '../adapters/index.js';

export async function configCommand(action, key, value) {
  const config = loadConfig();

  if (!action || action === 'show') {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (action === 'get') {
    if (!key) {
      console.error('Usage: ws config get <key>');
      process.exit(1);
    }
    const val = getConfigValue(config, key);
    if (val === undefined) {
      console.error(`Key "${key}" not found.`);
      process.exit(1);
    }
    console.log(typeof val === 'object' ? JSON.stringify(val, null, 2) : val);
    return;
  }

  if (action === 'set') {
    if (!key || value === undefined) {
      console.error('Usage: ws config set <key> <value>');
      process.exit(1);
    }
    setConfigValue(config, key, value);
    saveConfig(config);
    console.log(`Set ${key} = ${value}`);
    return;
  }

  if (action === 'preset') {
    if (!key) {
      // List available presets
      const presets = listPresets();
      if (presets.length === 0) {
        console.log('No presets found.');
        return;
      }
      console.log('Available presets:\n');
      for (const p of presets) {
        const current = config.preset === p.name ? ' (active)' : '';
        console.log(`  ${p.name}${current} — ${p.description} [${p.source}]`);
      }
      return;
    }
    // Apply preset
    try {
      applyPreset(config, key);
      saveConfig(config);
      console.log(`Applied preset: ${key}`);
      console.log(JSON.stringify(config.adapters, null, 2));
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
    return;
  }

  if (action === 'adapters') {
    const adapters = listAdapters();
    for (const [category, list] of Object.entries(adapters)) {
      const current = config.adapters[category];
      console.log(`\n${category}:`);
      for (const a of list) {
        const marker = a.name === current ? ' (active)' : '';
        console.log(`  ${a.name}${marker} — ${a.description}`);
      }
    }
    return;
  }

  console.error(`Unknown action: ${action}. Use: show, get, set, preset, adapters`);
  process.exit(1);
}
