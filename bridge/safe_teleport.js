#!/usr/bin/env node
// safe_teleport.js — teleport a player without fall damage.
// Usage: node bridge/safe_teleport.js <player> <x> <z> [y]
//
// Landing height at a distant x/z is rarely known in advance, and a player
// can wander mid-script, so this always teleports to a FIXED absolute
// position (never `execute at <player> run tp ~...~`, which drifts if the
// player moves between commands — see memory/feedback_relative_position_builds.md).
//
// If [y] is omitted, teleports high above the target (y=200) with
// slow_falling active so the player glides down onto whatever terrain is
// there, then polls position until it stabilizes to confirm a safe landing.

const { createRcon, sleep } = require("./rcon_helper");

const FALL_Y = 200;
const SLOW_FALL_SECONDS = 45; // generous margin: y=200 -> ~y=60 takes longer than it looks
const POLL_INTERVAL_MS = 6000;
const MAX_POLLS = 14; // ~84s, comfortably covers SLOW_FALL_SECONDS

(async () => {
  const [player, rawX, rawZ, rawY] = process.argv.slice(2);
  if (!player || rawX === undefined || rawZ === undefined) {
    console.error("usage: node safe_teleport.js <player> <x> <z> [y]");
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_.]{1,32}$/.test(player)) {
    console.error(`refused: invalid player name '${player}'`);
    process.exit(1);
  }
  const x = Number(rawX), z = Number(rawZ);
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    console.error("refused: x/z must be numbers");
    process.exit(1);
  }
  const explicitY = rawY !== undefined ? Number(rawY) : null;
  if (rawY !== undefined && !Number.isFinite(explicitY)) {
    console.error("refused: y must be a number");
    process.exit(1);
  }

  const rcon = createRcon();
  await rcon.connect();

  const targetY = explicitY !== null ? explicitY : FALL_Y;
  if (explicitY === null) {
    // only a high-y unknown-terrain drop needs the slow-fall cushion —
    // an explicit y is the caller's already-safe destination.
    await rcon.sendRL(`effect give ${player} minecraft:slow_falling ${SLOW_FALL_SECONDS} 1 true`);
  }
  const tpResult = await rcon.sendRL(`minecraft:tp ${player} ${x} ${targetY} ${z}`);
  console.log(tpResult);

  if (explicitY !== null) {
    rcon.end();
    return;
  }

  console.log("waiting for landing...");
  let prev = null;
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS);
    const pos = await rcon.sendRL(`data get entity ${player} Pos`);
    console.log(pos);
    if (!/\[.*\]/.test(pos || "")) {
      console.log("lost track of player (offline or entity data unavailable) — stopping poll.");
      rcon.end();
      return;
    }
    if (pos === prev) {
      console.log("landed.");
      rcon.end();
      return;
    }
    prev = pos;
  }
  console.log("gave up waiting for landing to stabilize (still descending or player moved away).");
  rcon.end();
})().catch((e) => {
  console.error(`safe_teleport.js failed: ${e.message}`);
  process.exit(1);
});
