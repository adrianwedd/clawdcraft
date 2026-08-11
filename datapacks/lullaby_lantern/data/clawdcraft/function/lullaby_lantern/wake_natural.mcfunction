# Runs as the victim when sleep timer expires after 20s.
effect clear @s minecraft:slowness
effect clear @s minecraft:blindness
tag @s remove clawdcraft_sleeping
scoreboard players reset @s clawdcraft_sleep
particle minecraft:end_rod ~ ~1 ~ 0.3 0.3 0.3 0.05 10
