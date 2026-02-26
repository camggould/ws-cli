import { run, isInstalled } from '../../exec.js';

export const taskwarrior = {
  name: 'taskwarrior',
  description: 'Taskwarrior CLI task manager',

  setup: {
    check: () => isInstalled('task'),
    install: { brew: 'task' },
  },

  isInitialized() {
    // Taskwarrior uses a global database, always "initialized"
    return true;
  },

  init() {
    return { ok: true, already: true };
  },

  listIssues(wsPath) {
    // Filter by project matching workspace name
    const projectName = wsPath.split('/').pop();
    const result = run('task', ['project:' + projectName, 'list']);
    if (!result.ok) return [];
    return result.stdout;
  },

  getSummary(wsPath) {
    const projectName = wsPath.split('/').pop();
    const result = run('task', ['project:' + projectName, 'count']);
    if (!result.ok) return null;
    return `${result.stdout.trim()} tasks`;
  },
};
