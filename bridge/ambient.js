// ambient.js — Clawd noticing the world: proximity chat + world-event reactions.
//
// Both are OPTIONAL (config "proximity" / "events" sections) and relay softer
// prompts to the brain than direct "clawd ..." chat. The prompt teaches Clawd
// "may notice, not must reply": react with one short say.js line when it's
// useful/funny/tender, otherwise do nothing. Cooldowns and hourly caps here
// are the token budget — every relay costs a brain turn.
//
//   Proximity chat  Ordinary chat (no "clawd" prefix) spoken within
//                   proximity.radius blocks of the avatar is relayed as
//                   `[MC overheard near Clawd] <Name> (role): msg`.
//                   Off by default at runtime; ops toggle with
//                   `clawd listen on|off|status` (state: ambient_ctl.json).
//
//   Event reactions Joins (first-ever joins get a 100% relay), advancements,
//                   and deaths from the server log are relayed as
//                   `[MC event] ...` with a CraftGPT-style % chance each.
//
// Deaths have no log prefix, so we track online players (seeded via `list`,
// updated by join/leave lines) and match lines that start with a known name.

const fs = require("fs");
const path = require("path");
const CFG = require("./config");

const CTL_FILE = path.join(CFG.root, "ambient_ctl.json");
const MEMORY_DIR = path.join(CFG.root, "clawd_memory");

const PROX = {
  radius: 12,
  playerCooldownMs: 60_000,
  globalCooldownMs: 15_000,
  maxPerHour: 20,
  ...(CFG.proximity || {}),
};
const EVTS = {
  cooldownMs: 45_000,
  maxPerHour: 15,
  chance: { join: 50, firstJoin: 100, advancement: 80, death: 60, leave: 0 },
  ...(CFG.events || {}),
};
const proxEnabled = !!(CFG.proximity && CFG.proximity.enabled !== false);
const evtsEnabled = !!(CFG.events && CFG.events.enabled !== false);

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}] [ambient]`, ...a);

let rc = null;      // rcon send fn
let inject = null;  // fn(text) -> Promise<bool>: type into the brain session

// ─── Runtime listen toggle (ops: "clawd listen on|off|status") ──────────────
function listening() {
  try { return !!JSON.parse(fs.readFileSync(CTL_FILE, "utf8")).listen; } catch { return false; }
}
function setListening(on) {
  fs.writeFileSync(CTL_FILE, JSON.stringify({ listen: !!on, ts: new Date().toISOString() }));
  log(`proximity listening ${on ? "ON" : "OFF"}`);
}

// ─── Budget: cooldowns + hourly caps ─────────────────────────────────────────
const last = { prox: 0, proxByPlayer: {}, evt: 0 };
const hourly = { prox: { n: 0, since: 0 }, evt: { n: 0, since: 0 } };

function budgetOk(kind, player) {
  const now = Date.now();
  const h = hourly[kind];
  if (now - h.since > 3_600_000) { h.n = 0; h.since = now; }
  if (kind === "prox") {
    if (h.n >= PROX.maxPerHour) return false;
    if (now - last.prox < PROX.globalCooldownMs) return false;
    if (now - (last.proxByPlayer[player] || 0) < PROX.playerCooldownMs) return false;
  } else {
    if (h.n >= EVTS.maxPerHour) return false;
    if (now - last.evt < EVTS.cooldownMs) return false;
  }
  return true;
}
function budgetSpend(kind, player) {
  const now = Date.now();
  hourly[kind].n++;
  if (kind === "prox") { last.prox = now; last.proxByPlayer[player] = now; }
  else last.evt = now;
}

// ─── Proximity chat ──────────────────────────────────────────────────────────
async function onChat(player, role, message) {
  if (!rc || !inject) return; // not started (e.g. --test mode)
  if (!proxEnabled || !listening()) return;
  if (!budgetOk("prox", player)) return;
  const q = `@a[name="${player.replace(/["\\]/g, "")}",limit=1]`;
  const near = await rc(
    `execute as ${q} at @s if entity @e[type=minecraft:allay,tag=${CFG.avatarTag},distance=..${PROX.radius}]`
  );
  if (!/Test passed/i.test(near || "")) return;
  budgetSpend("prox", player);
  log(`overheard ${player}: "${message.slice(0, 60)}"`);
  await inject(`[MC overheard near Clawd] <${player}> (${role}): ${message}`);
}

// ─── World events ────────────────────────────────────────────────────────────
const online = new Set();

// Vanilla death messages start with the player name + one of these.
const DEATH_RE = /^(was|drowned|experienced|blew up|hit the ground|fell|went (up in flames|off)|walked (into|off)|burned|tried to swim|discovered|froze|starved|suffocated|withered|died|left the confines|didn't want|got |succumbed)/;

function chance(kind) {
  const pct = EVTS.chance[kind] ?? 0;
  return Math.random() * 100 < pct;
}

async function relayEvent(kind, text) {
  if (!evtsEnabled || !chance(kind) || !budgetOk("evt")) return;
  budgetSpend("evt");
  log(`event (${kind}): ${text}`);
  await inject(`[MC event] ${text}`);
}

async function onLine(line) {
  if (!rc || !inject) return; // not started (e.g. --test mode)
  const m = line.match(/INFO\]: (.+)$/);
  if (!m) return;
  const body = m[1];

  let j = body.match(/^(.+) joined the game$/);
  if (j) {
    const player = j[1];
    online.add(player);
    const known = fs.existsSync(path.join(MEMORY_DIR, `${player}.json`));
    await relayEvent(known ? "join" : "firstJoin",
      known
        ? `${player} just joined the game`
        : `${player} just joined the game for the FIRST time ever — a brand new player!`);
    return;
  }
  const l = body.match(/^(.+) left the game$/);
  if (l) {
    online.delete(l[1]);
    await relayEvent("leave", `${l[1]} just left the game`);
    return;
  }
  const a = body.match(/^(.+?) has (made the advancement|completed the challenge|reached the goal) \[(.+)\]$/);
  if (a) {
    await relayEvent("advancement", `${a[1]} just ${a[2] === "completed the challenge" ? "completed the challenge" : "earned the advancement"} "${a[3]}"`);
    return;
  }
  // Deaths: known online player name followed by a death phrase.
  for (const p of online) {
    if (body.startsWith(p + " ") && DEATH_RE.test(body.slice(p.length + 1))) {
      await relayEvent("death", `${p} just died: "${body}"`);
      return;
    }
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
async function start(rcFn, injectFn) {
  rc = rcFn;
  inject = injectFn;
  if (!proxEnabled && !evtsEnabled) { log("ambient disabled (no proximity/events config)"); return; }
  // Seed the online-players set (for death detection) from `list`.
  const res = (await rc("list")) || "";
  // "…players online." with no colon when empty; names after the last colon otherwise.
  const names = (res.includes(":") ? res.split(":").pop() : "")
    .replace(/§./g, "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const n of names) online.add(n);
  log(`ambient started (proximity: ${proxEnabled ? `r${PROX.radius}, listening ${listening() ? "ON" : "off"}` : "disabled"}; events: ${evtsEnabled ? "on" : "disabled"}; online: ${names.join(", ") || "none"})`);
}

module.exports = { start, onChat, onLine, listening, setListening, proxEnabled };
