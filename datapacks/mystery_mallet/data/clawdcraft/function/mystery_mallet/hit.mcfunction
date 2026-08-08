# Runs as the attacking player, same tick as the hit (advancement reward).
# Same exclusions as the puppy wand, plus cats — nobody gambles away
# anyone's tamed pet here (both wolves and cats are protected).
advancement revoke @s only clawdcraft:mystery_mallet_hit
execute at @s as @e[type=!minecraft:player,type=!minecraft:wolf,type=!minecraft:cat,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:mystery_mallet/roll
