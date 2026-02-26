import { run, isInstalled } from '../../exec.js';

export const brotab = {
  name: 'brotab',
  description: 'Cross-platform browser tab manager (pip install brotab)',

  setup: {
    check: () => isInstalled('bt'),
    install: { pip: 'brotab' },
  },

  listTabs() {
    // bt list outputs: tab_id<TAB>title<TAB>url
    const result = run('bt', ['list']);
    if (!result.ok) return [];

    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('\t');
        return {
          title: parts[1] || '',
          url: parts[2] || '',
        };
      })
      .filter((t) => t.url);
  },

  openTabs(tabs) {
    let opened = 0;
    for (const tab of tabs) {
      const result = run('bt', ['open', tab.url]);
      if (result.ok) opened++;
    }
    return opened;
  },

  openUrl(url) {
    return run('bt', ['open', url]);
  },
};
