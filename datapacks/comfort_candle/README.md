# Comfort Candle

A soothing torch that envelops mob victims in a warm healing aura: 10 seconds of
Regeneration I and Glowing, accompanied by heart and flame particles. Non-lethal
and wholesome, with a 2-second player cooldown.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:torch[minecraft:custom_name={text:"Comfort Candle",color:"gold",italic:false},minecraft:lore=[{text:"Warmth, healing, and light.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_comfort_candle:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement triggers when bonking a mob while holding the candle; victim receives Regeneration I and Glowing for 10 seconds (200 ticks) while tracked by a timer for warm particle effects.

**Won't affect:** players, armor stands, items, item displays, bosses (ender dragon, wither, warden).

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
