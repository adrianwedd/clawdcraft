# Every tick: tick down player cooldowns and comforted entity timers.
scoreboard players remove @a[scores={clawdcraft_candlecd=1..}] clawdcraft_candlecd 1
scoreboard players remove @e[tag=clawdcraft_comforted] clawdcraft_comfort 1
execute at @e[tag=clawdcraft_comforted] run particle minecraft:heart ~ ~1 ~ 0.3 0.4 0.3 0 1
execute as @e[tag=clawdcraft_comforted,scores={clawdcraft_comfort=..0}] run tag @s remove clawdcraft_comforted
execute as @e[scores={clawdcraft_comfort=..0}] run scoreboard players reset @s clawdcraft_comfort
