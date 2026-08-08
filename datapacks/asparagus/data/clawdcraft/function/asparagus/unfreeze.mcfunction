# Runs as the frozen mob when its timer hits zero (or via manual rescue —
# see README). Order matters: untag last so a crash mid-function retries.
data merge entity @s {NoAI:0b,Silent:0b}
scoreboard players reset @s clawdcraft_freeze
particle minecraft:poof ~ ~0.8 ~ 0.3 0.4 0.3 0.02 12
playsound minecraft:block.amethyst_block.break neutral @a[distance=..24] ~ ~ ~ 1 1.2
tag @s remove clawdcraft_frozen
