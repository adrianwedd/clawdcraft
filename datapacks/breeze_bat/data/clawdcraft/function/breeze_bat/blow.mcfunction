# Runs as the batter, at them. Every hostile within 6 blocks goes UP on a
# quick levitation pop, then dandelion-drifts down on slow falling —
# separation with zero damage dealt. Buys ~9 seconds to run. 5s cooldown.
scoreboard players set @s clawdcraft_batcd 100
particle minecraft:gust ~ ~1 ~ 0.2 0.2 0.2 0 2
particle minecraft:cloud ~ ~0.5 ~ 1.5 0.4 1.5 0.08 40
playsound minecraft:entity.wind_charge.wind_burst neutral @a[distance=..24] ~ ~ ~ 1 1
execute as @e[type=#clawdcraft:blown_targets,distance=..6] at @s run function clawdcraft:breeze_bat/launch
