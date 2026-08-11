# Runs as the attacking player, same tick as the hit (advancement reward).
advancement revoke @s only clawdcraft:yeet_wand_hit
execute unless score @s clawdcraft_yeetcd matches 1.. at @s as @e[type=!minecraft:player,type=!minecraft:armor_stand,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,type=!minecraft:villager,type=!minecraft:wandering_trader,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:yeet_wand/yeet
execute unless score @s clawdcraft_yeetcd matches 1.. run scoreboard players set @s clawdcraft_yeetcd 20
