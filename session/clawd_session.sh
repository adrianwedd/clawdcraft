#!/usr/bin/env bash
# Launches the interactive Claude Code session that powers Clawd.
# Started automatically inside tmux by bridge/clawd.js (session name: clawd).
# Watch or steer it live:  tmux attach -t clawd   (detach: Ctrl-b d)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CLAUDE_BIN=$(node -e "console.log(require('$ROOT/bridge/config').claudeBin)")
MODEL=$(node -e "console.log(require('$ROOT/bridge/config').model)")

# Echo Clawd's rcon.js commands to online ops as a quiet gray line (selective
# replacement for broadcast-rcon-to-ops, which would also spam movement ticks).
# Only exported here, so human terminals and maintenance sessions don't echo.
export CLAWD_RCON_ECHO=1

exec "$CLAUDE_BIN" \
  --model "$MODEL" \
  --allowedTools \
    "Bash(node bridge/rcon.js:*)" \
    "Bash(node bridge/say.js:*)" \
    "Bash(node bridge/gift.js:*)" \
    "Bash(node bridge/memory.js:*)" \
  --append-system-prompt "$(cat "$ROOT/session/clawd_prompt.md")"
