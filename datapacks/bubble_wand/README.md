# Bubble Wand

A tube coral wand that traps whatever you bonk in a bubble: it floats
gently upward for 4 seconds ringed in bubble particles, the bubble pops
with a splash, and the mob dandelion-drifts back down on slow falling.
Temporary, self-resolving, no fall damage ever.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:tube_coral[minecraft:custom_name={text:"Bubble Wand",color:"aqua",italic:false},minecraft:lore=[{text:"Pop!",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_bubble_wand:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as
the puppy wand. The victim gets Levitation (4s) + Slow Falling (12s) and a
`clawdcraft_bubble` score of 80; a tick function draws the bubble shell,
counts down, and pops at zero. Slow falling outlasts the ride so the
descent is always safe. Re-bonking a bubbled mob refreshes the ride.

**Won't bubble:** players, the ender dragon and wither (flying bosses),
armor stands, items, item displays. The warden CAN be bubbled — four
seconds of airtime is a great head start.

**If the pack is removed mid-bubble:** nothing is stranded — the effects
expire on their own; only an inert `clawdcraft_bubbled` tag remains.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
