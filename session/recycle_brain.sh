#!/usr/bin/env bash
# recycle_brain.sh — nightly maintenance for Clawd's brain. Run from cron as
# pi (installed: 30 4 * * *). Only acts when the server is EMPTY: recycling
# kills the brain's tmux session, and the bridge lazily respawns it from
# clawd_session.sh on the next "clawd ..." chat. That respawn is when three
# things land: a freshly auto-updated CLI (a running session keeps its
# launch-time version forever), a hard context reset (durable knowledge
# lives in bridge/memory.js JSON, not context), and any launcher-flag
# changes. Uses paths that survive cron's minimal environment.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
NODE=/usr/bin/node   # same interpreter clawd.service uses; nvm isn't on cron's PATH
CLAUDE_BIN=$("$NODE" -e "console.log(require('$ROOT/bridge/config').claudeBin)")

players=$("$NODE" bridge/rcon.js "list" 2>/dev/null | sed 's/§.//g' | grep -o 'are [0-9]\+' | grep -o '[0-9]\+' || true)
if [ "$players" != "0" ]; then
  echo "$(date -Is) recycle skipped: ${players:-unknown} player(s) online (or RCON unreachable)"
  exit 0
fi

"$CLAUDE_BIN" update 2>&1 | tail -1 || true
if tmux kill-session -t clawd 2>/dev/null; then
  echo "$(date -Is) brain recycled — respawns fresh on next chat"
else
  echo "$(date -Is) no brain session to recycle"
fi
