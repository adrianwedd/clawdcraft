# Runs as attacking player. Triggers storm sound & visuals, then rolls polymorph on all eligible mobs within 10 blocks.
scoreboard players set @s clawdcraft_stormcd 100
playsound minecraft:entity.lightning_bolt.thunder neutral @a[distance=..32] ~ ~ ~ 1 1.5
particle minecraft:witch ~ ~1 ~ 3 1 3 0.1 100
particle minecraft:flash ~ ~1 ~ 0 0 0 0 1

# nbt={Health:0.0f..} restricts the area effect to LivingEntity — unlike the
# other packs' single-victim HurtTime:10s lookup, this has no natural
# living-entity filter, so without it boats/minecarts/item frames/paintings
# within 10 blocks would get killed and replaced by a critter too.
execute as @e[type=!minecraft:player,type=!minecraft:armor_stand,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,type=!minecraft:wolf,type=!minecraft:cat,type=!minecraft:horse,type=!minecraft:donkey,type=!minecraft:mule,type=!minecraft:llama,type=!minecraft:trader_llama,type=!minecraft:camel,type=!minecraft:parrot,type=!minecraft:allay,type=!minecraft:villager,type=!minecraft:wandering_trader,distance=..10,nbt={Health:0.0f..}] at @s run function clawdcraft:polymorph_storm/roll
