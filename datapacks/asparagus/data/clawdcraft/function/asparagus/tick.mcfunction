# Every tick: drain each frozen mob's timer, sparkle, unfreeze at zero.
# No-ops instantly when nothing is tagged, so idle cost is negligible.
execute as @e[tag=clawdcraft_frozen] run scoreboard players remove @s clawdcraft_freeze 1
execute at @e[tag=clawdcraft_frozen] run particle minecraft:snowflake ~ ~1 ~ 0.3 0.5 0.3 0 1
execute as @e[tag=clawdcraft_frozen,scores={clawdcraft_freeze=..0}] at @s run function clawdcraft:asparagus/unfreeze
