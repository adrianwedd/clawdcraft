# Runs as the victim, at the victim. A -70% multiply-total modifier rather
# than a base set, so slimes, babies, and anything else with a nonstandard
# scale comes back exactly as it was. PersistenceRequired so a kid's tiny
# pet creeper doesn't despawn behind their back.
tag @s add clawdcraft_smol
attribute @s minecraft:scale modifier add clawdcraft:smol -0.7 add_multiplied_total
data merge entity @s {PersistenceRequired:1b}
particle minecraft:witch ~ ~0.5 ~ 0.3 0.4 0.3 0 20
playsound minecraft:entity.puffer_fish.blow_out neutral @a[distance=..24] ~ ~ ~ 1 1.6
