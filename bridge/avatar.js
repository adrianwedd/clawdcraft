// avatar.js — how Clawd's in-world body is summoned and skinned.
//
// avatarModel "allay" (default): the plain (retextured-by-pack) allay.
// avatarModel "crab": Java players see a crab item_display (model
//   clawdcraft:clawd from the Java pack, which also turns the allay itself
//   invisible); Bedrock players see the crab via the Bedrock pack's custom
//   allay geometry and don't see item displays at all. One allay + one
//   display = one crab on both editions.
//
//   The display CANNOT ride the allay: teleporting a vehicle dismounts its
//   passengers, and the bridge/companion move the allay by tp constantly. So
//   the display is a sibling entity that callers snap to the allay after
//   moving it (skinSyncCmd); teleport_duration makes the client interpolate
//   the snaps. billboard:"vertical" keeps the mascot face toward the viewer,
//   since nothing rotates the display.
//
//   Only enable "crab" after the packs are deployed, or Java players see a
//   broken purple cube floating next to an (still visible) allay.

const CFG = require("./config");

const TAG = CFG.avatarTag;
const AVATAR = `@e[type=minecraft:allay,tag=${TAG},limit=1]`;
const SKIN = `@e[type=minecraft:item_display,tag=${TAG}_skin,limit=1]`;
const SKIN_NBT = `{Tags:["${TAG}_skin"],billboard:"vertical",teleport_duration:2,item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"clawdcraft:clawd"}}}`;

module.exports = {
  crab: CFG.avatarModel === "crab",
  allayNbt: `{CustomName:"Clawd",Tags:["${TAG}"],PersistenceRequired:1b,Invulnerable:1b,NoAI:1b,NoGravity:1b}`,
  skinProbeCmd: `execute if entity @e[type=minecraft:item_display,tag=${TAG}_skin]`,
  skinKillCmd: `minecraft:kill @e[type=minecraft:item_display,tag=${TAG}_skin]`,
  skinSummonCmd: `execute at ${AVATAR} run summon minecraft:item_display ~ ~ ~ ${SKIN_NBT}`,
  skinSyncCmd: `execute at ${AVATAR} run minecraft:tp ${SKIN} ~ ~ ~`,
};
