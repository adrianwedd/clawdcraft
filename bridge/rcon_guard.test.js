#!/usr/bin/env node
// rcon_guard.test.js — walks the RCON denylist (HANDOFF 2026-07-04 step 1)
// plus gift.js refusal paths. Fully OFFLINE: guard checks are pure functions,
// and every gift.js case exits during validation, before any RCON connect.
//
// Run:  node bridge/rcon_guard.test.js      (or: cd bridge && npm test)

const { execFileSync } = require("child_process");
const path = require("path");
const { check } = require("./rcon_guard");

let failures = 0;
function expect(cond, label) {
  if (cond) return;
  failures++;
  console.error(`FAIL: ${label}`);
}

// ─── Must be DENIED ──────────────────────────────────────────────────────────
const DENY = [
  // admin/server verbs, with slash/case/namespace variants
  "stop", "/stop", "Stop", "restart", "reload", "reload confirm",
  "minecraft:reload", "op Nairdaaa", "deop Nairdaaa", "ban Griefer",
  "ban-ip 203.0.113.7", "pardon Griefer", "pardon-ip 203.0.113.7",
  "whitelist add Someone", "whitelist list", "kick Someone bye",
  "essentials:kick Someone", "bukkit:reload",
  // admin verbs smuggled through execute
  "execute at Nairdaaa run stop",
  "execute in minecraft:obi run execute at @s run op Griefer",
  // broad kill/tp selectors
  "kill @e", "minecraft:kill @e", "kill @a", "tp @e ~ ~ ~",
  "minecraft:tp @a 0 100 0",
  "teleport @e[type=minecraft:cow] 0 0 0",              // type= but no tag/limit
  "minecraft:kill @e[type=minecraft:allay]",            // would hit wild allays
  "minecraft:kill @e[tag=!clawd]",                      // negated tag is broad
  "kill @e[limit=10,type=minecraft:zombie]",            // limit but not 1
  // broad selectors upstream of a kill/tp tail
  "execute as @a at @s run minecraft:kill @e",
  "execute as @e[type=minecraft:zombie] run minecraft:kill @s",
  "execute in minecraft:obi run execute as @e run minecraft:tp @s 0 0 0",
];

// ─── Must be ALLOWED — real usage from clawd_prompt.md and the bridge ───────
const ALLOW = [
  "list", "say hello", "weather clear", "time set day",
  "minecraft:gamerule log_admin_commands false",
  "fill ~ ~ ~ ~10 ~5 ~10 minecraft:stone",
  'tellraw @a ["",{"text":"<Clawd> ","color":"gold","bold":true}]',
  'title @a actionbar {"text":"hi","color":"gray"}',
  // Clawd's documented avatar fix-commands (session/clawd_prompt.md) — if one
  // of these starts failing, Clawd can no longer repair its own body.
  "minecraft:kill @e[type=minecraft:allay,tag=clawd]",
  "minecraft:kill @e[type=minecraft:item_display,tag=clawd_skin]",
  'execute at Nairdaaa run summon minecraft:allay ~1.5 ~1 ~1.5 {CustomName:"Clawd",Tags:["clawd"],PersistenceRequired:1b,Invulnerable:1b,NoAI:1b,NoGravity:1b}',
  // bridge patterns (clawd.js / say.js / companion.js)
  "execute at @e[type=minecraft:allay,tag=clawd,limit=1] run particle minecraft:enchant ~ ~0.5 ~ 0.3 0.3 0.3 0.05 30",
  "execute as @e[type=minecraft:allay,tag=clawd,limit=1] at @s run minecraft:tp @s ~ ~0.3 ~",
  "execute at @e[type=minecraft:allay,tag=clawd,limit=1] run minecraft:tp @e[type=minecraft:item_display,tag=clawd_skin,limit=1] ~ ~ ~",
  "execute if entity @e[type=minecraft:allay,tag=clawd]", // probe-only execute
  'minecraft:tp @a[name=".Nairdaaa",limit=1] 186 306 -84',
  "effect give @e[type=minecraft:allay,tag=clawd,limit=1] minecraft:glowing infinite 0 true",
  'execute as @a[name="Nairdaaa",limit=1] at @s if entity @e[type=minecraft:allay,tag=clawd,distance=..12]',
];

for (const cmd of DENY) {
  const v = check(cmd);
  expect(!v.ok, `should DENY but allowed: ${cmd}`);
}
for (const cmd of ALLOW) {
  const v = check(cmd);
  expect(v.ok, `should ALLOW but denied (${v.reason}): ${cmd}`);
}

// ─── gift.js refusal paths (validation exits before any RCON connect) ───────
function giftRefusal(args, pattern, label) {
  try {
    execFileSync("node", [path.join(__dirname, "gift.js"), ...args], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    failures++;
    console.error(`FAIL: gift.js should refuse: ${label}`);
  } catch (e) {
    expect(e.status === 1, `gift.js exit 1 for: ${label} (got ${e.status})`);
    expect(pattern.test(String(e.stderr)), `gift.js stderr /${pattern.source}/ for: ${label}`);
  }
}
giftRefusal([], /usage/, "no args");
giftRefusal(["TestPlayer", "netherite_sword"], /refused: 'netherite_sword' is not on the gift allowlist/, "off-allowlist item");
giftRefusal(["TestPlayer", "diamond", "64"], /refused: max 3/, "over per-item cap");
giftRefusal(["bad name!", "cookie"], /refused: invalid player name/, "invalid player name");

const total = DENY.length + ALLOW.length + 4;
if (failures) {
  console.error(`\n${failures} failure(s) out of ${total} cases`);
  process.exit(1);
}
console.log(`ok — ${total} cases (${DENY.length} denied, ${ALLOW.length} allowed, 4 gift refusals)`);
