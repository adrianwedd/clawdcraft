# Runs as attacking player. Triggers storm sound & visuals, then rolls polymorph on all eligible mobs within 10 blocks.
scoreboard players set @s clawdcraft_stormcd 100
playsound minecraft:entity.lightning_bolt.thunder neutral @a[distance=..32] ~ ~ ~ 1 1.5
particle minecraft:witch ~ ~1 ~ 3 1 3 0.1 100
particle minecraft:explosion ~ ~1 ~ 0 0 0 0 1

# Unlike the other packs' single-victim HurtTime:10s lookup, this area effect
# has no natural living-entity filter, so player-placed entities within 10
# blocks need explicit exclusion or they'd get killed and replaced by a
# critter too. (nbt= selectors can't express a "Health key present" range —
# NBT matching is exact/subset only, not a numeric range like scores/distance.)
execute as @e[type=!minecraft:player,type=!minecraft:armor_stand,type=!minecraft:item,type=!minecraft:item_display,type=!minecraft:ender_dragon,type=!minecraft:wither,type=!minecraft:warden,type=!minecraft:wolf,type=!minecraft:cat,type=!minecraft:horse,type=!minecraft:donkey,type=!minecraft:mule,type=!minecraft:llama,type=!minecraft:trader_llama,type=!minecraft:camel,type=!minecraft:parrot,type=!minecraft:allay,type=!minecraft:villager,type=!minecraft:wandering_trader,type=!minecraft:oak_boat,type=!minecraft:spruce_boat,type=!minecraft:birch_boat,type=!minecraft:jungle_boat,type=!minecraft:acacia_boat,type=!minecraft:dark_oak_boat,type=!minecraft:mangrove_boat,type=!minecraft:cherry_boat,type=!minecraft:pale_oak_boat,type=!minecraft:bamboo_raft,type=!minecraft:oak_chest_boat,type=!minecraft:spruce_chest_boat,type=!minecraft:birch_chest_boat,type=!minecraft:jungle_chest_boat,type=!minecraft:acacia_chest_boat,type=!minecraft:dark_oak_chest_boat,type=!minecraft:mangrove_chest_boat,type=!minecraft:cherry_chest_boat,type=!minecraft:pale_oak_chest_boat,type=!minecraft:bamboo_chest_raft,type=!minecraft:minecart,type=!minecraft:chest_minecart,type=!minecraft:hopper_minecart,type=!minecraft:tnt_minecart,type=!minecraft:furnace_minecart,type=!minecraft:command_block_minecart,type=!minecraft:spawner_minecart,type=!minecraft:item_frame,type=!minecraft:glow_item_frame,type=!minecraft:painting,type=!minecraft:leash_knot,type=!minecraft:end_crystal,type=!minecraft:text_display,type=!minecraft:block_display,distance=..10] at @s run function clawdcraft:polymorph_storm/roll
