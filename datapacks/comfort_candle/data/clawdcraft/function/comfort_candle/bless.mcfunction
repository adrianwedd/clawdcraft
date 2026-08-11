# Runs as the victim. Grants Regeneration I + Glowing for 10s (200 ticks), plus warm particles.
tag @s add clawdcraft_comforted
scoreboard players set @s clawdcraft_comfort 200
effect give @s minecraft:regeneration 10 0 true
effect give @s minecraft:glowing 10 0 true
particle minecraft:heart ~ ~1 ~ 0.4 0.5 0.4 0.1 10
particle minecraft:flame ~ ~0.8 ~ 0.3 0.4 0.3 0.05 15
playsound minecraft:block.candle.use neutral @a[distance=..24] ~ ~ ~ 1 1
