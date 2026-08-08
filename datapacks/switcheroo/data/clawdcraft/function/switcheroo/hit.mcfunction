# Runs as the attacking player, same tick as the hit (advancement reward).
# The swapper tag lets the swap function (which runs as the victim) find
# the player again. Dragon and wither are excluded — teleporting a boss,
# even 8 blocks, can wedge its fight; the warden is allowed because
# swapping AWAY from one is the whole point.
advancement revoke @s only clawdcraft:switcheroo_hit
tag @s add clawdcraft_swapper
execute at @s as @e[type=!minecraft:player,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,type=!minecraft:wither,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:switcheroo/swap
tag @s remove clawdcraft_swapper
