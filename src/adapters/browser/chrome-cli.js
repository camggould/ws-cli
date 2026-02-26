import { run, isInstalled } from '../../exec.js';

export const chromeCli = {
  name: 'chrome-cli',
  description: 'macOS Chrome CLI tool (brew install chrome-cli)',

  setup: {
    check: () => isInstalled('chrome-cli'),
    install: { brew: 'chrome-cli' },
  },

  /**
   * List tabs, optionally scoped to a specific window ID.
   * If windowId is given, only tabs from that window are returned.
   * If not, returns ALL tabs across all windows (use with caution).
   */
  listTabs(windowId) {
    const args = ['list', 'tabs'];
    if (windowId) args.push('-w', String(windowId));

    const result = run('chrome-cli', args);
    if (!result.ok) return [];

    const tabs = [];
    const lines = result.stdout.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^\[(\d+):(\d+)\]\s+(.+)$/);
      if (!match) continue;
      const [, , tabId, title] = match;

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

  /**
   * Open tabs in a specific window (or a new one).
   * Returns { opened: number, windowId: string }.
   */
  openTabs(tabs, windowId) {
    let opened = 0;
    let targetWindowId = windowId;

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (i === 0 && !targetWindowId) {
        // First tab: open in a new window to get a dedicated window ID
        const result = run('chrome-cli', ['open', tab.url, '-n']);
        if (result.ok) {
          opened++;
          // Try to get the new window's ID
          targetWindowId = this._getMostRecentWindowId();
        }
      } else if (targetWindowId) {
        // Subsequent tabs: open in the tracked window
        const result = run('chrome-cli', ['open', tab.url, '-w', String(targetWindowId)]);
        if (result.ok) opened++;
      } else {
        const result = run('chrome-cli', ['open', tab.url]);
        if (result.ok) opened++;
      }
    }
    return { opened, windowId: targetWindowId };
  },

  openUrl(url) {
    return run('chrome-cli', ['open', url]);
  },

  /**
   * List all window IDs.
   */
  listWindows() {
    const result = run('chrome-cli', ['list', 'windows']);
    if (!result.ok) return [];
    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^\[(\d+)\]\s+(.+)$/);
        if (!match) return null;
        return { id: match[1], title: match[2].trim() };
      })
      .filter(Boolean);
  },

  /**
   * Get the most recently listed window ID (heuristic: last in list).
   */
  _getMostRecentWindowId() {
    const windows = this.listWindows();
    if (windows.length === 0) return null;
    return windows[windows.length - 1].id;
  },
};
