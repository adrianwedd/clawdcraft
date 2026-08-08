# Runs as the attacking player, same tick as the hit (advancement reward).
# The victim is found by HurtTime:10s — set the instant damage lands, not
# decremented until the entity's next tick, so it uniquely marks "just hit".
# Exclusions: players and wolves (so nobody's tamed dog gets killed and
# replaced by a stray puppy), non-living hittables, and the three bosses
# (a one-bonk boss kill trivializes them).
advancement revoke @s only clawdcraft:puppy_wand_hit
execute at @s as @e[type=!minecraft:player,type=!minecraft:wolf,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:puppy_wand/transform
