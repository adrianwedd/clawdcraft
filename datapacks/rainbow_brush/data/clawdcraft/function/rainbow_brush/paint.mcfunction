# Runs as the sheep. One store-result line writes a random dye id (0-15)
# straight into the sheep's Color byte — no scoreboard needed. A 1-in-16
# roll lands on the current color; that's the gag, not a bug.
execute store result entity @s Color byte 1 run random value 0..15
particle minecraft:note ~ ~1.2 ~ 0.5 0.4 0.5 1 12
playsound minecraft:entity.sheep.ambient neutral @a[distance=..24] ~ ~ ~ 1 1.4
playsound minecraft:block.note_block.chime neutral @a[distance=..24] ~ ~ ~ 1 1.8
