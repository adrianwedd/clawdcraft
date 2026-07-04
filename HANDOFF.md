# HANDOFF — state as of 2026-07-04 (end of session)

Context for the next Claude session picking this up. **This repo is the live
install**: `clawd.service` runs `/home/pi/clawdcraft/bridge/clawd.js` with
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
  `broadcast-rcon-to-ops=false` in server.properties. The crab's display is
  CustomName'd "Clawd" so residual feedback reads right.

## Next session plan (in order)

1. **RCON denylist hardening** — enforce the prompt's "NEVER run" list in
   `bridge/rcon.js` code: refuse stop/reload/op/deop/ban/whitelist/kick and
   broad `@a`/`@e` kill/tp selectors (allow tight `type=`+`limit=1`
   selectors; Clawd's own fix-commands must still pass). Denylist, NOT an
   allowlist of verbs — raw command freedom is what makes builds magical;
   gift.js-style allowlists only fit enumerable things. Add a test that
   walks the denylist. Note rcon.js is also used interactively by humans —
   consider a `--force` escape hatch or only denying in one-shot mode.
2. **Project skills** — `.claude/skills/` for the live-server rituals:
   `deploy-packs` (build → release → Geyser copy → server.properties sha1 →
   restart order → verify) and `mc-smoke-test` (`--test` injection, rcon
   `list`, journal checks, entity counts). Encode the gotchas below so
   future sessions stop rediscovering them.
3. **Enable + tune ambient in anger** — have an op say `clawd listen on`
   with kids online; watch token spend (`hourly` caps in ambient.js),
   double-answer behavior near CraftGPT mobs, and whether the "may notice"
   prompt keeps Clawd tastefully quiet. Tune chances/cooldowns in
   config.json from real behavior.
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
