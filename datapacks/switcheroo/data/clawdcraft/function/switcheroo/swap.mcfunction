# Runs as the victim, at the victim. Classic marker swap: drop a marker on
# the victim's spot, send the victim to the player, send the player to the
# marker. Markers are invisible no-tick entities, killed the same tick.
# Bare tp/summon/kill are safe here — datapack functions always resolve
# vanilla; EssentialsX shadowing only affects the RCON/chat path (see
# puppy_wand/transform.mcfunction). tp dismounts passengers; that's
# vanilla behavior and acceptable here.
summon minecraft:marker ~ ~ ~ {Tags:["clawdcraft_swap_spot"]}
particle minecraft:portal ~ ~1 ~ 0.3 0.5 0.3 0.5 30
playsound minecraft:entity.enderman.teleport neutral @a[distance=..24] ~ ~ ~ 1 1.2
tp @s @p[tag=clawdcraft_swapper]
execute at @e[type=minecraft:marker,tag=clawdcraft_swap_spot,limit=1] run tp @p[tag=clawdcraft_swapper] ~ ~ ~
execute at @p[tag=clawdcraft_swapper] run particle minecraft:portal ~ ~1 ~ 0.3 0.5 0.3 0.5 30
kill @e[type=minecraft:marker,tag=clawdcraft_swap_spot]
