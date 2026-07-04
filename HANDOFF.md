# HANDOFF — state as of 2026-07-04

Context for the next Claude session picking this up. The live, working install
is `/home/pi/minecraft_server/bot/` (hardcoded paths, running now as
`clawd.service`). This repo (`~/clawdcraft/`) is the **generalized, shareable
export** of that system — scaffolded and pack-tooling verified, but not yet the
running copy and not yet on GitHub.

## What exists and works (live server)

- `clawd.service` → `bot/clawd.js` bridge → tmux session `clawd` (interactive
  Claude Code, Sonnet 5) → replies via `bot/say.js`, acts via `bot/rcon.js`,
  gifts via `bot/gift.js` (code-enforced allowlist), remembers via
  `bot/memory.js`. All tested end-to-end via `--test` injection and RCON.
- Emote system (happy/think/alert/sad/magic: particles + sounds + hop) — chosen
  because Geyser doesn't render glow outlines, so Bedrock kids needed
  audible/visible cues.
- `enforce-secure-profile=false` set 2026-07-04 — Bedrock chat was silently
  broken before that. Full gotcha list: README "Gotchas" section; details in
  Claude memory files (`essentials_command_shadowing.md`, `project_clawd.md`).

## What this repo adds over the live copy

- `bridge/config.js` + `config.example.json` — all server-specifics
  (RCON creds, log path, ops, model) externalized; no secrets in git.
- Scripts under `bridge/` use repo-relative paths; the session launcher
  (`session/clawd_session.sh`) runs with cwd = repo root and pre-approves
  `Bash(node bridge/<script>.js:*)` patterns.
- `packs/tools/build_packs.py` — VERIFIED WORKING: builds Java + Bedrock allay
  reskins in the Clawd coral palette (reference art:
  `packs/reference/clawd.webp`, palette anchor `#F05040`, black eyes).
  For MC 1.21.11 the Java pack_format is 75 (auto-read from client jar).

## Next steps, in rough order

1. **Migrate the live install to this repo** (removes the fork): `cd bridge &&
   npm install`, `cp config.example.json ../config.json` + fill in (RCON
   password is in `/home/pi/minecraft_server/server.properties`; ops:
   Nairdaaa, .Nairdaaa, .Obi000000; log file
   `/home/pi/minecraft_server/logs/latest.log`), point
   `/etc/systemd/system/clawd.service` ExecStart at
   `/home/pi/clawdcraft/bridge/clawd.js` with WorkingDirectory=/home/pi/clawdcraft,
   `daemon-reload`, kill the old tmux session, restart. Verify with
   `node bridge/clawd.js --test "TestPlayer: clawd hello"`.
2. **Deploy the packs** (needs a restart window + a human with a client):
   - Bedrock: `cp packs/build/clawdcraft-bedrock.mcpack
     /home/pi/minecraft_server/plugins/Geyser-Spigot/packs/` and restart.
     Have a Bedrock player confirm the allay turned coral.
   - Java: host `packs/build/clawdcraft-java.zip` at a public URL (simplest:
     GitHub release once pushed; or the existing dashboard's static dir), set
     `resource-pack=` + `resource-pack-sha1=` (sha1 printed by build script)
     in server.properties, restart, confirm on a Java client.
   - CAUTION: the Bedrock texture is a straight recolor of Mojang's Bedrock
     allay texture (different UV layout than Java) — verify it looks right
     in-game; placeholder quality is expected. Real art direction: the user
     wants Clawd to look like `packs/reference/clawd.webp`.
3. **Push to GitHub**: `gh repo create` (check `gh auth status` first). Before
   pushing, double-check no secrets: `git grep -iE 'password|25575'` should hit
   only config.example.json placeholders and docs.
4. **Roadmap features** (user-approved direction, not yet built):
   - Proximity chat: off by default, op toggle (`clawd listen on/off`),
     per-player cooldown, radius check bridge-side via
     `execute if entity @e[name=...,distance=..N]`; beware double-answering
     next to CraftGPT mobs.
   - Idle behavior: bridge-side ambient loop only (particles, yaw turns via
     `minecraft:tp`), never re-enable AI on the allay (it flew to y=261 once).
   - True crab-shaped Clawd: Java custom geometry + Bedrock geometry pack
     (both editions from one Blockbench project) — the big art project.

## Things NOT to do

- Don't point `CLAWD_TMUX` at the user's personal `claude` tmux session (it
  runs with bypass permissions).
- Don't put enforcement of gifts/limits in the prompt — code only (gift.js
  pattern).
- Don't commit `config.json` or anything containing the RCON password.
