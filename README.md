# ws-cli

A portable, composable workspace manager for developers who multitask.

`ws` gives you isolated, resumable workspaces that bundle your terminal sessions, browser tabs, task tracking, and project files into a single unit. Walk away from a project for weeks — `ws open` brings everything back exactly where you left off.

## The Problem

You're working on three projects at once. Each has its own code, terminal sessions, browser tabs, and mental context. You switch to something urgent, and two weeks later you come back to find:

- 40 orphaned browser tabs with no idea which belong to what
- Terminal sessions long dead
- No record of where you left off

`ws` solves this by giving each project a structured workspace with saved state that can be suspended and resumed.

## Quick Start

```bash
git clone https://github.com/camggould/ws-cli.git
cd ws-cli
./setup.sh
```

The setup script installs npm dependencies, links the `ws` command globally, and checks for tool dependencies (installing them via Homebrew where possible).

### Manual Installation

```bash
git clone https://github.com/camggould/ws-cli.git
cd ws-cli
npm install
npm link        # makes `ws` available globally
ws setup        # checks and installs tool dependencies
```

Requires Node.js >= 18.

## Usage

### Create a workspace

```bash
ws create my-project
```

This:
1. Creates `~/Workspaces/my-project/`
2. Writes `.workspace.yaml` (machine-readable metadata) and `workspace.md` (human-readable notes)
3. Initializes an empty `tabs.json` for browser state
4. Runs `bd init` to set up [Beads](https://github.com/steveyegge/beads) issue tracking
5. Creates a tmux session named `my-project`
6. Runs `git init`

Options:

```bash
ws create my-project --tags coding,oss       # add tags
ws create feature --parent my-project        # create a sub-workspace
ws create research --no-tasks --no-terminal  # skip beads and tmux
```

### Initialize an existing directory as a workspace

```bash
cd ~/my-existing-project
ws init
```

This adds workspace metadata (`.workspace.yaml`, `workspace.md`, `tabs.json`) and initializes beads and a tmux session — without touching any existing files.

Options:

```bash
ws init --path ~/some/project          # target a specific directory
ws init --name my-project              # override the workspace name (defaults to directory name)
ws init --tags coding,oss              # add tags
ws init --link                         # symlink into ~/Workspaces/ if outside it
ws init --no-tasks --no-terminal       # skip beads and tmux
```

If the directory is outside your workspaces root, `ws init` tells you. Pass `--link` to create a symlink so it appears in `ws list` and `ws tree` without moving the directory.

### Open a workspace

```bash
ws open my-project
```

This:
1. Updates `last_opened` and sets status to `active`
2. Creates or attaches to the tmux session
3. Opens last session's browser tabs in a **dedicated Chrome window** and tracks its window ID
4. Opens the workspace directory in your editor

Options:

```bash
ws open my-project --no-browser   # skip tab restoration
ws open my-project --no-editor    # skip editor launch
ws open my-project --no-terminal  # skip tmux
```

### Close a workspace

```bash
ws close my-project
```

This:
1. Captures browser tabs **only from the workspace's tracked window** to `tabs.json`
2. Appends the same tabs to `tabs-history.jsonl` (timestamped, never overwritten)
3. Clears the active session (`.session.json`)
4. Sets workspace status to `paused`

If you're inside a workspace directory, the name is inferred:

```bash
cd ~/Workspaces/my-project
ws close
```

### List workspaces

```bash
ws list
```

```
NAME                  STATUS      LAST OPENED   TAGS
------------------------------------------------------------
my-project            active      2026-02-25    coding, oss
my-project/feature    paused      2026-02-20
startup-idea          active      2026-02-24    business

3 workspace(s)
```

Filter:

```bash
ws list --status paused          # only paused workspaces
ws list --stale 14               # not opened in 14+ days
ws list --json                   # machine-readable output
```

### Show workspace tree

```bash
ws tree
```

```
Workspaces (~/Workspaces)

├── ● my-project [coding, oss]
│   └── ◐ feature (5d)
└── ● startup-idea [business]
```

Status icons:
- `●` active
- `◐` paused
- `○` archived
- `✗` abandoned

Numbers in parentheses indicate days since last opened (shown at 7+ days, labeled "stale" at 30+).

### Archive a workspace

```bash
ws archive my-project
```

This kills any associated terminal session, sets status to `archived`, and moves the workspace to `~/Workspaces/.archive/`.

## Configuration

Configuration lives at `~/.config/ws/config.json`. It's created automatically on first run with sensible defaults.

### View current config

```bash
ws config show
```

```json
{
  "root": "~/Workspaces",
  "preset": "macos-default",
  "adapters": {
    "browser": "chrome-cli",
    "tasks": "beads",
    "terminal": "tmux",
    "editor": "cursor"
  },
  "workspace_defaults": {
    "status": "active",
    "tags": []
  },
  "auto_snapshot_minutes": 0
}
```

### Get/set individual values

```bash
ws config get adapters.browser    # → chrome-cli
ws config set adapters.editor vscode
ws config set root ~/Projects
```

### View available adapters

```bash
ws config adapters
```

```
browser:
  chrome-cli (active) — macOS Chrome CLI tool (brew install chrome-cli)
  brotab — Cross-platform browser tab manager (pip install brotab)

tasks:
  beads (active) — Git-backed issue tracker for AI coding agents
  taskwarrior — Taskwarrior CLI task manager

terminal:
  tmux (active) — Terminal multiplexer
  zellij — Zellij terminal workspace

editor:
  cursor (active) — Cursor editor
  vscode — Visual Studio Code
```

## Presets

Presets let you swap your entire tool stack in one command. Useful for switching between machines or sharing configurations.

### List presets

```bash
ws config preset
```

```
Available presets:

  linux-default — Linux setup — brotab + VS Code + tmux + Beads [built-in]
  macos-default (active) — Default macOS setup — Chrome + Cursor + tmux + Beads [built-in]
  macos-vscode — macOS with VS Code instead of Cursor [built-in]
  minimal — Minimal setup — terminal and editor only, no browser or task tracking [built-in]
```

### Apply a preset

```bash
ws config preset linux-default
```

### Create your own preset

Drop a JSON file in `~/.config/ws/presets/`:

```json
{
  "description": "My custom setup",
  "adapters": {
    "browser": "brotab",
    "tasks": "beads",
    "terminal": "zellij",
    "editor": "cursor"
  }
}
```

```bash
# Save as ~/.config/ws/presets/my-setup.json, then:
ws config preset my-setup
```

User presets take priority over built-in presets of the same name.

## Adapter System

Every external tool dependency is abstracted behind an adapter interface. Each adapter category (browser, tasks, terminal, editor) has a standard set of operations, and multiple implementations can be swapped in without changing how `ws` commands work.

### Built-in Adapters

| Category | Adapter | Tool | Install |
|---|---|---|---|
| **browser** | `chrome-cli` | [chrome-cli](https://github.com/prasmussen/chrome-cli) | `brew install chrome-cli` |
| **browser** | `brotab` | [brotab](https://github.com/balta2ar/brotab) | `pip install brotab` |
| **tasks** | `beads` | [Beads](https://github.com/steveyegge/beads) | See beads repo |
| **tasks** | `taskwarrior` | [Taskwarrior](https://taskwarrior.org/) | `brew install task` |
| **terminal** | `tmux` | [tmux](https://github.com/tmux/tmux) | `brew install tmux` |
| **terminal** | `zellij` | [zellij](https://github.com/zellij-org/zellij) | `brew install zellij` |
| **editor** | `cursor` | [Cursor](https://cursor.sh/) | Download from cursor.sh |
| **editor** | `vscode` | [VS Code](https://code.visualstudio.com/) | `brew install --cask visual-studio-code` |

### Switching adapters

```bash
# Switch browser tool
ws config set adapters.browser brotab

# Switch everything at once via preset
ws config preset linux-default
```

### Adding a new adapter

Adapters live in `src/adapters/<category>/<name>.js`. Each exports an object conforming to the category's interface:

**Browser adapter interface:**
```js
export const myBrowser = {
  name: 'my-browser',
  description: 'Description shown in ws config adapters',
  setup: {
    check: () => boolean,         // is the tool installed?
    install: { brew: 'pkg' },     // install instructions
  },
  listTabs(windowId) { ... },     // → [{ title, url }]; windowId scopes capture
  openTabs(tabs, windowId) { },   // → { opened: number, windowId: string|null }
  openUrl(url) { ... },           // open a single URL
};
```

**Tasks adapter interface:**
```js
export const myTasks = {
  name: 'my-tasks',
  description: '...',
  setup: { check, install },
  isInitialized(wsPath) { ... },  // → boolean
  init(wsPath) { ... },           // initialize in workspace dir
  listIssues(wsPath) { ... },     // → string output
  getSummary(wsPath) { ... },     // → short summary string
};
```

**Terminal adapter interface:**
```js
export const myTerminal = {
  name: 'my-terminal',
  description: '...',
  setup: { check, install },
  sessionExists(name) { ... },    // → boolean
  createSession(name, wsPath) {}, // create named session at path
  attachSession(name) { ... },    // attach/switch to session
  killSession(name) { ... },      // destroy session
  listSessions() { ... },         // → [{ name, windows, attached }]
};
```

**Editor adapter interface:**
```js
export const myEditor = {
  name: 'my-editor',
  description: '...',
  setup: { check, install },
  open(wsPath) { ... },           // open workspace directory in editor
};
```

After creating the adapter file, register it in `src/adapters/index.js`.

## Workspace Structure

Every workspace is a directory under your workspaces root (default `~/Workspaces/`) containing:

```
my-project/
├── .workspace.yaml     ← machine-readable metadata (git-tracked)
├── workspace.md        ← human-readable notes, Obsidian-compatible (git-tracked)
├── tabs.json           ← last session's browser tabs (git-tracked)
├── tabs-history.jsonl  ← append-only log of all tab sessions (git-tracked)
├── .session.json       ← ephemeral runtime state, present only while workspace is open
├── .beads/             ← beads issue tracker data (if using beads)
├── .git/               ← git repository
└── ...                 ← your project files
```

### .workspace.yaml

```yaml
name: my-project
status: active
created: '2026-02-25'
last_opened: '2026-02-25'
tags:
  - coding
  - oss
parent: null
```

Status values: `active`, `paused`, `archived`, `abandoned`

### workspace.md

A markdown file with YAML frontmatter (mirrors `.workspace.yaml`) and freeform sections for notes, purpose, and links. Opens natively in Obsidian if you point a vault at your workspaces root.

### tabs.json (last session)

```json
[
  { "title": "GitHub - my-project", "url": "https://github.com/..." },
  { "title": "Stack Overflow - ...", "url": "https://stackoverflow.com/..." }
]
```

This is a **snapshot** of the most recent session's tabs. It is overwritten on every `ws close` and is the only file read by `ws open`. This means opening a workspace always restores exactly where you left off — not an accumulation of every tab you've ever had.

### tabs-history.jsonl (complete history)

```jsonl
{"timestamp":"2026-02-20T14:30:00Z","tabs":[{"title":"...","url":"..."},{"title":"...","url":"..."}]}
{"timestamp":"2026-02-25T09:15:00Z","tabs":[{"title":"...","url":"..."}]}
```

Every `ws close` appends one line. This file is append-only and never read by `ws open`. It serves as a browsing history scoped to the workspace — useful for:
- Reconstructing what you were researching weeks ago
- MCP server queries ("what sites did I visit for this project?")
- Finding a URL you had open three sessions ago but closed

### .session.json (runtime state)

```json
{
  "opened_at": "2026-02-25T09:00:00Z",
  "browser_window_id": "742"
}
```

Created by `ws open`, deleted by `ws close`. Tracks ephemeral state like which Chrome window belongs to this workspace. Not committed to git.

## Browser Isolation

A key design challenge: if you have multiple workspaces open simultaneously, how does `ws close` know which Chrome tabs belong to which workspace?

### How it works

1. **`ws open`** restores tabs in a **new, dedicated Chrome window** and records its window ID in `.session.json`
2. **`ws close`** reads the tracked window ID and captures tabs **only from that window**
3. If no window ID is tracked (e.g., the workspace was created before this feature, or the browser adapter doesn't support window tracking), `ws close` warns you and falls back to capturing all tabs

### Limitations

- If you manually drag tabs between Chrome windows, they can end up in the wrong workspace's capture. This is a Chrome UX issue, not something `ws-cli` can prevent without a browser extension.
- Tabs you close during a session (before `ws close`) are not captured. They simply disappear, as they would normally. The `tabs-history.jsonl` only records what was open at the moment of `ws close`.
- The `brotab` adapter does not support window-scoped capture — it always captures all tabs.

### Future options

For stronger isolation, the roadmap includes Chrome profile support (each workspace gets its own Chrome profile with fully separate history, cookies, and extensions). This is the nuclear option — true isolation with no possible cross-contamination.

## Sub-Workspaces

Workspaces can be nested to form a tree. Create a sub-workspace with `--parent`:

```bash
ws create my-project
ws create frontend --parent my-project
ws create api --parent my-project
```

This produces:

```
~/Workspaces/
└── my-project/
    ├── .workspace.yaml
    ├── frontend/
    │   └── .workspace.yaml
    └── api/
        └── .workspace.yaml
```

Reference sub-workspaces with path notation:

```bash
ws open my-project/frontend
ws close my-project/api
```

The `ws tree` command renders the full hierarchy. This is useful for organizing related efforts — a startup workspace might contain sub-workspaces for MVP, research, marketing, etc.

## Portability

### Moving to a new machine

```bash
# 1. Clone the tool
git clone https://github.com/camggould/ws-cli.git
cd ws-cli
./setup.sh

# 2. Apply your preset (if you have a custom one)
ws config preset my-setup

# 3. Copy or sync your workspaces root
# (via git, rsync, Dropbox, etc.)
```

### What's portable

| Component | Portable via |
|---|---|
| `ws` tool itself | Git clone + `./setup.sh` |
| Config + presets | `~/.config/ws/` (copy or dotfiles repo) |
| Workspace metadata | `.workspace.yaml`, `workspace.md`, `tabs.json`, `tabs-history.jsonl` — all plain text, all git-friendly |
| Task data | `.beads/` issues are JSONL, designed for git |
| Browser tabs | `tabs.json` (last session) + `tabs-history.jsonl` (full history) — just URLs, works with any browser adapter |

### What's not portable (and doesn't need to be)

- `.session.json` (ephemeral runtime state — which Chrome window is tracked, etc.)
- tmux sessions (ephemeral, recreated on `ws open`)
- Editor state (editors handle their own persistence)
- Installed tools (reinstalled via `ws setup`)

## Project Structure

```
ws-cli/
├── bin/
│   └── ws.js                    # CLI entry point
├── src/
│   ├── config.js                # Config loading, presets, defaults
│   ├── workspace.js             # Workspace CRUD, tree traversal
│   ├── exec.js                  # Safe command execution utilities
│   ├── adapters/
│   │   ├── index.js             # Adapter registry
│   │   ├── browser/
│   │   │   ├── chrome-cli.js
│   │   │   └── brotab.js
│   │   ├── tasks/
│   │   │   ├── beads.js
│   │   │   └── taskwarrior.js
│   │   ├── terminal/
│   │   │   ├── tmux.js
│   │   │   └── zellij.js
│   │   └── editor/
│   │       ├── cursor.js
│   │       └── vscode.js
│   └── commands/
│       ├── setup.js             # ws setup
│       ├── create.js            # ws create
│       ├── init.js              # ws init
│       ├── open.js              # ws open
│       ├── close.js             # ws close
│       ├── list.js              # ws list
│       ├── tree.js              # ws tree
│       ├── config.js            # ws config
│       └── archive.js           # ws archive
├── presets/
│   ├── macos-default.json
│   ├── macos-vscode.json
│   ├── linux-default.json
│   └── minimal.json
├── setup.sh                     # Bootstrap script for fresh machines
├── package.json
└── .gitignore
```

## Roadmap

- [ ] **MCP server** — Expose workspace tree to LLMs via Model Context Protocol. Ask an AI to summarize project states, find abandoned work, suggest next steps.
- [ ] **`ws search`** — Full-text search across workspace metadata and beads issues.
- [ ] **fzf integration** — Fuzzy workspace picker for `ws open` when you don't remember the exact name.
- [ ] **Auto-snapshot** — Periodic browser tab capture via launchd/cron so you never lose tabs even without `ws close`.
- [ ] **Chrome profile isolation** — Per-workspace Chrome profiles for true browser state separation.
- [ ] **`ws status`** — Detailed view of a single workspace (git status, open issues, saved tabs, last activity).

## License

MIT
