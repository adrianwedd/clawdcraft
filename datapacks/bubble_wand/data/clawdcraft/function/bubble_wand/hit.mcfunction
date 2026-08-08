# Runs as the attacking player, same tick as the hit (advancement reward).
# Victim found by HurtTime:10s, same trick as the puppy wand. Dragon and
# wither excluded (flying bosses — a bubble is meaningless on them).
# Everything else, warden included, gets four seconds of gentle airtime
# and a guaranteed soft landing.
advancement revoke @s only clawdcraft:bubble_wand_hit
execute at @s as @e[type=!minecraft:player,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,type=!minecraft:wither,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:bubble_wand/bubble
