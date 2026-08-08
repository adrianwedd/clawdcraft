# Every tick: tick down cooldowns, then arm any player at <= 3 hearts
# (clawdcraft_hp <= 6, health criteria) with no cooldown and a hostile
# within 8 blocks. "Under attack and about to die" is proxied as
# low-health + hostile-in-range; the blade check itself lives in try.
scoreboard players remove @a[scores={clawdcraft_ragecd=1..}] clawdcraft_ragecd 1
execute as @a[scores={clawdcraft_hp=..6}] unless score @s clawdcraft_ragecd matches 1.. at @s if entity @e[type=#clawdcraft:rage_targets,distance=..8] run function clawdcraft:rage_blade/try
