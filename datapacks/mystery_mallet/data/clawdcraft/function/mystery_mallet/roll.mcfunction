# Runs as the victim, at the victim: roll a d8, poof out, critter in.
# No axolotl on the roster — they dehydrate and die on land in 5 minutes,
# which is the wrong kind of surprise. Big species come out as babies.
# All prizes get PersistenceRequired so they don't despawn. Bare
# summon/kill are safe here — datapack functions always resolve vanilla
# (see puppy_wand/transform.mcfunction).
execute store result score @s clawdcraft_mystery run random value 1..8
particle minecraft:poof ~ ~0.6 ~ 0.25 0.4 0.25 0.05 25
particle minecraft:note ~ ~1.2 ~ 0.4 0.3 0.4 1 8
playsound minecraft:entity.player.levelup neutral @a[distance=..24] ~ ~ ~ 1 1.5
execute if score @s clawdcraft_mystery matches 1 run summon minecraft:chicken ~ ~ ~ {PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 2 run summon minecraft:frog ~ ~ ~ {PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 3 run summon minecraft:armadillo ~ ~ ~ {PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 4 run summon minecraft:cat ~ ~ ~ {PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 5 run summon minecraft:rabbit ~ ~ ~ {PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 6 run summon minecraft:goat ~ ~ ~ {Age:-24000,PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 7 run summon minecraft:camel ~ ~ ~ {Age:-24000,PersistenceRequired:1b}
execute if score @s clawdcraft_mystery matches 8 run summon minecraft:sniffer ~ ~ ~ {Age:-24000,PersistenceRequired:1b}
kill @s
