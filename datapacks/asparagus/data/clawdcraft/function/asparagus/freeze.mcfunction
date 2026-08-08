# Runs as the victim, at the victim. Re-hitting a frozen mob refreshes the
# timer. NoAI stops everything — movement, gravity, attacks, creeper fuses —
# so a mob tagged mid-jump hangs in the air, which is exactly the bit.
tag @s add clawdcraft_frozen
scoreboard players set @s clawdcraft_freeze 200
data merge entity @s {NoAI:1b,Silent:1b}
particle minecraft:snowflake ~ ~1 ~ 0.4 0.6 0.4 0 30
playsound minecraft:block.amethyst_block.chime neutral @a[distance=..24] ~ ~ ~ 1 0.7
