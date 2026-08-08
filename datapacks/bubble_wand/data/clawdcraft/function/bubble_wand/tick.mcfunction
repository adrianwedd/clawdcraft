# Every tick: bubble shell on riders, countdown, pop at zero. No-ops
# instantly when nothing is tagged.
scoreboard players remove @e[tag=clawdcraft_bubbled] clawdcraft_bubble 1
execute at @e[tag=clawdcraft_bubbled] run particle minecraft:bubble ~ ~0.8 ~ 0.35 0.5 0.35 0 2
execute as @e[tag=clawdcraft_bubbled,scores={clawdcraft_bubble=..0}] at @s run function clawdcraft:bubble_wand/pop
