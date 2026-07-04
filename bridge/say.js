#!/usr/bin/env node
// say.js — speak as Clawd in game chat (used by the Clawd tmux session).
// Usage: node bridge/say.js [--emote happy|think|alert|sad|magic] "message"
//
// Sends a gold <Clawd> tellraw to everyone, clears the avatar's thinking-glow,
// and plays an emote: particles + sound + (for some) a little hop. All effects
// are cross-platform (Bedrock via Geyser can't see glowing outlines, but sees
// particles and hears sounds).

const CFG = require("./config");
const { createRcon, sleep } = require("./rcon_helper");
const avatar = require("./avatar");

const AVATAR = `@e[type=minecraft:allay,tag=${CFG.avatarTag},limit=1]`;

const EMOTES = {
  happy: { particle: "minecraft:heart",   count: 6,  sound: "minecraft:entity.allay.item_given",   pitch: 1.2, hop: true },
  think: { particle: "minecraft:enchant", count: 25, sound: "minecraft:block.amethyst_block.chime", pitch: 0.8 },
  alert: { particle: "minecraft:crit",    count: 12, sound: "minecraft:block.note_block.pling",     pitch: 1.8, hop: true },
  sad:   { particle: "minecraft:splash",  count: 10, sound: "minecraft:entity.allay.hurt",          pitch: 0.7 },
  magic: { particle: "minecraft:end_rod", count: 20, sound: "minecraft:entity.evoker.cast_spell",   pitch: 1.3, hop: true },
};

function sanitize(text) {
  return text
    .replace(/§./g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function chunk(text, max = 400) {
  const out = [];
  for (const line of text.split(/\n+/)) {
    let rest = line.trim();
    while (rest.length > max) {
      let cut = rest.lastIndexOf(" ", max);
      if (cut < max * 0.5) cut = max;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

async function playEmote(rcon, emote) {
  const e = EMOTES[emote];
  if (!e) return;
  await rcon.sendRL(`execute at ${AVATAR} run particle ${e.particle} ~ ~0.6 ~ 0.3 0.3 0.3 0.02 ${e.count}`);
  await rcon.sendRL(`execute at ${AVATAR} run playsound ${e.sound} neutral @a ~ ~ ~ 1 ${e.pitch}`);
  if (e.hop) {
    // NB: minecraft:tp — bare tp is shadowed by EssentialsX
    await rcon.sendRL(`execute as ${AVATAR} at @s run minecraft:tp @s ~ ~0.3 ~`);
    if (avatar.crab) await rcon.sendRL(avatar.skinSyncCmd);
    await sleep(200);
    await rcon.sendRL(`execute as ${AVATAR} at @s run minecraft:tp @s ~ ~-0.3 ~`);
    if (avatar.crab) await rcon.sendRL(avatar.skinSyncCmd);
  }
}

(async () => {
  const args = process.argv.slice(2);
  let emote = "happy";
  if (args[0] === "--emote") {
    if (!EMOTES[args[1]]) {
      console.error(`unknown emote '${args[1]}' — one of: ${Object.keys(EMOTES).join(", ")}`);
      process.exit(1);
    }
    emote = args[1];
    args.splice(0, 2);
  }
  const text = sanitize(args.join(" "));
  if (!text) {
    console.error('usage: node say.js [--emote happy|think|alert|sad|magic] "message"');
    process.exit(1);
  }
  const rcon = createRcon();
  await rcon.connect();
  for (const part of chunk(text)) {
    await rcon.sendRL(
      `tellraw @a ["",{"text":"<Clawd> ","color":"gold","bold":true},${JSON.stringify({ text: part, color: "yellow" })}]`
    );
  }
  await rcon.sendRL(`effect clear ${AVATAR} minecraft:glowing`);
  await playEmote(rcon, emote);
  rcon.end();
  console.log(`said (${emote}): ${text}`);
})().catch((e) => {
  console.error(`say.js failed: ${e.message}`);
  process.exit(1);
});
