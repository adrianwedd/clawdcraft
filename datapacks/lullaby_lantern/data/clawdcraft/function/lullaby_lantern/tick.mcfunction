# Every tick: tick down player cooldowns and sleep timers, render zzz particles.
scoreboard players remove @a[scores={clawdcraft_lullabycd=1..}] clawdcraft_lullabycd 1
scoreboard players remove @e[tag=clawdcraft_sleeping] clawdcraft_sleep 1
execute at @e[tag=clawdcraft_sleeping] run particle minecraft:end_rod ~ ~1.5 ~ 0.2 0.3 0.2 0.01 1
execute as @e[tag=clawdcraft_sleeping,scores={clawdcraft_sleep=..0}] at @s run function clawdcraft:lullaby_lantern/wake_natural
