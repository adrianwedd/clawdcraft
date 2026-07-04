---
name: deploy-packs
description: Build and deploy the ClawdCraft resource packs (Java zip + Bedrock mcpack) to the live server. Ordered ritual with sha1, Geyser, and restart gotchas. Use when changing pack styles, bumping the MC version, or re-deploying avatar visuals.
---

# Deploy the ClawdCraft resource packs

Order matters: **build → release → Geyser copy → server.properties sha1 →
restart → verify → only then `avatarModel: "crab"`**. STRATEGY.md escalation
rules apply — steps marked ESCALATE need explicit user go-ahead.

## 1. Build (safe, local)

```bash
cd packs/tools && python3 build_packs.py --mc-version <server version> --style crab
```

- Server version: `node bridge/rcon.js "version"` (read-only) or the Paper jar
  name in `/home/pi/minecraft_server/`.
- Outputs land in `packs/build/` (gitignored, disposable):
  `clawdcraft-java.zip`, `clawdcraft-bedrock.mcpack`, `preview_front.png`.
- Eyeball `preview_front.png` — it should look like the crab mascot
  (`packs/reference/clawd.webp`). The script prints the java zip's **sha1** —
  save it for step 4.
- Styles: `crab` (default; wild allays untouched, needs config flag later),
  `classic` (recolor of ALL allays, no config flag needed).

## 2. Publish the Java pack — ESCALATE (public release)

Clients download the Java pack from a URL; the GitHub release is the host:

```bash
gh release create v<X.Y.Z> packs/build/clawdcraft-java.zip packs/build/clawdcraft-bedrock.mcpack --title "..." --notes "..."
```

This is public publishing — get user approval, check nothing sensitive is in
the assets. Existing convention: releases v0.1.0/v0.2.0/v0.2.1 on
adrianwedd/clawdcraft. Rebuilding locally does NOT update what clients
download — only a new release + step 4 does.

## 3. Bedrock copy — ESCALATE (writes into the live server tree)

```bash
cp packs/build/clawdcraft-bedrock.mcpack /home/pi/minecraft_server/plugins/Geyser-Spigot/packs/
```

Geyser only loads packs at server start — no effect until step 5.

## 4. Java server.properties — ESCALATE (live server config)

In `/home/pi/minecraft_server/server.properties` set:

- `resource-pack=` → the release asset's **direct download URL**
- `resource-pack-sha1=` → the sha1 printed in step 1
  (or `sha1sum packs/build/clawdcraft-java.zip`)

**sha1 mismatch fails silently** — clients keep the cached old pack with no
error. Never skip updating the sha1.

## 5. Restart the Minecraft server — ESCALATE (kicks live players)

User's call on timing. Afterwards `sudo systemctl status clawd` — the bridge
should reconnect on its own (`Restart=always`).

## 6. Verify

- Java player rejoins, accepts pack prompt → crab visible.
- Bedrock (Geyser) player rejoins → allay named "Clawd" is a crab; **wild
  allays must look vanilla on BOTH editions** (the v0.2.1 regression).
- `journalctl -u clawd -n 30` — no RCON errors.

## 7. Flip the avatar model (crab style only)

Only AFTER packs are verified live: set `"avatarModel": "crab"` in
`config.json`, then `sudo systemctl restart clawd`. Flipping it early shows
Java players a broken purple cube next to a still-visible allay
(bridge/avatar.js header). `classic` style: leave `avatarModel` as `"allay"`.
