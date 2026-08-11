# Runs as the attacking player, same tick as the hit (advancement reward).
advancement revoke @s only clawdcraft:polymorph_storm_hit
execute unless score @s clawdcraft_stormcd matches 1.. at @s run function clawdcraft:polymorph_storm/trigger
