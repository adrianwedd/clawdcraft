# STRATEGY.md — ClawdCraft executor doctrine

This file overrides executor judgment. Conflict between this file, code, docs,
git history, live state, or other agent guidance is DRIFT: report it and stop
before relying on the disputed claim — it is never permission to guess. Known
conflicts recorded below as documented-stale do not require stopping; any new,
broader, or unexplained conflict is drift. Every substantive claim is labeled
OBSERVED (explicit in code/docs/history/live state) or INFERRED (probable,
evidence stated). UNKNOWN items are omitted.

## 1. INTENT

ClawdCraft embeds an interactive Claude Code session ("Clawd") in a live
PaperMC 1.21.11 Minecraft server: the bridge tails server chat, injects
`clawd ...` lines into a tmux session, and Clawd replies/acts via four
pre-approved scripts (say/rcon/gift/memory). Done means: Clawd is charming,
safe around non-op players (including children — OBSERVED: HANDOFF.md mentions
kids online), cheap in tokens, and every hard limit is enforced in code, not
prompt. It is deliberately NOT a headless `claude -p` pipeline, NOT an MCP
server, and NOT a plugin with native mob AI (all rejected — §3).

**This repo IS the live install** (OBSERVED: `/etc/systemd/system/clawd.service`
runs `/home/pi/clawdcraft/bridge/clawd.js`, active since 2026-07-04). Any edit
to `bridge/` goes live on `sudo systemctl restart clawd`. Precedence of truth:
live state (systemd unit, running service, tmux `clawd`, `config.json`) >
HANDOFF.md > code comments > README.md > this file's snapshots. The GitHub repo
(adrianwedd/clawdcraft) and its releases are public mirrors of the sanitized
subset, never the operating truth.

Documented-stale: CLAUDE.md says next step is "deploy the resource packs";
HANDOFF.md (newer, 2026-07-04 end of session) records packs deployed and crab
verified in-game, with RCON denylist hardening as step 1. HANDOFF.md wins.

Time-sensitive facts — recheck before relying: service active and config
values (`avatarModel: "crab"`, proximity/events enabled, companion in world
`minecraft:obi`) are as of 2026-07-04; re-read `config.json` and
`systemctl status clawd` each session. Latest release v0.2.1 as of 2026-07-04.

## 2. INVARIANTS

- Never commit or push `config.json`, `companion_data.json`, `*_ctl.json`, or
  `clawd_memory/` — config holds the live RCON password and the repo is
  public. Tempting shortcut: `git add -A` after touching runtime files.
  OBSERVED (.gitignore, HANDOFF "Things NOT to do"; git history clean).
- Never enforce safety in the prompt when code can enforce it. Gift limits
  live only in `bridge/gift.js` ALLOWLIST. Tempting shortcut: "just add a rule
  to clawd_prompt.md". OBSERVED (HANDOFF, gift.js header).
- Never point `tmuxSession`/`CLAWD_TMUX` at the user's personal `claude` tmux
  session — it runs with bypass permissions. A live `claude` session exists on
  this machine (OBSERVED: `tmux ls`). OBSERVED (HANDOFF).
- Never edit `/home/pi/minecraft_server/bot/` — retired copy. OBSERVED.
- Never summon the allay with AI or gravity: NBT must keep
  `NoAI:1b,NoGravity:1b` (y=261 fly-away incident). Never re-enable vanilla AI
  "for smoother movement". OBSERVED (HANDOFF, avatar.js).
- Never summon at fixed coords or into possibly-unloaded chunks; summon AT a
  player, with players online. `/summon` into an unloaded chunk succeeds
  silently and the entity is selector-invisible (83-allay incident, commit
  d20477f). OBSERVED.
- Always `minecraft:tp`, `minecraft:kill`, `minecraft:gamerule` in RCON-driven
  code — EssentialsX shadows bare forms even inside `execute ... run`; 1.21.11
  gamerules are snake_case. OBSERVED (README, HANDOFF).
- Never make the crab item_display ride the allay — tp dismounts passengers;
  it is a synced sibling (avatar.js). OBSERVED.
- Never `await rcon.end()` without catch — it rejects when not connected and
  kills the process (clawd.js `rc()` comment). OBSERVED.
- Never kill the tmux server or the `clawd` session when stopping the service
  (`KillMode=process` is load-bearing). OBSERVED (unit file comment).
- Never leave `bridge/` syntactically broken in the working tree: the service
  is live with `Restart=always`; a crash-looping edit affects real players.
  INFERRED from unit file + live install. Check `node --check` before restart.
- Do not widen `--allowedTools` in `session/clawd_session.sh` or the gift.js
  allowlist without explicit user approval — that is capability expansion of
  an autonomous agent, not a refactor.
- `node bridge/clawd.js --test "..."` is NOT a dry-run: it drives the live
  server (summons/moves the avatar, speaks in real chat, injects into the live
  brain, spends tokens). OBSERVED (clawd.js handle()).
- Wild allays must stay unaffected by avatar styling on both editions (v0.2.1
  regression fixed in commit 5376b74). OBSERVED.

## 3. DECISIONS & GRAVEYARD

- tmux interactive session over headless `claude -p`: attachability, human
  approval gate, continuous conversation. OBSERVED (README). Revisit only if
  the user asks for MCP ("only if the tmux bridge creaks" — HANDOFF).
- RCON hardening will be a DENYLIST in `bridge/rcon.js`, not a verb allowlist:
  raw command freedom is what makes builds work; allowlists fit only
  enumerable things like gifts. OBSERVED (HANDOFF step 1). Do not "improve" it
  into an allowlist.
- CraftGPT-style native movement rejected: decompiled, it has no movement code
  at all. True native movement = parked "ClawdBody" Paper plugin; trigger:
  425ms glide still feels teleport-y to the user. OBSERVED (HANDOFF).
- Crab avatar via Bedrock name-keyed render controller + Java item_display
  overlay; v0.2.0 (all-allay crab) and v0.1.0 classic recolor are kept as
  fallback styles, not dead code. OBSERVED (build_packs.py, releases).
- Ambient presence is budgeted (cooldowns + hourly caps in config) and
  proximity listening is runtime-OFF until an op says `clawd listen on` —
  OBSERVED (no `ambient_ctl.json` exists as of 2026-07-04). Do not enable it
  yourself; that is the user's step 3.
- Structured memory and quest engine deferred; plain per-player JSON notes
  until they fail. OBSERVED (HANDOFF backlog order).

## 4. FAILURE MODES

- Shortcut: verify a fix with `--test`. Tell: "<Clawd>" lines appear in real
  game chat / journal. Correction: prefer `node --check`, `rcon.js "list"`,
  and reading `journalctl`; use `--test` only accepting live side effects.
- Shortcut: parse RCON error text. Tell: failed commands return empty strings.
  Correction: verify with `execute if entity ...` probes (README gotcha).
- Shortcut: `git add -A && git commit`. Tell: `companion_ctl.json` /
  `ambient_ctl.json` staged (they are gitignored, but new runtime files may
  not be). Correction: stage named files only; check `git status` first.
- Shortcut: edit the retired `/home/pi/minecraft_server/bot/` because a grep
  hit landed there. Tell: path outside repo root. Correction: this repo only.
- Shortcut: restart the service to "pick up" a half-finished edit. Tell:
  journal shows crash loop every 10s. Correction: finish + `node --check`
  every changed bridge file before `systemctl restart clawd`.
- Shortcut: treat pane-ready "❯" detection or tmux inject success as Clawd
  having answered. Tell: no say.js output in journal. Correction: attach or
  `tmux capture-pane -t clawd -p` to confirm the brain actually responded.

## 5. ESCALATION TRIGGERS

Continue safe preparatory work (reading, diagnosis, patches, `node --check`,
pack builds into `packs/build/`) past any gated action; stop only the gated
action itself. Escalate before:

- Drift between HANDOFF.md, code, config.json, and live systemd/tmux state
  (beyond the documented-stale CLAUDE.md line above).
- Any world-mutating RCON command beyond documented avatar-maintenance
  patterns — real players' world. Read-only RCON (`list`,
  `execute if entity`) is allowed. Broad selectors (`@a`, `@e` without
  type+limit) are forbidden outright.
- Speaking in game chat (say.js, tellraw) or injecting into the `clawd` tmux
  session — visible to players and/or spends paid tokens (`--test` included).
- `sudo systemctl restart clawd`: allowed as the documented deploy step, but
  escalate if the working tree is dirty with unreviewed changes or players
  are mid-conversation with Clawd. Restarting the Minecraft server itself:
  always escalate.
- `git push`, `gh release` — publishes to a public repo; check for secrets
  and the Anthropic-owned mascot likeness note (README license section).
- Editing doctrine (CLAUDE.md, HANDOFF.md, STRATEGY.md) or safety surfaces:
  `session/clawd_prompt.md`, `session/clawd_session.sh` `--allowedTools`,
  `bridge/gift.js` ALLOWLIST, future rcon denylist — unless the task names
  the file.
- Touching `clawd_memory/` contents (player personal notes = user data) or
  `config.json` (RCON password; ops list controls who can command Clawd).
- Deploying packs: copying into `plugins/Geyser-Spigot/packs/`, editing
  `server.properties`, or changing `avatarModel` — ordered ritual with a
  broken-visual failure mode (avatar.js header); needs explicit task scope.
- Anything under `/home/pi/minecraft_server/` — external live system;
  read-only access is granted (.claude/settings.local.json), writes escalate.

Side-effect classes: local reads/`node --check`/pack builds = allowed;
read-only RCON = allowed; chat/tokens/world mutation = escalate unless the
task authorizes; server restart, publishing, safety-surface edits = escalate;
broad-selector kills, committing secrets, personal-tmux injection = forbidden.

## 6. VERIFICATION

No test suite exists (OBSERVED). Ordered checks:

1. `node --check bridge/<changed>.js` — expect silence. Safe, always run.
2. `systemctl status clawd --no-pager` — expect `active (running)`, no
   restart churn.
3. `journalctl -u clawd -n 50 --no-pager` — expect bridge start line, no
   `RCON error` loops or stack traces.
4. `node bridge/rcon.js "list"` — expect player count line. Read-only; proves
   RCON path + password.
5. `tmux capture-pane -t clawd -p | tail -20` — expect a Claude Code prompt;
   proves the brain is up. Do not type into it.
6. `python3 packs/tools/build_packs.py --mc-version 1.21.11` (in
   `packs/tools/`) — expect zip/mcpack/preview in `packs/build/`. Downloads
   from Mojang/GitHub; local-only output.
7. Live behavior (`--test` injection, in-game checks): report as blocked
   unless the task authorizes live-server interaction; if authorized, follow
   with journal + `execute if entity` read-after-write probes.

Verification never grants permission: a check requiring restart, chat, world
mutation, or publishing is reported as the blocked step, not performed.

File authority: doctrine = CLAUDE.md, STRATEGY.md, HANDOFF.md (updated only as
an explicit end-of-session task), `session/clawd_prompt.md` (safety half).
Evidence = `clawd_memory/`, `companion_data.json`, `*_ctl.json`, journald
logs, `packs/reference/clawd.webp` — preserve, never normalize. Working =
`bridge/*.js`, `packs/tools/build_packs.py`, README.md, examples. Generated =
`packs/build/` (disposable locally, but its copies published as GitHub release
assets and referenced by `server.properties` sha1 — rebuilding locally does
NOT update what clients download).
