# Runs as the attacking player, same tick as the hit (advancement reward).
# Sheep get painted; anything else living gets harmless confetti. The two
# selectors are mutually exclusive (sheep vs !sheep) so one bonk never
# fires both.
advancement revoke @s only clawdcraft:rainbow_brush_hit
execute at @s as @e[type=minecraft:sheep,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:rainbow_brush/paint
execute at @s as @e[type=!minecraft:sheep,type=!minecraft:player,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:rainbow_brush/confetti
