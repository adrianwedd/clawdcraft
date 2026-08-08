# Runs as the victim. 80 ticks of levitation is the bubble ride; the pop
# is timed by the clawdcraft_bubble score in tick.mcfunction. Slow falling
# outlasts the ride by seconds so the descent is always fall-damage-free.
# Re-bonking a bubbled mob refreshes both — longer ride, still safe.
tag @s add clawdcraft_bubbled
scoreboard players set @s clawdcraft_bubble 80
effect give @s minecraft:levitation 4 0 true
effect give @s minecraft:slow_falling 12 0 true
particle minecraft:bubble ~ ~0.8 ~ 0.4 0.6 0.4 0 25
playsound minecraft:entity.axolotl.splash neutral @a[distance=..24] ~ ~ ~ 1 1.3
