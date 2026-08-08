# Runs as the attacking player, same tick as the hit (advancement reward).
# Creepers are excluded — a "tickled" creeper that still explodes is a
# betrayal, not a joke. Bosses excluded too: weakness wouldn't stop a
# wither skull or a sonic boom anyway (ranged attacks ignore it — see
# README).
advancement revoke @s only clawdcraft:tickle_feather_hit
execute at @s as @e[type=!minecraft:player,type=!minecraft:creeper,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:tickle_feather/tickle
