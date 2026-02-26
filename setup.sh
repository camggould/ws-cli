#!/usr/bin/env bash
set -euo pipefail

# ws-cli bootstrap script
# Run this on a fresh machine to set up the workspace system.
#
# Usage:
#   curl -sL <raw-github-url>/setup.sh | bash
#   — or —
#   git clone <repo-url> && cd ws-cli && ./setup.sh

echo "ws-cli — workspace system bootstrap"
echo ""

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo "Node.js is required (>=18). Install via:"
  echo "  brew install node"
  echo "  — or —"
  echo "  curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js >= 18 required. You have $(node -v)."
  exit 1
fi

# 2. Install npm dependencies
echo "Installing npm dependencies..."
npm install

# 3. Link the CLI globally
echo "Linking ws command globally..."
npm link

# 4. Run ws setup to install tool dependencies
echo ""
echo "Running ws setup..."
ws setup

echo ""
echo "Done! Try: ws create my-first-workspace"
