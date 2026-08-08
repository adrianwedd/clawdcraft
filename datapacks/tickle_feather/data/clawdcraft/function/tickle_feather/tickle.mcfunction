# Runs as the victim. Weakness 255 zeroes melee damage for the duration;
# slowness sells the "too busy laughing to walk straight" bit. The score
# drives the giggle sparkles in tick.mcfunction; the effects expire on
# their own at the same moment the tag comes off. Re-tickling refreshes.
tag @s add clawdcraft_tickled
scoreboard players set @s clawdcraft_tickle 600
effect give @s minecraft:weakness 30 255 true
effect give @s minecraft:slowness 30 2 true
particle minecraft:happy_villager ~ ~1 ~ 0.4 0.5 0.4 0 15
playsound minecraft:entity.parrot.ambient neutral @a[distance=..24] ~ ~ ~ 1 1.6
