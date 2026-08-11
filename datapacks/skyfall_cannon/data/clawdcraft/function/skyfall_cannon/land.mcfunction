# Runs as victim upon landing back on the ground.
particle minecraft:explosion_emitter ~ ~ ~ 1 1 1 0 1
particle minecraft:firework ~ ~0.5 ~ 0.8 0.5 0.8 0.2 50
playsound minecraft:entity.firework_rocket.twinkle neutral @a[distance=..32] ~ ~ ~ 1.5 1
playsound minecraft:entity.generic.explode neutral @a[distance=..32] ~ ~ ~ 1 1.2

tag @s remove clawdcraft_skyfalling
scoreboard players reset @s clawdcraft_skyfall_t
scoreboard players reset @s clawdcraft_skyfall_max
