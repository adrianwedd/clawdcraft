# Magic Asparagus

Bluey-style: bonk a mob and it freezes in time for 10 seconds — snowflakes,
a chime, hangs mid-air if it was jumping — then pops back with a poof.

**Deploy:** copy into `world/datapacks/`, `minecraft:reload` (human, from an
interactive terminal — the guard blocks scripted reload), then
`minecraft:datapack enable "file/asparagus"`.

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:bamboo[minecraft:custom_name={text:"Magic Asparagus",color:"green",italic:false},minecraft:lore=[{text:"Freezes mobs in time. Wackadoo!",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_asparagus:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as the
puppy wand. Freeze = `NoAI:1b,Silent:1b` + `clawdcraft_frozen` tag + a
200-tick `clawdcraft_freeze` score; a tick function drains the score,
sparkles, and unfreezes at zero. Re-hitting refreshes the timer.

**Won't freeze:** players, the ender dragon (phase AI ignores NoAI and can
wedge the fight), armor stands/items/displays. Clawd's avatar is
Invulnerable so it never gains HurtTime. Wither/warden CAN be frozen —
temporary and reversible, great escape button.

**Rescue** (if the pack is ever removed while mobs are frozen, they stay
NoAI forever): re-add the pack and run
`execute as @e[tag=clawdcraft_frozen] at @s run function clawdcraft:asparagus/unfreeze`
from an op/console.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
