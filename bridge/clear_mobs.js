#!/usr/bin/env node
// clear_mobs.js — kill nearby hostile/other mobs of one type around a player.
// Usage: node bridge/clear_mobs.js <player> <mobType> [radius] [max]
//
// rcon_guard.js refuses any kill/tp command whose @e selector isn't tight
// (limit=1, name=, or type=+tag=) — `type=` alone is NOT enough, and plain
// `kill`/`tp` are shadowed by EssentialsX and silently misparse selectors as
// "Player not found", so this always sends `minecraft:kill` with a
// `limit=1` selector, once per loop iteration (see
// memory/feedback_rcon_kill_selectors.md for how this was discovered).
//
// RCON responses for a no-op kill (no matching entity) are unreliable —
// sometimes an error string, sometimes empty (per CLAUDE.md: "failed
// commands often return an empty string over RCON") — so this doesn't try
// to detect "nothing left to kill" and break early. It just loops a bounded
// `max` times; a kill against an empty selector match is a harmless no-op.

const { createRcon } = require("./rcon_helper");

const DEFAULT_RADIUS = 30;
const DEFAULT_MAX = 20;

(async () => {
  const [player, rawMob, rawRadius, rawMax] = process.argv.slice(2);
  if (!player || !rawMob) {
    console.error("usage: node clear_mobs.js <player> <mobType> [radius] [max]");
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_.]{1,32}$/.test(player)) {
    console.error(`refused: invalid player name '${player}'`);
    process.exit(1);
  }
  const mob = rawMob.replace(/^minecraft:/, "");
  if (!/^[a-z_]{1,32}$/.test(mob)) {
    console.error(`refused: invalid mob type '${rawMob}'`);
    process.exit(1);
  }
  const radius = Math.max(1, Math.min(128, parseInt(rawRadius || String(DEFAULT_RADIUS), 10) || DEFAULT_RADIUS));
  const max = Math.max(1, Math.min(100, parseInt(rawMax || String(DEFAULT_MAX), 10) || DEFAULT_MAX));

  const rcon = createRcon();
  await rcon.connect();

  let killed = 0;
  for (let i = 0; i < max; i++) {
    const r = await rcon.sendRL(
      `execute at ${player} run minecraft:kill @e[type=minecraft:${mob},distance=..${radius},limit=1]`
    );
    if (/killed/i.test(r || "")) killed++;
  }
  rcon.end();
  console.log(`cleared ${killed} x ${mob} within ${radius} blocks of ${player} (${max} attempts)`);
})().catch((e) => {
  console.error(`clear_mobs.js failed: ${e.message}`);
  process.exit(1);
});
