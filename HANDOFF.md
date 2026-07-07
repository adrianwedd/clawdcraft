# HANDOFF — state as of 2026-07-07 (fifth session)

Context for the next Claude session picking this up. **Read STRATEGY.md
first** — executor doctrine: file authority, invariants, escalation triggers,
verification order. Feature direction lives in **ROADMAP.md** (one GitHub
issue per item). **This repo is the live install**: `clawd.service` runs
`/home/pi/clawdcraft/bridge/clawd.js` with
`WorkingDirectory=/home/pi/clawdcraft`; Clawd's brain tmux session launches
from `session/clawd_session.sh` with repo-relative pre-approved tools.

Public repo: https://github.com/adrianwedd/clawdcraft (resource packs hosted
on the v0.2.1 release). main is pushed and in sync with origin as of end of
session (`cbf72e7`). The old copy at `/home/pi/minecraft_server/bot/` is
retired — don't edit it.

## Live state at handoff (verified 2026-07-07 ~11:50)

Service active, brain force-recreated on this session's fixes (confirmed via
`tmux list-sessions` creation timestamp and the statusline's git-HEAD
matching `cbf72e7`) and answering. `journalctl -u clawd` clean since restart.
Working tree clean except the untracked `undefined` file (a stray
`script(1)` artifact from 2026-07-04, harmless, not part of the repo).

## Since the last HANDOFF (2026-07-04 → 2026-07-07)

- **Per-player token budget for direct chat shipped** (`878b5d6`, closes
  issue #1): `bridge/chat_budget.js` — 15s per-player cooldown, 30/hr and
  150/day caps, ops exempt, canned in-character over-budget line (itself
  throttled) so denials cost zero tokens. Budget spent only after a
  successful inject. 15 offline tests with a fake clock (`npm test`, 69
  total across both suites).
- **Companion chunk-loaded gating + emergency rescue exception** (`cbf72e7`):
  see field notes below — this closed a real invisible-avatar bug, not just
  a rule change.
- **Obi's Bedrock/Java accounts linked** (2026-07-06, done from the
  `minecraft_server` side, not this repo, but changes ops here): Floodgate
  local linking (`enable-own-linking` + `floodgate-sqlite-database.jar`) maps
  Bedrock `.Obi000000` → Java `Obi000000` (`313dc80a-60f7-4eef-94e9-fa8b301e9f1c`).
  `config.json`'s `ops` array and `clawd_prompt.md` both already reflect
  `Obi000000` alongside `.Obi000000`.

## What exists and works

- **Core loop**: `clawd.service` → `bridge/clawd.js` (tails server log) →
  tmux `clawd` (interactive Claude Code, Sonnet 5) → replies via
  `bridge/say.js` (+emotes), acts via `bridge/rcon.js`, gifts via
  `bridge/gift.js` (code-enforced allowlist), remembers via
  `bridge/memory.js`. Server-specifics in `config.json` (gitignored).
- **Injection hardening (2026-07-04, after the brain-offline incident)**:
  the bridge holds a permanent read-only headless tmux client
  (`holdClient()` — script(1) pty + explicit TERM, systemd provides neither)
  because tmux 3.3a's send-keys fails "no current client" with zero attached
  clients; sends target the pane ID via a script-pty wrapper; tmux stderr is
  logged, not swallowed. Drop the holder if the box ever gets tmux ≥3.4.
- **RCON denylist in code** (`bridge/rcon_guard.js`, live + verified):
  enforces the prompt's "NEVER run" list on the paths Clawd is pre-approved
  for — rcon.js one-shot AND piped stdin (`<<< stop` would be pre-approved by
  the allowedTools wildcard). Blocks admin verbs in any namespace and kill/tp
  with broad `@a`/`@e`; unwraps `execute ... run`; when the final verb is
  kill/tp every selector must be tight (limit=1, name=, or type=+positive
  tag=). Interactive TTY use is the human escape hatch; deliberately NO
  `--force` flag. Test: `cd bridge && npm test` — 54 offline cases incl. the
  prompt's exact avatar fix-commands as must-pass, plus gift.js refusals.
- **Selective op visibility**: with `CLAWD_RCON_ECHO=1` (exported only in
  `session/clawd_session.sh`, so only Clawd's brain), rcon.js echoes each
  executed command to online ops as a gray "⚙ Clawd: <cmd>" tellraw.
  Movement ticks use the bridge-internal connection and never pass through
  rcon.js, so ops see deliberate commands only. Env change needs
  brain-session recreation; the current brain has it.
- **`--dry` mode**: `node bridge/clawd.js --dry "Name: msg"` classifies a
  line (trigger/fast-path/ambient, op detection, full log lines incl.
  `[Not Secure]`) with ZERO side effects. `--test` remains LIVE (real chat,
  real tokens) — never confuse them.
- **Project skills**: `.claude/skills/mc-smoke-test` (offline → read-only →
  live-gated tiers) and `.claude/skills/deploy-packs` (build → release →
  Geyser copy → server.properties sha1 → restart → verify → only then
  avatarModel flip).
- **Crab Clawd (v0.2.1) — verified in-game.** One cube spec in
  `packs/tools/build_packs.py --style crab` generates both editions: Bedrock
  name-keyed render controller (only allays named "Clawd" turn crab), Java
  crab item_display scaled 1.2x enclosing the carrier allay
  (`bridge/avatar.js`; can't ride — tp dismounts passengers — so the bridge
  snaps it after moves). Wild allays untouched on both editions. Fallbacks:
  v0.2.0 (all-allay crab), v0.1.0/`--style classic` (coral recolor).
- **Companion** (`bridge/companion.js`): follows the last speaker with
  glide-tps (425ms tick), roam/tidy mode sorts dropped items into the depot
  (world `minecraft:obi` ~186,305,-84). `clawd follow me / stay / go home`
  bridge-side, free.
- **Ambient presence** (`bridge/ambient.js`): proximity chat runtime-OFF
  until an op says `clawd listen on` (still not yet enabled by anyone);
  world-event reactions live (firstJoin always relays via the persistent
  seen_players.json registry — every player reads as new ONCE while it
  seeds). Cooldowns + hourly caps in config.json are the token budget.
- **Quiet logs**: `log_admin_commands=false` in all worlds,
  `broadcast-rcon-to-ops=false` live since the 15:07 MC server restart
  (server.properties only applies at server start — it was dead-on-disk
  before that), skin syncs only on actual movement.

## Next session plan (in order)

1. **Enable + tune ambient in anger** (issue #12, human-gated) — an op says
   `clawd listen on` with kids online; watch token spend against the hourly
   caps, double-answer behavior near CraftGPT mobs, and whether "may notice,
   NOT must reply" keeps Clawd tastefully quiet. Tune config from behavior.
2. **Brain-turn metering + `clawd usage`** (issue #6) — needed to tune #12
   and the chat budget with data instead of vibes.
3. **Watchdog** (issue #7, priority raised by the 2026-07-04 brain-hang
   incident) — detect a catatonic brain (liveness probe, NOT prompt
   presence; see field note), one auto-recovery, alert ops in-game.
4. **Prompt line: refusals are final** (issue #11, safety surface — needs
   explicit user go-ahead): one clawd_prompt.md line so the model doesn't
   burn turns retrying guard-blocked commands. Takes effect on session
   recreation.

Everything else: ROADMAP.md (Now/Next/Later + gated items with triggers).

## Field notes / gotchas (hard-won)

- **`systemctl restart clawd` does NOT reload `clawd_prompt.md`.**
  `KillMode=process` means a service restart only respawns the bridge
  (node) process — the tmux `clawd` session (the actual brain, launched via
  `session/clawd_session.sh` with `--append-system-prompt` baked in at
  launch) survives untouched, per `bridge/clawd.js`'s `has-session` check
  before it will recreate. Any prompt edit needs
  `tmux kill-session -t clawd && sudo systemctl restart clawd` — watch the
  journal for `creating tmux session 'clawd' (Clawd's brain)...` to confirm
  it actually recreated, and cross-check the tmux statusline's git-HEAD hash
  against the commit that changed the prompt. Companion.js / other
  bridge-side JS changes DO take effect on a plain service restart.
- **Companion avatar vanishing in another dimension (fixed 2026-07-06,
  `cbf72e7`)**: `roomTick()`'s `execute in <DIM> run minecraft:tp ...` was
  unconditional, so it happily teleported the avatar to its depot/waypoint
  even when nobody was in that dimension and the destination chunk was
  unloaded — the entity went invisible to every selector, and maintenance
  then killed-and-respawned it every ~11s (visible as a tight loop in the
  journal). Fix: every cross-dimension tp is now gated on
  `if loaded <x> <y> <z>` (see `ifLoaded()` in `bridge/companion.js`); an
  unloaded destination means the avatar just stays put instead of
  teleporting into the void.
- **Brain-hang incident (15:09–15:52, 2026-07-04)**: a freshly created brain
  claude process went catatonic right after startup — pane frozen on the
  welcome screen, keys swallowed, and send-keys produced misleading secondary
  errors ("client is read-only", hangs) from typing into the dead pty.
  Tell: the pane statusline timestamp stops updating. Fix:
  `tmux kill-session -t clawd && sudo systemctl restart clawd`. paneReady's
  "❯" check does NOT catch this (prompt rendered once, process dead behind
  it). If injects fail, check `tmux list-clients` and the statusline
  timestamp before anything else.
- **tmux 3.3a send-keys needs an attached client** — fails "no current
  client" with zero attached clients, i.e. exactly when no human is
  watching. It worked all day only because the user happened to be attached.
  Fixed in tmux 3.4; the holder client covers it until then.
- **CraftGPT "handles movement" by not handling it**: decompiled the jar —
  zero pathfinding/velocity code. Clawd can't copy that (vanilla allay AI
  flies to build height — the y=261 incident). True native movement = the
  parked ClawdBody Paper plugin (ROADMAP gated).
- **`/summon` into an UNLOADED chunk succeeds** but the entity is invisible
  to every selector — the old resummon loop stacked 83 invulnerable allays.
  companion.js maintenance only runs with players online, summons AT a
  player, counts-and-culls duplicates.
- **rcon-client's `end()` is async and rejects when not connected** — a bare
  try/catch doesn't stop the rejection killing the process. clawd.js `rc()`
  awaits it and serializes concurrent connects (ambient + companion + chat
  share one socket).
- **1.21.11 gamerules are snake_case** and EssentialsX shadows `gamerule`,
  `tp`, `kill` even inside `execute ... run` — always `minecraft:` prefix.
- **tp'ing a vehicle dismounts passengers** — the crab skin is a synced
  sibling, not a rider.
- `enforce-secure-profile=false` (set 2026-07-04) — Bedrock chat was silently
  broken before. More in README "Gotchas".
- **Guard canary**: `node bridge/rcon.js "whitelist list"` must refuse
  (exit 2) WITHOUT connecting — harmlessly read-only if the guard ever
  breaks. Never canary with `stop`.
- **`KillMode=process` leaves the `tail -F` child orphaned** on service stop
  — journal shows "Found left-over process ... Ignoring". Harmless; don't
  mistake it for a crash. (An unclean SIGKILL can similarly leak one
  read-only holder client — also harmless.)
- **Piped interactive rcon.js has a pre-existing race**: `rl.on("close")`
  ends the connection before pending async sends print. One-shot mode (what
  Clawd uses) is unaffected. Fix only if it bites.
- **zsh eats `=word` and bare `===`** (equals-expansion) — quote them in
  Bash-tool commands or diagnostics fail confusingly mid-pipeline.

## Things NOT to do

- Don't point `tmuxSession` at the user's personal `claude` tmux session (it
  runs with bypass permissions).
- Don't put enforcement of gifts/limits/denylists in the prompt — code only
  (gift.js / rcon_guard.js pattern).
- Don't commit `config.json`, `companion_data.json`, `seen_players.json`, or
  anything containing the RCON password.
- Don't edit `/home/pi/minecraft_server/bot/` — retired.
- Don't re-enable AI on the allay (y=261 incident) — movement is bridge-tp
  or, someday, the ClawdBody plugin.
- Don't verify with `--test` casually — it speaks in real chat and spends
  real tokens. `--dry` first, `--test` only when you mean it.
