# Rainbow Brush

A brush that re-dyes any sheep you bonk to a random color (chime, note
particles). Bonk anything else and it just gets a burst of confetti — no
transformation, no tricks. The one weapon you'd happily leave in a chest
at spawn.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:brush[minecraft:custom_name={text:"Rainbow Brush",color:"gold",italic:false},minecraft:lore=[{text:"Every sheep deserves to be fabulous.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_rainbow_brush:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as
the puppy wand, split into two mutually exclusive selectors (sheep /
not-sheep). The recolor is a single
`execute store result entity @s Color byte 1 run random value 0..15` — no
scoreboard. A 1-in-16 roll repeats the current color; that's the gag.

**Notes:** the bonk itself still does the brush's 1 point of damage (that
is what fires the trigger), so brushed mobs may take mild offense.
Players, items, item displays, and armor stands are excluded from
confetti targeting.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
