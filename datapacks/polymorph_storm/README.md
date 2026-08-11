# Polymorph Storm

An enchanted golden apple that unleashes a chaotic area-of-effect polymorph: bonk
a mob and EVERY eligible mob within 10 blocks (including the hit mob) instantly transforms into a random harmless critter (chicken, frog, armadillo, cat, rabbit, baby goat, baby camel, or baby sniffer). 5-second player cooldown.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:enchanted_golden_apple[minecraft:custom_name={text:"Polymorph Storm",color:"light_purple",italic:false},minecraft:lore=[{text:"Chaos falls upon all nearby.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_polymorph_storm:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement triggers on hit; selects `@e[...,distance=..10]` around the player and rolls a d8 per mob. Unlike Mystery Mallet, spawned critters do NOT get PersistenceRequired to prevent loot/XP duping vectors and allow natural despawning.

**Won't affect:** players, armor stands, items, item displays, bosses (ender dragon, wither, warden), villagers, or tamed/pet entities (wolves, cats, horses, donkeys, mules, llamas, camels, parrots, allays).

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
