# HANDOFF — state as of 2026-07-04 (end of second session)

Context for the next Claude session picking this up. **Read STRATEGY.md
first** — executor doctrine: file authority, invariants, escalation triggers,
verification order. **This repo is the live install**: `clawd.service` runs
`/home/pi/clawdcraft/bridge/clawd.js` with
`WorkingDirectory=/home/pi/clawdcraft`; Clawd's brain tmux session launches
from `session/clawd_session.sh` with repo-relative pre-approved tools.

Public repo: https://github.com/adrianwedd/clawdcraft (resource packs hosted
on the v0.2.1 release). The old copy at `/home/pi/minecraft_server/bot/` is
retired — don't edit it.

## What exists and works (live, all verified 2026-07-04)

- **Core loop**: `clawd.service` → `bridge/clawd.js` (tails server log) →
  tmux `clawd` (interactive Claude Code, Sonnet 5) → replies via
  `bridge/say.js` (+emotes), acts via `bridge/rcon.js`, gifts via
  `bridge/gift.js` (code-enforced allowlist), remembers via
  `bridge/memory.js`. Server-specifics in `config.json` (gitignored).
- **Crab Clawd (v0.2.1) — verified in-game by the user.** One cube spec in
  `packs/tools/build_packs.py --style crab` generates both editions:
  Bedrock name-keyed render controller (only allays named "Clawd" turn crab;
  Molang `query.get_name` confirmed working through Geyser 2.10.1), Java
  crab item_display scaled 1.2x enclosing the carrier allay
  (`bridge/avatar.js`; it can't ride — tp dismounts passengers — so the
  bridge snaps it after moves). Wild allays untouched on both editions.
  Fallbacks: v0.2.0 (crab, affects all allays), v0.1.0/`--style classic`
  (coral recolor, `avatarModel: "allay"`).
- **Companion** (`bridge/companion.js`): follows the last speaker with
  glide-tps (425ms tick), roam/tidy mode sorts dropped items into the depot
  (world `minecraft:obi` ~186,305,-84). `clawd follow me / stay / go home`
  handled bridge-side, free.
- **Ambient presence** (`bridge/ambient.js`): proximity chat
  (`[MC overheard near Clawd]`, radius 12, runtime-OFF until an op says
  `clawd listen on` — NOT yet enabled by anyone) + world-event reactions
  (`[MC event]`: first-ever joins always relay, joins/advancements/deaths by
  % chance — live now). Per-player/global cooldowns + hourly caps in
  config.json are the token budget. Prompt has a "may notice, NOT must
  reply" section; no gifts/world changes from overheard lines.
- **Quiet logs**: skin syncs only when the avatar actually moved;
  `log_admin_commands=false` gamerule in all loaded worlds;
  `broadcast-rcon-to-ops=false` in server.properties — NB this one only
  applies at server start; it was live-dead until the MC server restart at
  15:07 on 2026-07-04 (ops saw "[Rcon: Teleported Clawd...]" spam until
  then). The crab's display is CustomName'd "Clawd" so residual feedback
  reads right.
- **Selective op visibility (replaces broadcast-rcon-to-ops=true)**: with
  `CLAWD_RCON_ECHO=1` (exported only in `session/clawd_session.sh`, so only
  Clawd's brain), rcon.js echoes each executed command to online ops as a
  gray italic "⚙ Clawd: <cmd>" tellraw. Movement ticks never pass through
  rcon.js (bridge-internal connection) so ops see deliberate commands only.
  Env var requires brain-session recreation to change — current brain has it
  (recreated 15:09, 2026-07-04, server empty, context loss accepted).
- **RCON denylist in code (done this session, verified live)**:
  `bridge/rcon_guard.js` enforces the prompt's "NEVER run" list on the paths
  Clawd is pre-approved for — rcon.js one-shot AND piped stdin (piped matters:
  `--allowedTools "Bash(node bridge/rcon.js:*)"` would pre-approve
  `node bridge/rcon.js <<< stop`). Blocks admin verbs in any namespace and
  kill/tp with broad `@a`/`@e`; unwraps `execute ... run`, and when the final
  verb is kill/tp every selector in the whole command must be tight
  (limit=1, name=, or type=+positive tag=) — catches
  `execute as @e run kill @s`. Interactive TTY use is the human escape hatch;
  deliberately NO `--force` flag (the wildcard pre-approval would cover it).
  Test: `cd bridge && npm test` — 54 offline cases incl. the prompt's exact
  avatar fix-commands as must-pass, plus gift.js refusal paths.
- **`--dry` mode (done this session)**: `node bridge/clawd.js --dry
  "Name: msg"` classifies a line (trigger/fast-path/ambient, op detection,
  full log lines incl. `[Not Secure]`) with ZERO side effects. `--test`
  remains LIVE (real chat, real tokens) — never confuse them.
- **Project skills (done this session)**: `.claude/skills/mc-smoke-test`
  (ordered offline → read-only → live-gated checks) and
  `.claude/skills/deploy-packs` (build → release → Geyser copy →
  server.properties sha1 → restart → verify → only then avatarModel flip).

## Next session plan (in order)

1. **Enable + tune ambient in anger** — have an op say `clawd listen on`
   with kids online; watch token spend (`hourly` caps in ambient.js),
   double-answer behavior near CraftGPT mobs, and whether the "may notice"
   prompt keeps Clawd tastefully quiet. Tune chances/cooldowns in
   config.json from real behavior. (Human-gated: needs the user + players
   online. Note 14:39 today: first `[MC event]` firstJoin relay fired for
   `.Nairdaaa` — memory dir was empty so a returning op read as "brand new
   player". Expect that skew until clawd_memory/ repopulates.)
2. **Decide: push 4 local commits** — main is ahead of origin (STRATEGY.md
   doctrine, rcon guard + test + --dry, skills, this HANDOFF). Public repo;
   diff reviewed for secrets this session, but pushing is publishing —
   user's call per STRATEGY.md.
3. **Optional, needs explicit scope (safety surface)**: one line in
   `session/clawd_prompt.md` telling Clawd that a `refused:` message from
   rcon.js is final — apologize in-character, don't retry variants. Prompt
   edits take effect on session recreation (`clawd reset` or tmux kill).
4. **Backlog** (user-endorsed order): quest engine (state per player,
   rewards through gift.js), mood/state via particles+sounds
   (Bedrock-friendly), structured memory (only when plain notes fail),
   MCP server (only if the tmux bridge creaks). Also parked: "ClawdBody"
   Paper plugin for true native movement (see CraftGPT note) — only if the
   425ms glide still feels teleport-y.

## Field notes / gotchas (hard-won today)

- **CraftGPT "handles movement" by not handling it**: decompiled the jar —
  zero pathfinding/velocity code; its mobs keep vanilla AI and the plugin
  only adds chat. Clawd can't copy that (vanilla allay AI flies to build
  height — the y=261 incident). True native movement needs a small Paper
  plugin driving the allay in-process (Paper Pathfinder API), parked as
  "ClawdBody". CraftGPT ideas adopted instead: auto-chat radius (→
  proximity), % event reactions, usage caps.
- **`/summon` into an UNLOADED chunk succeeds** but the entity is invisible
  to every selector — the old resummon-at-depot loop stacked 83 invulnerable
  allays. companion.js maintenance now only runs with players online,
  summons AT a player, counts-and-culls duplicates.
- **rcon-client's `end()` is async and rejects when not connected** — a bare
  try/catch doesn't stop the rejection killing the process. clawd.js `rc()`
  awaits it and serializes concurrent connects (ambient + companion + chat
  share one socket).
- **1.21.11 renamed gamerules to snake_case** (`log_admin_commands`, not
  `logAdminCommands`) and EssentialsX shadows `gamerule` like `tp`/`kill` —
  always `minecraft:gamerule`.
- **tp'ing a vehicle dismounts passengers** — that's why the crab skin is a
  synced sibling, not a rider.
- `enforce-secure-profile=false` (set 2026-07-04) — Bedrock chat was
  silently broken before that. More in README "Gotchas".
- **Guard canary for smoke tests**: `node bridge/rcon.js "whitelist list"`
  must refuse (exit 2) WITHOUT connecting — and is harmlessly read-only if
  the guard ever breaks. Never canary with `stop`.
- **`KillMode=process` leaves the `tail -F` child orphaned** on service
  stop — journal shows "Found left-over process ... Ignoring". Harmless
  (next start spawns a fresh tail; the orphan dies with the old node's pipe),
  but don't mistake it for a crash.
- **Piped interactive rcon.js has a pre-existing race**: `rl.on("close")`
  ends the connection before pending async sends print. One-shot mode (what
  Clawd uses) is unaffected. Fix only if it ever bites.

## Things NOT to do

- Don't point `CLAWD_TMUX` at the user's personal `claude` tmux session (it
  runs with bypass permissions).
- Don't put enforcement of gifts/limits in the prompt — code only (gift.js
  pattern).
- Don't commit `config.json`, `companion_data.json`, or anything containing
  the RCON password.
- Don't edit `/home/pi/minecraft_server/bot/` — retired.
- Don't re-enable AI on the allay (y=261 incident) — movement is bridge-tp
  or, someday, the ClawdBody plugin.
