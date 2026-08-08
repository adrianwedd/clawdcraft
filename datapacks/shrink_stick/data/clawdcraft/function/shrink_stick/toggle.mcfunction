# Runs as the victim. Same scratch-tag dance as the asparagus toggle: a
# bare if-smol-grow / if-not-smol-shrink pair would re-shrink in the same
# tick, because grow removes the tag the second check reads.
execute if entity @s[tag=clawdcraft_smol] run tag @s add clawdcraft_regrow
execute if entity @s[tag=clawdcraft_regrow] run function clawdcraft:shrink_stick/grow
execute unless entity @s[tag=clawdcraft_regrow] run function clawdcraft:shrink_stick/shrink
tag @s remove clawdcraft_regrow
