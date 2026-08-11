# Runs as the attacking player, same tick as the hit (advancement reward).
advancement revoke @s only clawdcraft:name_nebulizer_hit
execute unless score @s clawdcraft_nebulcd matches 1.. at @s as @e[type=!minecraft:player,type=!minecraft:armor_stand,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:name_nebulizer/roll
execute unless score @s clawdcraft_nebulcd matches 1.. run scoreboard players set @s clawdcraft_nebulcd 10
