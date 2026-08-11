# Lullaby Lantern

A gentle clock that puts hostile mobs to sleep: bonk a hostile mob and it is
immobilized (Slowness 255 + Blindness) for 20 seconds with floating particles. Taking damage again immediately awakens the sleeping mob.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:clock[minecraft:custom_name={text:"Lullaby Lantern",color:"blue",italic:false},minecraft:lore=[{text:"Shh... time for bed.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_lullaby_lantern:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement puts target hostile mobs to sleep for 20 seconds (400 ticks) by applying Slowness 255 and Blindness. A secondary `lullaby_lantern_wake` advancement listens for damage to any sleeping mob and cancels the effect early.

**Won't affect:** players, armor stands, items, item displays, bosses (ender dragon, wither, warden), villagers, or tamed pets (wolves, cats, horses, donkeys, mules, llamas, camels, parrots, allays).

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
