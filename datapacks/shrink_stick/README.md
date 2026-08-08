# Shrink Stick

A stick that shrinks whatever you bonk to 30% size (squeak, purple
sparkles). Bonk the same mob again to pop it back to full size.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:stick[minecraft:custom_name={text:"Shrink Stick",color:"light_purple",italic:false},minecraft:lore=[{text:"Makes big things smol.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_shrink_stick:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as the
puppy wand, routed through an asparagus-style scratch-tag toggle. The
shrink is a `-0.7 add_multiplied_total` modifier on `minecraft:scale`
(id `clawdcraft:smol`) — a multiplier, not a base set, so slimes and baby
mobs restore to exactly their original size. Shrunken mobs get
PersistenceRequired so they don't despawn.

**Won't shrink:** players, bosses (ender dragon / wither / warden — scale
does NOT reduce damage, and a pocket warden that still one-shots people is
a trap), armor stands, items, item displays. A tiny zombie still bites for
full damage too — smol, not safe.

**Rescue** (if the pack is removed while mobs are shrunken, they stay
tiny): re-add the pack and run
`execute as @e[tag=clawdcraft_smol] run function clawdcraft:shrink_stick/grow`
from an op/console.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
