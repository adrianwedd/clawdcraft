# Runs as the victim. The clawdcraft_thaw scratch tag exists because a bare
# if-frozen-unfreeze / if-not-frozen-freeze pair would re-freeze in the same
# tick: unfreeze removes the frozen tag, so the second line's check would
# pass again. The scratch tag records the decision before acting on it.
execute if entity @s[tag=clawdcraft_frozen] run tag @s add clawdcraft_thaw
execute if entity @s[tag=clawdcraft_thaw] run function clawdcraft:asparagus/unfreeze
execute unless entity @s[tag=clawdcraft_thaw] run function clawdcraft:asparagus/freeze
tag @s remove clawdcraft_thaw
