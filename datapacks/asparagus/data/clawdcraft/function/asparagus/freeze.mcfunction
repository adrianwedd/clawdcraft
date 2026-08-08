# Runs as the victim, at the victim. Permanent: no timer — only another
# asparagus strike unfreezes. NoAI stops everything (movement, gravity,
# attacks, creeper fuses), so a mob tagged mid-jump hangs in the air.
# PersistenceRequired keeps frozen statues from despawning when players
# wander off (it does mean the mob stays persistent after unfreezing).
tag @s add clawdcraft_frozen
data merge entity @s {NoAI:1b,Silent:1b,PersistenceRequired:1b}
particle minecraft:snowflake ~ ~1 ~ 0.4 0.6 0.4 0 30
playsound minecraft:block.amethyst_block.chime neutral @a[distance=..24] ~ ~ ~ 1 0.7
