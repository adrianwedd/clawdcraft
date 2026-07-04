---
name: mc-smoke-test
description: Verify the ClawdCraft bridge is healthy — offline checks first, then read-only live probes, then (only with explicit user OK) a live --test injection. Use after editing bridge/, and before/after `sudo systemctl restart clawd`.
---

# ClawdCraft smoke test

Run these IN ORDER. Each tier is safe to run without asking; tier 4 is not.
Repo root: `/home/pi/clawdcraft`. STRATEGY.md's escalation rules apply.

## Tier 1 — offline (always safe, always run)

```bash
node --check bridge/<each changed file>.js   # expect silence
cd bridge && npm test                        # guard denylist walk + gift refusals; expect "ok — N cases"
node bridge/clawd.js --dry "TestPlayer: clawd hello"   # parse/classify only; expect "trigger (player) — fast path"
```

`--dry` is the zero-side-effect check. **`--test` is NOT** — it summons the
avatar, speaks in real game chat, and spends tokens. Never confuse them.

## Tier 2 — service health (read-only)

```bash
systemctl status clawd --no-pager      # expect: active (running), no restart churn
journalctl -u clawd -n 50 --no-pager   # expect: start line, no "RCON error" loops, no stack traces
tmux capture-pane -t clawd -p | tail -20   # expect a Claude Code prompt (the brain is up). Do NOT type into it.
```

## Tier 3 — live read-only probes (RCON, no world changes)

```bash
node bridge/rcon.js "list"   # expect player-count line; proves RCON path + password
node bridge/rcon.js "execute if entity @e[type=minecraft:allay,tag=clawd]"
node bridge/rcon.js "execute if entity @e[type=minecraft:item_display,tag=clawd_skin]"
```

- Avatar probes: expect "Test passed". If a count > 1 appears, there are
  duplicates — the bridge's maintenance culls them, or use the fix-commands in
  `session/clawd_prompt.md` (they pass the rcon guard).
- Guard canary: `node bridge/rcon.js "whitelist list"` must print
  `refused: 'whitelist' is server/admin control...` and exit 2 WITHOUT
  connecting. If it ever executes, the guard is broken — stop and report.

## Tier 4 — live end-to-end (ESCALATE: needs explicit user OK)

```bash
node bridge/clawd.js --test "YourName: clawd hello"
```

Real players see the reply; it costs a brain turn. After it, confirm in
`journalctl -u clawd -n 20` and `tmux capture-pane -t clawd -p` that the brain
answered via say.js.

## False-success traps (README/HANDOFF scar tissue)

- Failed RCON commands often return **empty strings** — verify with
  `execute if entity ...`, never by absence of an error.
- tmux inject success ≠ Clawd answered — check for say.js output.
- `/summon` into an unloaded chunk "succeeds" but the entity is invisible to
  every selector.
- EssentialsX shadows bare `tp`/`kill`/`gamerule` — always `minecraft:` prefix.
