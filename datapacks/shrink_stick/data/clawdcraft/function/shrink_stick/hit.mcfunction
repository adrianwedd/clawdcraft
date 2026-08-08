# Runs as the attacking player, same tick as the hit (advancement reward).
# Victim found by HurtTime:10s, same trick as the puppy wand. Bosses are
# excluded because scale does NOT reduce damage — a pocket-sized warden
# that still one-shots people is a trap, not a toy.
advancement revoke @s only clawdcraft:shrink_stick_hit
execute at @s as @e[type=!minecraft:player,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:shrink_stick/toggle
