# Yeet Wand

A wooden shovel that launches mobs horizontally away from the attacker at high
speed. Computed directly from attacker facing, victims fly backward accompanied by a slide-whistle sound effect and 3 seconds of Slow Falling to prevent fall damage.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:wooden_shovel[minecraft:custom_name={text:"Yeet Wand",color:"yellow",italic:false},minecraft:lore=[{text:"Begone, pest!",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_yeet_wand:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement triggers on hit; temporary markers compute the attacker's facing vector and store high horizontal velocity into the victim's `Motion` NBT, alongside 3 seconds of Slow Falling.

**Won't affect:** players, armor stands, items, item displays, bosses (ender dragon, wither, warden), or villagers.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
