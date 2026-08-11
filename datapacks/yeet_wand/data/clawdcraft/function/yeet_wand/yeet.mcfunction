# Runs as victim. Uses attacker's facing direction to compute horizontal launch motion.
# Step 1: Summon origin marker at attacker position, and target marker 2 blocks ahead of attacker (pitch 0).
execute at @p run summon marker ~ ~ ~ {Tags:["clawdcraft_yeet_orig"]}
execute at @p rotated ~ 0 run summon marker ^ ^0.2 ^2 {Tags:["clawdcraft_yeet_targ"]}

# Step 2: Store X and Z coordinate differences into scoreboard.
execute store result score #dx clawdcraft_yeet run data get entity @e[tag=clawdcraft_yeet_targ,limit=1] Pos[0] 100
execute store result score #ox clawdcraft_yeet run data get entity @e[tag=clawdcraft_yeet_orig,limit=1] Pos[0] 100
scoreboard players operation #dx clawdcraft_yeet -= #ox clawdcraft_yeet

execute store result score #dz clawdcraft_yeet run data get entity @e[tag=clawdcraft_yeet_targ,limit=1] Pos[2] 100
execute store result score #oz clawdcraft_yeet run data get entity @e[tag=clawdcraft_yeet_orig,limit=1] Pos[2] 100
scoreboard players operation #dz clawdcraft_yeet -= #oz clawdcraft_yeet

# Step 3: Apply launch motion (horizontal speed ~2.0+ b/t, vertical lift 0.35 b/t) and 3s Slow Falling.
data merge entity @s {Motion:[0.0d,0.35d,0.0d]}
execute store result entity @s Motion[0] double 0.015 run scoreboard players get #dx clawdcraft_yeet
execute store result entity @s Motion[2] double 0.015 run scoreboard players get #dz clawdcraft_yeet

effect give @s minecraft:slow_falling 3 0 true

# Step 4: Clean up markers, play particles & slide-whistle/launch sound.
kill @e[tag=clawdcraft_yeet_orig]
kill @e[tag=clawdcraft_yeet_targ]

particle minecraft:cloud ~ ~1 ~ 0.5 0.2 0.5 0.2 20
particle minecraft:poof ~ ~1 ~ 0.3 0.3 0.3 0.1 15
playsound minecraft:entity.wandering_trader.disappeared neutral @a[distance=..32] ~ ~ ~ 1.5 1.5
playsound minecraft:entity.wind_charge.throw neutral @a[distance=..32] ~ ~ ~ 1.2 1.4
