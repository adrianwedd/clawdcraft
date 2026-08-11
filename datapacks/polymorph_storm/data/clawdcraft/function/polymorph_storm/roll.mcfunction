# Runs as each victim entity within 10 blocks: roll a d8, poof out, non-persistent critter in.
# No axolotl on the roster — they dehydrate and die on land. Big species come out as babies.
# Critters do NOT get PersistenceRequired so they can despawn naturally and prevent loot/XP duping.
execute store result score @s clawdcraft_pstorm run random value 1..8
particle minecraft:poof ~ ~0.6 ~ 0.25 0.4 0.25 0.05 25
particle minecraft:note ~ ~1.2 ~ 0.4 0.3 0.4 1 8
playsound minecraft:entity.player.levelup neutral @a[distance=..24] ~ ~ ~ 1 1.5
execute if score @s clawdcraft_pstorm matches 1 run summon minecraft:chicken ~ ~ ~
execute if score @s clawdcraft_pstorm matches 2 run summon minecraft:frog ~ ~ ~
execute if score @s clawdcraft_pstorm matches 3 run summon minecraft:armadillo ~ ~ ~
execute if score @s clawdcraft_pstorm matches 4 run summon minecraft:cat ~ ~ ~
execute if score @s clawdcraft_pstorm matches 5 run summon minecraft:rabbit ~ ~ ~
execute if score @s clawdcraft_pstorm matches 6 run summon minecraft:goat ~ ~ ~ {Age:-24000}
execute if score @s clawdcraft_pstorm matches 7 run summon minecraft:camel ~ ~ ~ {Age:-24000}
execute if score @s clawdcraft_pstorm matches 8 run summon minecraft:sniffer ~ ~ ~ {Age:-24000}
kill @s
