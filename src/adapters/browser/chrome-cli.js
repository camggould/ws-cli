import { run, isInstalled } from '../../exec.js';

export const chromeCli = {
  name: 'chrome-cli',
  description: 'macOS Chrome CLI tool (brew install chrome-cli)',

  setup: {
    check: () => isInstalled('chrome-cli'),
    install: { brew: 'chrome-cli' },
  },

  listTabs() {
    // chrome-cli list tabs outputs lines like:
    // [<window_id>:<tab_id>] title
    // With the url on the info command
    const result = run('chrome-cli', ['list', 'tabs']);
    if (!result.ok) return [];

    const tabs = [];
    const lines = result.stdout.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^\[(\d+):(\d+)\]\s+(.+)$/);
      if (!match) continue;
      const [, , tabId, title] = match;

      // Get URL for each tab
      const info = run('chrome-cli', ['info', '-t', tabId]);
      if (info.ok) {
        const urlMatch = info.stdout.match(/^Url:\s+(.+)$/m);
        if (urlMatch) {
          tabs.push({ title: title.trim(), url: urlMatch[1].trim() });
        }
      }
    }
    return tabs;
  },

  openTabs(tabs) {
    let opened = 0;
    for (const tab of tabs) {
      const result = run('chrome-cli', ['open', tab.url]);
      if (result.ok) opened++;
    }
    return opened;
  },

  openUrl(url) {
    return run('chrome-cli', ['open', url]);
  },
};
