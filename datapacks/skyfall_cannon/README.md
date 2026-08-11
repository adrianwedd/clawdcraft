# Skyfall Cannon

A firework rocket that launches mobs straight up into the clouds: bonk a mob to
propel it ~50+ blocks high with an explosion particle burst. The victim slowly drifts back down under Slow Falling and triggers a second fireworks explosion upon touchdown.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:firework_rocket[minecraft:custom_name={text:"Skyfall Cannon",color:"red",italic:false},minecraft:lore=[{text:"Prepare for launch!",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_skyfall_cannon:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement triggers on hit; sets Motion Y to 2.8d and grants 30 seconds of Slow Falling. A tick function monitors the airborne entity's ground status (`OnGround:1b`), triggering a landing explosion when it touches down.

**Won't affect:** players, armor stands, items, item displays, bosses (ender dragon, wither, warden), villagers, or tamed pets (wolves, cats, horses, donkeys, mules, llamas, camels, parrots, allays).

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
