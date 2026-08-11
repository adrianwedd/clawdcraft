# Every tick: tick down player cooldowns and skyfall launch delay/timer, check landing condition.
scoreboard players remove @a[scores={clawdcraft_skyfallcd=1..}] clawdcraft_skyfallcd 1

# Ticks down initial airtime delay (20 ticks / 1 second) before arming ground check
scoreboard players remove @e[tag=clawdcraft_skyfalling,scores={clawdcraft_skyfall_t=1..}] clawdcraft_skyfall_t 1

# Ticks down the hard airtime cap (see launch.mcfunction)
scoreboard players remove @e[tag=clawdcraft_skyfalling,scores={clawdcraft_skyfall_max=1..}] clawdcraft_skyfall_max 1

# Airborne trail particles
execute at @e[tag=clawdcraft_skyfalling] run particle minecraft:firework ~ ~0.5 ~ 0.2 0.2 0.2 0.02 3
execute at @e[tag=clawdcraft_skyfalling] run particle minecraft:small_flame ~ ~0.2 ~ 0.1 0.1 0.1 0.01 2

# When timer reached 0 and entity touches ground (OnGround:1b), trigger landing explosion
execute as @e[tag=clawdcraft_skyfalling,scores={clawdcraft_skyfall_t=..0},nbt={OnGround:1b}] at @s run function clawdcraft:skyfall_cannon/land

# Flying mobs (bats, ghasts, phantoms, bees, vexes) never set OnGround — force
# a landing cleanup once the hard cap expires so the tag/particle loop can't
# run forever.
execute as @e[tag=clawdcraft_skyfalling,scores={clawdcraft_skyfall_max=..0}] at @s run function clawdcraft:skyfall_cannon/land
