# Runs as a low-health player with hostiles nearby. Fires if the blade is
# ANYWHERE in their inventory — hotbar, main inventory, or offhand — so it
# protects even while they're holding a pickaxe. Lines 2-3 are guarded by
# the cooldown that rage() sets, so two blades can't double-fire.
execute if items entity @s hotbar.* *[minecraft:custom_data~{clawdcraft_rage_blade:1b}] run function clawdcraft:rage_blade/rage
execute unless score @s clawdcraft_ragecd matches 1.. if items entity @s inventory.* *[minecraft:custom_data~{clawdcraft_rage_blade:1b}] run function clawdcraft:rage_blade/rage
execute unless score @s clawdcraft_ragecd matches 1.. if items entity @s weapon.offhand *[minecraft:custom_data~{clawdcraft_rage_blade:1b}] run function clawdcraft:rage_blade/rage
