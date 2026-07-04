# CLAUDE.md

ClawdCraft: puts Claude Code inside a Minecraft server as "Clawd", an in-game
creature players talk to in chat. Architecture, install, and gotchas: README.md.

**Start here: `HANDOFF.md`** — current state and the ordered next steps
(migrate the live install at `/home/pi/minecraft_server/bot/` to this repo,
deploy the resource packs, push to GitHub, then roadmap features). It also
lists the do-not-dos; read it before changing anything.

The live, currently-running copy of this system is `clawd.service` →
`/home/pi/minecraft_server/bot/` on this machine (Obi's Minecraft Server,
PaperMC 1.21.11 on a Pi 5 — its own CLAUDE.md is in that directory). Until
step 1 of HANDOFF.md is done, changes here do NOT affect the running Clawd.

Quick sanity checks:
- `node bridge/clawd.js --test "TestPlayer: clawd hello"` (needs config.json)
- `journalctl -u clawd -f` — live bridge logs
- `tmux attach -t clawd` — Clawd's live brain (detach: Ctrl-b d)
