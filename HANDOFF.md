# HANDOFF — state as of 2026-08-08 (sixth session)

Context for the next Claude session picking this up. **Read STRATEGY.md
first** — executor doctrine: file authority, invariants, escalation triggers,
verification order. Feature direction lives in **ROADMAP.md** (one GitHub
issue per item). **This repo is the live install**: `clawd.service` runs
`/home/pi/clawdcraft/bridge/clawd.js` with
`WorkingDirectory=/home/pi/clawdcraft`; Clawd's brain tmux session launches
from `session/clawd_session.sh` with repo-relative pre-approved tools.

Public repo: https://github.com/adrianwedd/clawdcraft (resource packs hosted
on the **v0.2.5** release). main is pushed and in sync with origin. The old
copy at `/home/pi/minecraft_server/bot/` is retired — don't edit it, but note
it is still load-bearing: `minecraft.service`'s `ExecStop` calls
`bot/stop.sh`. Don't delete the directory.

## Live state at handoff (verified 2026-08-08 ~11:05)

Both services active, zero errors in the Minecraft log after the final
restart. Java crab verified rendering in game on a 26.2 client; Bedrock crab
working throughout. `npm test` 69/69, all `bridge/*.js` pass `node --check`,
RCON guard canary refuses with exit 2. Clawd's brain survived every restart
(`KillMode=process`) and answered a live `--test`.

## The headline: players' clients are now NEWER than the server

**Obi's/the user's Java client auto-updated to 26.2** (protocol 776) and joins
the 1.21.11 server (774) through ViaVersion. This is the new normal and it
broke the crab in two independent ways. Both are fixed, but the next MC
version will re-open the same class of bug.

1. **The pack would not load.** `pack.mcmeta` declared a bare
   `pack_format: 75`. Modern clients want **`min_format`/`max_format`** — the
   spelling vanilla's own built-in packs use (`"max_format": 107,
   "min_format": [107, 1]` in 26.2's datapacks; 1.21.11 uses the same schema
   with 94). With only `pack_format` the pack reads as **red/incompatible**.
   Fixed v0.2.4. `build_packs.py --max-mc-version` controls the upper bound.
2. **The model was rejected.** The crab model carried
   `"texture_size": [64, 64]` with raw 64-space UVs. **26.2 rejects that on
   item models**, and a rejected model IS the magenta/black cube — with the
   carrier allay still visible inside it. UVs are now in vanilla 16x16 space
   (scaled by 16/64) with no `texture_size`. Fixed v0.2.5.

Fixing (1) alone changed nothing visible, because (2) was waiting behind it —
that is why v0.2.2/v0.2.3 looked like failures.

## Since the last HANDOFF (2026-07-07 → 2026-08-08)

- **Java pack fixed for 26.x clients** (v0.2.4 + v0.2.5), as above.
- **Bedrock manifest UUIDs pinned** in `build_packs.py`. They were
  `uuid.uuid4()` per build, so every rebuild read as a *different* pack and
  forced every Bedrock client to re-download, leaving stale copies in their
  pack list. Now pinned to the UUIDs already deployed; bump `BEDROCK_VERSION`
  to ship changed content instead. Bedrock pack content is unchanged since
  v0.2.1.
- **`--test` no longer clobbers the companion depot map.** `setTarget()` saves
  `companion_data.json`, but `--test` builds a short-lived bridge that never
  calls `start()`/`loadState()`, so the empty module default was written over
  the real file. Observed live: a `--test` run dropped a 2-cell depot to 0
  (those two cells are gone; they re-populate as Clawd tidies). `saveState()`
  now loads-then-merges.
- **Geyser 2.11.0 → 2.11.1-b1210**, checksum-verified.
- **WorldEditSelectionVisualizer 2.1.9 → 2.1.10.**
- **FAWE update attempted and ROLLED BACK** — see field notes.
- **`UPGRADE-26x.md` added** — scoping for a real 1.21.11 → 26.x migration.
  Recommendation: not yet.

## What exists and works

Unchanged from the fifth session except where noted above — core loop
(`clawd.service` → `bridge/clawd.js` → tmux `clawd` → `say.js`/`rcon.js`/
`gift.js`/`memory.js`), injection hardening (`holdClient()`), RCON denylist
(`bridge/rcon_guard.js`, 54 offline cases), selective op echo
(`CLAWD_RCON_ECHO=1`), `--dry` mode, per-player chat budget
(`bridge/chat_budget.js`, 15 cases), companion + ambient, crab avatar on both
editions, project skills (`mc-smoke-test`, `deploy-packs`).

## Next session plan (in order)

1. **Ambient in anger** (issue #12, human-gated) — still not enabled; an op
   must say `clawd listen on`.
2. **Brain-turn metering + `clawd usage`** (issue #6).
3. **Watchdog** (issue #7).
4. **Prompt line: refusals are final** (issue #11, needs explicit go-ahead).

Everything else: ROADMAP.md.

## Field notes / gotchas (hard-won)

Fifth-session notes still apply in full (prompt reload needs
`tmux kill-session`; companion cross-dimension tp gated on `if loaded`;
brain-hang tell is a frozen statusline timestamp; tmux 3.3a send-keys needs an
attached client; `/summon` into an unloaded chunk succeeds invisibly;
rcon-client `end()` rejects when not connected; snake_case gamerules;
EssentialsX shadows `tp`/`kill`/`gamerule`; tp dismounts passengers;
`enforce-secure-profile=false`; guard canary; orphaned `tail -F`; piped
interactive rcon race; zsh eats `=word`). New this session:

- **NEVER put `texture_size` in the Java item model.** It renders on 1.21.11
  and is rejected outright by 26.2, which shows as the magenta cube. Vanilla
  still uses `texture_size` on some *block* models in 26.2, so it looks
  item-model-specific — that asymmetry makes it very tempting to "restore".
  Don't. Express UVs in 16x16 space.
- **A magenta/black cube means the MODEL failed, not the texture.** A missing
  *texture* paints the checkerboard onto the correct crab silhouette; a
  missing/rejected *model* is a full cube. That distinction is the fastest
  triage step.
- **`pack.mcmeta` needs `min_format`/`max_format`.** Do not also ship a stale
  `pack_format` — vanilla packs carry none. Verify the schema against the
  client jar (`build/cache/client-*.jar`, `version.json` → `pack_version`)
  rather than assuming.
- **EssentialsX also shadows `give` and `clear`** — `give ...[components]`
  fails with "Unknown item name". Always `minecraft:give`, `minecraft:clear`.
- **The in-game Resource Packs list DOES show server-sent packs.** Seeing the
  pack there does not mean it was installed manually. `~/Library/Application
  Support/minecraft/resourcepacks/` being empty is normal and correct.
- **`require-resource-pack=true` is a free diagnostic**: a client that
  declines *or fails* the pack gets kicked. Nobody kicked ⇒ the client
  reported the pack as successfully applied.
- **Bisect pack problems with probe items**, don't guess-and-release. Add
  extra item defs to a throwaway pack and
  `minecraft:give <p> minecraft:paper[minecraft:item_model="ns:probe"]`, with
  `minecraft:custom_name` labels so variants are distinguishable in the
  inventory. Three probes (vanilla-parented model / our texture via
  `item/generated` / the real model) pinned the failure to one file in one
  round.
- **`gh release create asset#rename` does NOT rename the asset.** The upload
  keeps its original filename, so a URL built from the intended name 404s and
  `curl` writes a few-byte error page. **Always re-download the published
  asset and compare sha1** before pointing `server.properties` at it.
- **FAWE 2.15.3 requires Java 25** (`UnsupportedClassVersionError`, class file
  69.0 vs 65.0) and takes WorldEdit down with it when it fails to load.
  Rolled back to `2.15.1-SNAPSHOT-1271`; the update nag in the console is
  expected and NOT actionable. FAWE's update and the 26.x migration are now
  the same Java-25-gated project.
- **Verify a client's real version with `viaversion list`** over RCON
  (read-only) rather than assuming it matches the server.
- **Check the join log before trusting a "still broken" report** — confirm the
  player actually rejoined after the restart that deployed the fix
  (`grep "joined the game" logs/latest.log` against the `Done (` line).
- **The bridge logs in UTC while journald stamps local (AEST)** — a 10-hour
  offset that makes log correlation confusing. Not yet fixed.

## Known drift (reported, not silently fixed)

- **STRATEGY.md §6 says "No test suite exists (OBSERVED)"** — false since the
  fifth session; `cd bridge && npm test` runs 69 cases.
- **`bridge/avatar.js:4-5`** says the Java pack "turns the allay itself
  invisible". It does not — there are no vanilla overrides in the crab-style
  pack; the enclosing 1.2x crab is what hides the allay (correctly described
  at line 26). This stale comment is why the allay-outline-inside-the-cube
  symptom was initially confusing.

## Things NOT to do

- Don't point `tmuxSession` at the user's personal `claude` tmux session.
- Don't put enforcement of gifts/limits/denylists in the prompt — code only.
- Don't commit `config.json`, `companion_data.json`, `seen_players.json`, or
  anything containing the RCON password.
- Don't edit `/home/pi/minecraft_server/bot/` — retired, but don't delete it
  either (`minecraft.service` `ExecStop` uses `bot/stop.sh`).
- Don't re-enable AI on the allay (y=261 incident).
- Don't verify with `--test` casually — real chat, real tokens. `--dry` first.
- Don't re-add `texture_size` or `pack_format` to the Java pack.
- Don't regenerate the Bedrock manifest UUIDs.
- Don't update FAWE until the server is on Java 25.
