# HANDOFF — state as of 2026-07-04 (afternoon)

Context for the next Claude session picking this up. **This repo is now the
live install**: `clawd.service` runs `/home/pi/clawdcraft/bridge/clawd.js`
with `WorkingDirectory=/home/pi/clawdcraft`, and Clawd's brain tmux session
launches from `session/clawd_session.sh` with repo-relative pre-approved
tools. Verified end-to-end 2026-07-04 ~13:15 via
`node bridge/clawd.js --test "TestPlayer: clawd hello"` (brain replied
in-game via `bridge/say.js`).

Public repo: https://github.com/adrianwedd/clawdcraft (packs hosted on the
v0.1.0 release). The old copy at `/home/pi/minecraft_server/bot/` is retired —
it still exists but nothing runs from it; don't edit it, edit this repo.

## What exists and works (live, this repo)

- `clawd.service` → `bridge/clawd.js` bridge → tmux session `clawd`
  (interactive Claude Code, Sonnet 5) → replies via `bridge/say.js`, acts via
  `bridge/rcon.js`, gifts via `bridge/gift.js` (code-enforced allowlist),
  remembers via `bridge/memory.js`. All server-specifics live in `config.json`
  (gitignored; RCON password matches `server.properties`).
- Emote system (happy/think/alert/sad/magic: particles + sounds + hop) —
  Geyser doesn't render glow outlines, so Bedrock kids need audible cues.
- **Companion behaviors** (`bridge/companion.js`, built 2026-07-04 in the
  brain session, ported here + config-generalized): follow-the-last-speaker
  with glide teleports; roam/tidy mode that sorts dropped items into the depot
  platform (world `minecraft:obi`, ~186,305,-84). Coords/dimension/hint are in
  `config.json` `companion`; feature is off unless configured. Runtime state:
  `companion_data.json` / `companion_ctl.json` at repo root (gitignored).
  In-game: `clawd follow me` / `clawd stay` / `clawd go home` (free, handled
  bridge-side, no tokens).
- `enforce-secure-profile=false` set 2026-07-04 — Bedrock chat was silently
  broken before that. Full gotcha list: README "Gotchas".

## Remaining next steps

1. **Proximity chat** (user-approved; next up): off by default, op toggle
   (`clawd listen on/off/status`), per-player + global cooldowns, radius
   check bridge-side via `execute as @a[name=...] at @s if entity
   @e[type=minecraft:allay,tag=clawd,distance=..N]`; relay as a softer
   `[MC overheard near Clawd]` prompt with "may notice, not must reply"
   semantics in clawd_prompt.md; beware double-answering next to CraftGPT
   mobs. Cooldowns/radius are the token budget, not just politeness.
2. **RCON denylist hardening** (agreed 2026-07-04): enforce the prompt's
   "NEVER run" list in `bridge/rcon.js` code — refuse
   stop/reload/op/deop/ban/whitelist/kick and broad `@a`/`@e` kill/tp
   selectors. Denylist, NOT an allowlist of verbs: raw command freedom is
   what makes builds magical (gift.js-style allowlists only fit enumerable
   things like items).
3. **Project skills**: `.claude/skills/` for the live-server rituals
   (deploy-packs, smoke-test) so future sessions don't rediscover them.
4. Later, roughly in order: quest engine (rewards via gift.js), mood/state
   (particles+sounds, Bedrock-friendly), structured memory (only when plain
   notes actually fail), MCP server (only if the tmux bridge starts
   creaking).

## Done and verified (2026-07-04)

- **Crab Clawd (v0.2.1) LIVE and verified in-game by the user** on the crab
  avatar. One cube spec in `packs/tools/build_packs.py` (`--style crab`)
  generates: Bedrock name-keyed render controller (only allays named
  "Clawd" turn crab — Molang `query.get_name` confirmed working through
  Geyser 2.10.1), Java crab item_display scaled 1.2x enclosing the carrier
  allay (it can't ride — tp dismounts passengers — so the bridge snaps it
  after moves: `bridge/avatar.js`). Wild allays untouched on both editions.
  Fallbacks if ever needed: v0.2.0 (crab, but affects all allays), v0.1.0 /
  `--style classic` (coral recolor, `avatarModel: "allay"`).
- Companion + emotes + gifts + memory all live from this repo
  (`avatarModel: "crab"` in config.json).
- GOTCHA burned into companion.js: `/summon` into an UNLOADED chunk
  succeeds but the entity is invisible to every selector — the old
  resummon-at-depot loop stacked 83 invulnerable allays before the fix
  (maintenance now only runs with players online, summons AT a player,
  counts-and-culls duplicates).

## Things NOT to do

- Don't point `CLAWD_TMUX` at the user's personal `claude` tmux session (it
  runs with bypass permissions).
- Don't put enforcement of gifts/limits in the prompt — code only (gift.js
  pattern).
- Don't commit `config.json`, `companion_data.json`, or anything containing
  the RCON password.
- Don't edit `/home/pi/minecraft_server/bot/` — retired copy, kept only as
  fallback until the next server restart proves everything out.
