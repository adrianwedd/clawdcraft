# Runs as the frozen mob on a second asparagus strike (or via manual
# rescue — see README). Also clears the legacy timer score from the v1
# timed-freeze design, harmless if absent.
data merge entity @s {NoAI:0b,Silent:0b}
scoreboard players reset @s clawdcraft_freeze
particle minecraft:poof ~ ~0.8 ~ 0.3 0.4 0.3 0.02 12
playsound minecraft:block.amethyst_block.break neutral @a[distance=..24] ~ ~ ~ 1 1.2
tag @s remove clawdcraft_frozen
