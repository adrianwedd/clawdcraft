# CLAUDE.md

ClawdCraft: puts Claude Code inside a Minecraft server as "Clawd", an in-game
creature players talk to in chat. Architecture, install, and gotchas: README.md.

**Start here: `HANDOFF.md`** — current state and the ordered next steps
(deploy the resource packs, then roadmap features). It also lists the
do-not-dos; read it before changing anything.

**This repo IS the live install** (since 2026-07-04): `clawd.service` runs
`bridge/clawd.js` from here on this machine (Obi's Minecraft Server, PaperMC
1.21.11 on a Pi 5). Edits to bridge code take effect on
`sudo systemctl restart clawd`. The old copy at
`/home/pi/minecraft_server/bot/` is retired — don't edit it. Public repo:
https://github.com/adrianwedd/clawdcraft

Read STRATEGY.md before any task. It overrides your judgment. Conflicts with
reality are escalations.

Quick sanity checks:
- `node bridge/clawd.js --test "TestPlayer: clawd hello"` (needs config.json)
- `journalctl -u clawd -f` — live bridge logs
- `tmux attach -t clawd` — Clawd's live brain (detach: Ctrl-b d)
