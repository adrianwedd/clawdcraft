#!/usr/bin/env node
// gift.js — give a small, allowlisted reward to a player (used by Clawd).
// Usage: node bridge/gift.js <player> <item> [count]
//
// The allowlist below is the ONLY enforcement point for what Clawd can hand
// out — keep it modest. Anything not listed (or over its cap) is refused here,
// in code, regardless of what the model was talked into.

const { createRcon } = require("./rcon_helper");

// item -> max count per gift
const ALLOWLIST = {
  cookie: 16, bread: 16, cooked_beef: 16, apple: 16, sweet_berries: 16,
  cake: 1, golden_apple: 2, honey_bottle: 4,
  emerald: 8, diamond: 3, amethyst_shard: 8, glow_ink_sac: 8,
  arrow: 32, ender_pearl: 4, experience_bottle: 8, firework_rocket: 12,
  name_tag: 1, saddle: 1, spyglass: 1, music_disc_cat: 1, music_disc_wait: 1,
};

(async () => {
  const [player, rawItem, rawCount] = process.argv.slice(2);
  const item = (rawItem || "").replace(/^minecraft:/, "");
  const count = Math.max(1, parseInt(rawCount || "1", 10) || 1);

  if (!player || !item) {
    console.error("usage: node gift.js <player> <item> [count]");
    console.error(`allowed items: ${Object.keys(ALLOWLIST).join(", ")}`);
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_.]{1,32}$/.test(player)) {
    console.error(`refused: invalid player name '${player}'`);
    process.exit(1);
  }
  if (!(item in ALLOWLIST)) {
    console.error(`refused: '${item}' is not on the gift allowlist. Allowed: ${Object.keys(ALLOWLIST).join(", ")}`);
    process.exit(1);
  }
  if (count > ALLOWLIST[item]) {
    console.error(`refused: max ${ALLOWLIST[item]} x ${item} per gift (asked for ${count})`);
    process.exit(1);
  }

  const rcon = createRcon();
  await rcon.connect();
  const r = await rcon.sendRL(`minecraft:give ${player} minecraft:${item} ${count}`);
  if (/No player was found|Expected|Unknown/i.test(r)) {
    console.error(`give failed: ${r.replace(/§./g, "")}`);
    rcon.end();
    process.exit(1);
  }
  await rcon.sendRL(`execute at ${player} run particle minecraft:totem_of_undying ~ ~1 ~ 0.4 0.5 0.4 0.1 30`);
  await rcon.sendRL(`execute at ${player} run playsound minecraft:entity.player.levelup player @a ~ ~ ~ 1 1.4`);
  rcon.end();
  console.log(`gifted ${count} x ${item} to ${player}`);
})().catch((e) => {
  console.error(`gift.js failed: ${e.message}`);
  process.exit(1);
});
