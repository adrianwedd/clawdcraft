# Breeze Bat

A breeze rod that clears personal space: land a bonk on anything and every
hostile within 6 blocks pops ~6 blocks straight up (wind-burst boom, gust
of cloud), then drifts down slowly like a dandelion seed. Zero damage
dealt, no fall damage on landing — it just buys ~9 seconds to run. The
Rage Blade's harmless little sibling, on a 5-second cooldown.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:breeze_rod[minecraft:custom_name={text:"Breeze Bat",color:"dark_aqua",italic:false},minecraft:lore=[{text:"Everybody UP.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_breeze_bat:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement fires on any landed
hit (no victim-find needed — the gust centers on the player); a
`clawdcraft_batcd` scoreboard cooldown gates it, and each
`#clawdcraft:blown_targets` mob in range gets Levitation VII (1s) + Slow
Falling (8s).

**Targets:** `#clawdcraft:blown_targets` — the pack's own copy of the Rage
Blade's hostile list (all regular hostiles including warden, excluding
wither and ender dragon), so neither pack depends on the other being
loaded. Mobs drift down roughly where they went up — this is a breather,
not a catapult.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
