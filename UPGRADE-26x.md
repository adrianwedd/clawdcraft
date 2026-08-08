# Scoping: Minecraft 1.21.11 → 26.x

Investigated 2026-08-08. **No migration performed** — this is the cost/risk
scope only. Current server stays on Paper 1.21.11 build 132 (which is the
latest build on that line; there is no pending patch update).

## Version landscape

| | current | 26.1.2 | 26.2 |
|---|---|---|---|
| Paper build | 1.21.11-132 (STABLE, 2026-05-11) | 74 (STABLE, 2026-07-06) | 111 (STABLE, 2026-08-07) |
| Mojang status | superseded | superseded | **current release** |
| protocol | 774 | — | 776 |
| world_version | 4671 | — | 4903 |
| resource pack_format | 75 | — | **88** |
| data pack_format | 94 | — | 107 |
| **Java required** | 21 | — | **25** |

Minecraft switched to calendar versioning after 1.21.11; 26.2 is the current
release, 26.3 is in snapshot.

## Hard blockers (must be done first, in order)

1. **Java 25.** The server currently runs Temurin 21
   (`/usr/lib/jvm/temurin-21-jdk-arm64`, pinned in `minecraft.service`
   `ExecStart`). 26.x requires Java 25. `temurin-25-jdk` is available in apt on
   this Pi. Installing it is additive (21 stays), but `minecraft.service` must
   be edited to point at the new JVM path.
2. **World migration is one-way.** world_version 4671 → 4903. Once the world
   loads on 26.x it cannot be opened by 1.21.11 again. Full backup of
   `/home/pi/minecraft_server/world*` before first boot, verified restorable —
   not just the DriveBackupV2 job.
3. **Client updates.** Every Java player must update to 26.2 (protocol 776);
   1.21.11 clients will be refused unless ViaBackwards is in play. Bedrock
   players are insulated by Geyser.

## ClawdCraft-specific work

- **Resource packs must be rebuilt and re-released.** `pack_format` 75 → 88 in
  `pack.mcmeta`. `packs/tools/build_packs.py` already derives this from the
  client jar's `version.json`, so `--mc-version 26.2` should pick it up
  automatically — but the build downloads a client jar and the vanilla allay
  texture path may have moved, so the `--style classic` path needs checking.
  After rebuild: new GitHub release, new `resource-pack` URL **and new
  `resource-pack-sha1`** in `server.properties`. Follow the `deploy-packs`
  skill ritual — the sha1 must be updated or every Java client silently fails
  the pack download.
- **Bedrock pack** `min_engine_version` is `[1,20,0]` and should be reviewed
  against whatever Bedrock version Geyser 2.11.x negotiates.
- **`bridge/avatar.js` NBT needs re-verification.** `CustomName:"Clawd"` SNBT
  parsing and the `minecraft:item_model` component (`clawdcraft:clawd`) are
  both version-sensitive surfaces that have changed before in the 1.21.x line.
  The Bedrock crab render controller keys on `query.get_name == 'Clawd'`, so a
  change in how CustomName round-trips breaks the Bedrock crab silently.
- **`item_display` / `billboard` / `teleport_duration`** NBT on the crab skin —
  re-verify, these are the newest and least stable parts of the avatar.
- **1.21.11 gotchas to re-test**, not assume: snake_case gamerules, EssentialsX
  shadowing `tp`/`kill`/`gamerule` even inside `execute ... run`.

## Plugin compatibility

Geyser is already ahead of us: the 2.11.1 changelog explicitly references
"Paper 26.2 build 104+", so Geyser/Floodgate are 26.x-ready today. The rest of
the stack needs a per-plugin check before any attempt — the current set is:

Chunky 1.4.40, CraftGPT 0.3.1, DriveBackupV2 1.8.1, EssentialsX 2.22.0,
FastAsyncWorldEdit 2.15.1, Geyser 2.11.1, Floodgate 2.2.5-b138,
minimotd 2.2.4, Multiverse-Core 5.7.3 / Inventories 5.3.5 / NetherPortals 5.1.0
/ Portals 5.2.3, PlaceholderAPI 2.12.3, Plan 5.8, PluginPortal 3.0.7,
tabtps 1.4.1, ViaAprilFools 4.2.2, ViaBackwards 5.11.0, ViaVersion 5.11.0,
WorldEditSelectionVisualizer 2.1.9.

**Highest risk:** Multiverse (4 plugins, and the companion depot lives in the
custom world `minecraft:obi` — a Multiverse world), FastAsyncWorldEdit
(NMS-heavy, always last to update), and CraftGPT 0.3.1 (small project, may
simply never update). Losing Multiverse would strand the companion depot.

## Recommendation

Not yet, and not for a small gain. 1.21.11 is already fully patched, the whole
plugin stack is current on it, and the crab avatar is verified working. The
migration costs a Java upgrade, a one-way world conversion, a pack re-release,
a re-verification pass over every avatar NBT surface, and a client update for
the kids — against no feature we currently want.

**Revisit trigger:** when Multiverse, FastAsyncWorldEdit and CraftGPT all ship
26.x builds, or when a 26.x feature is actually wanted. At that point do it on
a *copy* of the world on a staging port, not in place.
