// companion.js — Clawd's body: follow + tidy-up behaviors for the allay avatar.
//
// Started by clawd.js (shares its RCON connection). Optional: runs only when
// the config has a "companion" section (see config.example.json). Two modes,
// switched automatically every tick:
//
//   FOLLOW  While the player who last talked to Clawd is online, the allay
//           glides along beside them (smooth stepped teleports, always facing
//           the player). Cross-world and long-range gaps snap-teleport.
//   ROAM    When that player logs off (or nobody has spoken yet), the allay
//           flies home to its depot platform and patrols the area, hunting
//           dropped items. Each item is teleported above the hopper of the
//           chest assigned to its item type — new types get a fresh
//           chest+hopper+sign cell allocated on the spot. Items within 8
//           blocks of any player are never taken.
//
// Control file (written by companion_ctl.js, read every tick):
//   <repo root>/companion_ctl.json  {"mode":"auto"|"stay"|"home"}
//     auto  normal behavior          stay  freeze (no movement at all)
//     home  roam/collect only, even if the last player is online
//
// State (<repo root>/companion_data.json): last target player + item-type →
// cell registry. Survives restarts.
//
// NB: EssentialsX shadows bare `tp` — always `minecraft:tp`. Absolute-coord
// teleports from console execute in the default world, so every absolute tp
// is wrapped in `execute in <dim>` / `execute at <player>`.

const fs = require("fs");
const path = require("path");
const CFG = require("./config");
const avatar = require("./avatar");

// ─── Tuning ──────────────────────────────────────────────────────────────────
const TICK_MS = 850;          // behavior tick; each tick issues 2-6 rcon cmds
const FOLLOW_DIST = 2.1;      // hover this far beside the player…
const FOLLOW_Y = 2.0;         // …and this far above their feet
const STEP_MAX = 2.4;         // max blocks moved per tick (glide speed)
const SEEK_RADIUS = 32;       // item search radius around the allay
const PLAYER_GUARD = 8;       // never take items this close to any player

// ─── Server-specific placement (from config "companion" section) ────────────
const enabled = !!(CFG.companion && CFG.companion.enabled !== false && CFG.companion.dim && CFG.companion.depot);
const DIM = enabled ? CFG.companion.dim : null;
const DEPOT = enabled ? CFG.companion.depot : null;
const ROAM = enabled ? CFG.companion.roam : null;
// Used in chat lines: "my depot <hint>", e.g. "east of the garden".
const HINT = (enabled && CFG.companion.depotHint) || "at my home platform";

const TAG = CFG.avatarTag;
const AVATAR = `@e[type=minecraft:allay,tag=${TAG},limit=1]`;
const DATA_FILE = path.join(CFG.root, "companion_data.json");
const CTL_FILE = path.join(CFG.root, "companion_ctl.json");

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}] [companion]`, ...a);
// Always reference players via a name= selector: bare-name entity args can't
// be quoted, and Bedrock (Floodgate) names may contain spaces.
const q = (name) => `@a[name="${String(name).replace(/["\\]/g, "")}",limit=1]`;
const passed = (res) => /Test passed/i.test(res || "");
const parseCoords = (res) => {
  const m = (res || "").match(/-?\d+(?:\.\d+)?(?=d)/g);
  return m && m.length >= 3 ? { x: +m[0], y: +m[1], z: +m[2] } : null;
};

// ─── State ───────────────────────────────────────────────────────────────────
let rc = null;                // rcon send fn, injected by start()
let state = { lastTarget: null, cells: {} };
let tickNo = 0;
let idleEntered = false;
let waypoint = null;
let collected = { count: 0, since: 0, lastBrag: 0 };

function loadState() {
  try { state = { lastTarget: null, cells: {}, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }; } catch {}
}
function saveState() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2)); } catch (e) { log(`state save failed: ${e.message}`); }
}
function readCtl() {
  try { return JSON.parse(fs.readFileSync(CTL_FILE, "utf8")).mode || "auto"; } catch { return "auto"; }
}

function setTarget(player) {
  if (!enabled) return;
  if (state.lastTarget !== player) {
    state.lastTarget = player;
    saveState();
    log(`now following ${player}`);
  }
}

// ─── Movement ────────────────────────────────────────────────────────────────
// One glide step from `from` toward `to`; returns the next position.
function step(from, to) {
  const d = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const dist = Math.hypot(d.x, d.y, d.z);
  if (dist < 0.6) return null;
  const s = Math.min(STEP_MAX, 0.45 * dist + 0.3) / dist;
  return { x: from.x + d.x * s, y: from.y + d.y * s, z: from.z + d.z * s };
}
const fmt = (p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.z.toFixed(2)}`;

async function avatarPos() {
  return parseCoords(await rc(`data get entity ${AVATAR} Pos`));
}

// ─── Follow mode ─────────────────────────────────────────────────────────────
async function followTick(target) {
  const near = await rc(`execute as ${q(target)} at @s if entity @e[type=minecraft:allay,tag=${TAG},distance=..64]`);
  if (!passed(near)) {
    // Offline, far, or different world? Snap to them if online, else roam.
    if (!passed(await rc(`execute if entity ${q(target)}`))) return false;
    await rc(`execute at ${q(target)} run minecraft:tp ${AVATAR} ~1.5 ~2 ~1.5`);
    return true;
  }
  const [pPos, aPos] = [parseCoords(await rc(`data get entity ${q(target)} Pos`)), await avatarPos()];
  if (!pPos || !aPos) return true;
  // Hover point: FOLLOW_DIST horizontally away on the allay's current side.
  let dx = aPos.x - pPos.x, dz = aPos.z - pPos.z;
  const h = Math.hypot(dx, dz) || 1;
  const want = { x: pPos.x + (dx / h) * FOLLOW_DIST, y: pPos.y + FOLLOW_Y, z: pPos.z + (dz / h) * FOLLOW_DIST };
  const next = step(aPos, want);
  if (next) await rc(`execute at ${q(target)} run minecraft:tp ${AVATAR} ${fmt(next)} facing entity ${q(target)} eyes`);
  return true;
}

// ─── Depot cells ─────────────────────────────────────────────────────────────
function cellPos(i) {
  if (i >= DEPOT.cols * DEPOT.rows) return { x: DEPOT.overflow.x, z: DEPOT.overflow.z, overflow: true };
  return { x: DEPOT.x0 + (i % DEPOT.cols) * DEPOT.dx, z: DEPOT.z0 + Math.floor(i / DEPOT.cols) * DEPOT.dz };
}

async function cellFor(itemId) {
  if (itemId in state.cells) return cellPos(state.cells[itemId]);
  const i = Object.keys(state.cells).length;
  const c = cellPos(i);
  const label = c.overflow ? "odds & ends" : itemId.replace("minecraft:", "").replace(/_/g, " ");
  if (!c.overflow || !state.overflowBuilt) {
    await rc(`execute in ${DIM} run setblock ${c.x} ${DEPOT.y} ${c.z} minecraft:chest[facing=south] keep`);
    await rc(`execute in ${DIM} run setblock ${c.x} ${DEPOT.y + 1} ${c.z} minecraft:hopper keep`);
    const line1 = label.slice(0, 15), line2 = label.slice(15, 30);
    await rc(`execute in ${DIM} run setblock ${c.x} ${DEPOT.y} ${c.z + 1} minecraft:oak_wall_sign[facing=south]{front_text:{messages:['{"text":${JSON.stringify(line1)},"color":"dark_blue"}','{"text":${JSON.stringify(line2)}}','""','""']}}`);
    if (c.overflow) state.overflowBuilt = true;
  }
  state.cells[itemId] = i;
  saveState();
  log(`new cell #${i} (${c.x},${c.z}) for ${itemId}`);
  return c;
}

// ─── Roam & collect mode ─────────────────────────────────────────────────────
async function roamTick() {
  if (!idleEntered) {
    idleEntered = true;
    waypoint = null;
    await rc(`execute in ${DIM} run minecraft:tp ${AVATAR} ${DEPOT.home.x} ${DEPOT.home.y} ${DEPOT.home.z}`);
    return;
  }
  // Nobody online at all → nothing drops, chunks unload; idle cheaply.
  if (tickNo % 15 === 0 && !passed(await rc(`execute if entity @a`))) return;

  // Hunt: nearest reachable dropped item (skip-tagged ones are near players).
  await rc(`execute at ${AVATAR} run tag @e[type=minecraft:item,distance=..${SEEK_RADIUS},tag=!${TAG}_skip,limit=1,sort=nearest] add ${TAG}_c`);
  const itemPos = parseCoords(await rc(`data get entity @e[type=minecraft:item,tag=${TAG}_c,limit=1] Pos`));
  const aPos = await avatarPos();

  if (itemPos && aPos) {
    const dist = Math.hypot(itemPos.x - aPos.x, itemPos.y - aPos.y, itemPos.z - aPos.z);
    if (dist > 3) {
      const next = step(aPos, { x: itemPos.x, y: itemPos.y + 1.5, z: itemPos.z });
      if (next) await rc(`execute in ${DIM} run minecraft:tp ${AVATAR} ${fmt(next)} facing ${fmt({ ...itemPos, y: itemPos.y + 0.2 })}`);
    } else if (passed(await rc(`execute as @e[type=minecraft:item,tag=${TAG}_c,limit=1] at @s if entity @a[distance=..${PLAYER_GUARD}]`))) {
      await rc(`tag @e[type=minecraft:item,tag=${TAG}_c] add ${TAG}_skip`); // a player is near it — leave it be for a while
    } else {
      const id = ((await rc(`data get entity @e[type=minecraft:item,tag=${TAG}_c,limit=1] Item.id`)) || "").match(/"(minecraft:[a-z0-9_]+)"/)?.[1];
      if (id) {
        const c = await cellFor(id);
        await rc(`execute in ${DIM} run minecraft:tp @e[type=minecraft:item,tag=${TAG}_c,limit=1] ${c.x + 0.5} ${DEPOT.y + 2.3} ${c.z + 0.5}`);
        await rc(`execute at ${AVATAR} run playsound minecraft:entity.allay.item_taken neutral @a[distance=..24] ~ ~ ~ 0.6 1.2`);
        await rc(`execute at ${AVATAR} run particle minecraft:end_rod ~ ~0.3 ~ 0.2 0.2 0.2 0.02 8`);
        const now = Date.now();
        if (now - collected.since > 90_000) { collected.count = 0; collected.since = now; }
        if (++collected.count >= 6 && now - collected.lastBrag > 15 * 60_000) {
          collected.lastBrag = now;
          await rc(`tellraw @a ["",{"text":"<Clawd> ","color":"gold","bold":true},{"text":"*happy chirp* I tidied up a bunch of dropped things — they're sorted in my depot ${HINT}!","color":"yellow"}]`);
        }
      }
    }
  } else if (aPos) {
    // No items around: drift between random waypoints near home.
    if (!waypoint || Math.hypot(waypoint.x - aPos.x, waypoint.z - aPos.z) < 2 || tickNo % 40 === 0) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * ROAM.r;
      waypoint = { x: ROAM.x + Math.cos(a) * r, y: ROAM.yMin + Math.random() * (ROAM.yMax - ROAM.yMin), z: ROAM.z + Math.sin(a) * r };
    }
    const next = step(aPos, waypoint);
    if (next) await rc(`execute in ${DIM} run minecraft:tp ${AVATAR} ${fmt(next)} facing ${fmt(waypoint)}`);
  }
  await rc(`tag @e[type=minecraft:item,tag=${TAG}_c] remove ${TAG}_c`);
  if (tickNo % 200 === 0) await rc(`tag @e[type=minecraft:item] remove ${TAG}_skip`); // retry guarded items every ~3 min
}

// ─── Main loop ───────────────────────────────────────────────────────────────
async function tick() {
  tickNo++;
  const mode = readCtl();
  if (mode === "stay") return;

  if (tickNo % 20 === 1) {
    if (!passed(await rc(`execute if entity @e[type=minecraft:allay,tag=${TAG}]`))) {
      log("avatar missing — resummoning at home");
      if (avatar.crab) await rc(avatar.skinKillCmd);
      await rc(`execute in ${DIM} run summon minecraft:allay ${DEPOT.home.x} ${DEPOT.home.y} ${DEPOT.home.z} ${avatar.allayNbt}`);
    }
    if (avatar.crab && !passed(await rc(avatar.skinProbeCmd))) {
      log("crab skin missing — reattaching");
      await rc(avatar.skinSummonCmd);
    }
  }

  if (mode !== "home" && state.lastTarget) {
    if (await followTick(state.lastTarget)) {
      idleEntered = false;
      if (avatar.crab) await rc(avatar.skinSyncCmd);
      return;
    }
  }
  await roamTick();
  if (avatar.crab) await rc(avatar.skinSyncCmd);
}

function start(rcFn) {
  if (!enabled) {
    log("companion disabled (no \"companion\" section in config)");
    return;
  }
  rc = rcFn;
  loadState();
  log(`companion started (target: ${state.lastTarget || "none"}, ${Object.keys(state.cells).length} depot cells)`);
  const loop = async () => {
    try { await tick(); } catch (e) { log(`tick error: ${e.message}`); }
    setTimeout(loop, TICK_MS);
  };
  loop();
}

module.exports = { enabled, start, setTarget, depotHint: HINT };
