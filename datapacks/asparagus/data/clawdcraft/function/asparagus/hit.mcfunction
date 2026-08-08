# Runs as the attacking player, same tick as the hit (advancement reward).
# Victim found by HurtTime:10s, same trick as the puppy wand. (NoAI skips
# the mob brain, not baseTick, so frozen mobs still register hits and gain
# HurtTime — that's what makes the unfreeze strike land.) The ender dragon
# is excluded (its phase AI ignores NoAI and freezing it mid-fight can
# wedge the fight). Clawd's avatar is Invulnerable, so it can never gain
# HurtTime and is safe by construction.
advancement revoke @s only clawdcraft:asparagus_hit
execute at @s as @e[type=!minecraft:player,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:armor_stand,type=!minecraft:ender_dragon,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:asparagus/toggle
