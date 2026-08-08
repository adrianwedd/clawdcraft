# Every tick: ambient sparkle marking frozen mobs. No timer — freezes are
# permanent until re-struck. No-ops instantly when nothing is tagged.
execute at @e[tag=clawdcraft_frozen] run particle minecraft:snowflake ~ ~1 ~ 0.3 0.5 0.3 0 1
