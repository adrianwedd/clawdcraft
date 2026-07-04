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

1. **Deploy the packs** (needs a restart window + a human with a client):
   - Bedrock: `cp packs/build/clawdcraft-bedrock.mcpack
     /home/pi/minecraft_server/plugins/Geyser-Spigot/packs/` and restart.
     Have a Bedrock player confirm the allay turned coral.
   - Java: already hosted — set in server.properties:
     `resource-pack=https://github.com/adrianwedd/clawdcraft/releases/download/v0.1.0/clawdcraft-java.zip`
     `resource-pack-sha1=3fdbf151df2c2e032472305a2b23450c952ed1ac`
     then restart and confirm on a Java client.
   - CAUTION: the Bedrock texture is a straight recolor of Mojang's Bedrock
     allay texture (different UV layout than Java) — placeholder quality is
     expected. Real art direction: `packs/reference/clawd.webp`.
2. **Roadmap features** (user-approved direction, not yet built):
   - Proximity chat: off by default, op toggle (`clawd listen on/off`),
     per-player cooldown, radius check bridge-side via
     `execute if entity @e[name=...,distance=..N]`; beware double-answering
     next to CraftGPT mobs.
   - True crab-shaped Clawd: Java custom geometry + Bedrock geometry pack
     (both editions from one Blockbench project) — the big art project.
   - (Idle behavior from the old roadmap is DONE — that's companion.js.)

## Things NOT to do

- Don't point `CLAWD_TMUX` at the user's personal `claude` tmux session (it
  runs with bypass permissions).
- Don't put enforcement of gifts/limits in the prompt — code only (gift.js
  pattern).
- Don't commit `config.json`, `companion_data.json`, or anything containing
  the RCON password.
- Don't edit `/home/pi/minecraft_server/bot/` — retired copy, kept only as
  fallback until the next server restart proves everything out.
