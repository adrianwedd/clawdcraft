# Every tick: countdown + giggle sparkles over tickled mobs. No-ops
# instantly when nothing is tagged.
scoreboard players remove @e[tag=clawdcraft_tickled] clawdcraft_tickle 1
execute at @e[tag=clawdcraft_tickled] run particle minecraft:happy_villager ~ ~1 ~ 0.3 0.4 0.3 0 1
execute as @e[tag=clawdcraft_tickled,scores={clawdcraft_tickle=..0}] run function clawdcraft:tickle_feather/recover
