# Runs as victim: launch straight up ~50+ blocks with firework explosion.
tag @s add clawdcraft_skyfalling
scoreboard players set @s clawdcraft_skyfall_t 20
# Hard cap so flying mobs (bats, ghasts, phantoms, bees, vexes — never trigger
# OnGround) can't leak the tag/particle loop forever; forces a landing cleanup
# at 15s even mid-air.
scoreboard players set @s clawdcraft_skyfall_max 300
data merge entity @s {Motion:[0.0d,2.8d,0.0d]}
effect give @s minecraft:slow_falling 30 0 true

particle minecraft:explosion_emitter ~ ~ ~ 1 1 1 0 1
particle minecraft:firework ~ ~1 ~ 0.5 0.5 0.5 0.15 40
playsound minecraft:entity.firework_rocket.blast neutral @a[distance=..32] ~ ~ ~ 1.5 1
playsound minecraft:entity.firework_rocket.launch neutral @a[distance=..32] ~ ~ ~ 1.5 0.8
