# Runs as the shrunken victim on a second strike: pop back to full size.
attribute @s minecraft:scale modifier remove clawdcraft:smol
particle minecraft:poof ~ ~0.8 ~ 0.3 0.5 0.3 0.02 15
playsound minecraft:entity.puffer_fish.blow_up neutral @a[distance=..24] ~ ~ ~ 1 0.8
tag @s remove clawdcraft_smol
