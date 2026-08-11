# Runs as the victim when awakened early by taking damage.
effect clear @s minecraft:slowness
effect clear @s minecraft:blindness
tag @s remove clawdcraft_sleeping
scoreboard players reset @s clawdcraft_sleep
particle minecraft:smoke ~ ~1 ~ 0.3 0.4 0.3 0.05 15
playsound minecraft:entity.player.attack.crit neutral @a[distance=..24] ~ ~ ~ 1 1.2
