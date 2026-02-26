import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ws');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PRESETS_DIR_BUILTIN = path.join(import.meta.dirname, '..', 'presets');
const PRESETS_DIR_USER = path.join(CONFIG_DIR, 'presets');

const DEFAULT_CONFIG = {
  root: path.join(os.homedir(), 'Workspaces'),
  preset: 'macos-default',
  adapters: {
    browser: 'chrome-cli',
    tasks: 'beads',
    terminal: 'tmux',
    editor: 'cursor',
  },
  workspace_defaults: {
    status: 'active',
    tags: [],
  },
  auto_snapshot_minutes: 0, // 0 = disabled
};

export function getConfigDir() {
  return CONFIG_DIR;
}

export function loadConfig() {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const userConfig = JSON.parse(raw);
  return { ...DEFAULT_CONFIG, ...userConfig };
}

export function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

export function getConfigValue(config, keyPath) {
  const keys = keyPath.split('.');
  let val = config;
  for (const k of keys) {
    if (val == null || typeof val !== 'object') return undefined;
    val = val[k];
  }
  return val;
}

export function setConfigValue(config, keyPath, value) {
  const keys = keyPath.split('.');
  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (obj[keys[i]] == null || typeof obj[keys[i]] !== 'object') {
      obj[keys[i]] = {};
    }
    obj = obj[keys[i]];
  }
  // Try to parse as JSON for non-string values
  try {
    obj[keys[keys.length - 1]] = JSON.parse(value);
  } catch {
    obj[keys[keys.length - 1]] = value;
  }
  return config;
}

export function loadPreset(name) {
  // Check user presets first, then built-in
  const userPath = path.join(PRESETS_DIR_USER, `${name}.json`);
  const builtinPath = path.join(PRESETS_DIR_BUILTIN, `${name}.json`);

  const presetPath = fs.existsSync(userPath) ? userPath : builtinPath;
  if (!fs.existsSync(presetPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
}

export function listPresets() {
  const presets = [];
  for (const dir of [PRESETS_DIR_BUILTIN, PRESETS_DIR_USER]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.json')) {
        const preset = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        presets.push({
          name: path.basename(file, '.json'),
          description: preset.description || '',
          source: dir === PRESETS_DIR_BUILTIN ? 'built-in' : 'user',
        });
      }
    }
  }
  return presets;
}

export function applyPreset(config, presetName) {
  const preset = loadPreset(presetName);
  if (!preset) {
    throw new Error(`Preset "${presetName}" not found`);
  }
  config.preset = presetName;
  if (preset.adapters) {
    config.adapters = { ...config.adapters, ...preset.adapters };
  }
  if (preset.root) {
    config.root = preset.root;
  }
  return config;
}

export function resolveRoot(config) {
  return config.root.replace(/^~/, os.homedir());
}

function ensureConfigDir() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.mkdirSync(PRESETS_DIR_USER, { recursive: true });
}
