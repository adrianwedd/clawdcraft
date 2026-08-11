# Runs as the victim. Grants Slowness 255 + Blindness for 20s (400 ticks).
tag @s add clawdcraft_sleeping
scoreboard players set @s clawdcraft_sleep 400
effect give @s minecraft:slowness 20 255 true
effect give @s minecraft:blindness 20 0 true
particle minecraft:effect ~ ~1.5 ~ 0.4 0.5 0.4 0 20
playsound minecraft:block.conduit.deactivate neutral @a[distance=..24] ~ ~ ~ 1 0.8
