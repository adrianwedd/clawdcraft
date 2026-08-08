# Runs as the about-to-die blade owner, at them. Cooldown first so the
# other try-lines can't re-enter. Absorption + regen so surviving the
# trigger moment is guaranteed rather than a race.
scoreboard players set @s clawdcraft_ragecd 600
effect give @s minecraft:absorption 8 1 true
effect give @s minecraft:regeneration 5 0 true
particle minecraft:explosion_emitter ~ ~1 ~ 0 0 0 1 1
particle minecraft:angry_villager ~ ~1 ~ 1.5 1 1.5 0 30
playsound minecraft:entity.ender_dragon.growl player @a[distance=..32] ~ ~ ~ 1 1.4
tellraw @a[distance=..32] {text:"The Rage Blade awakens!",color:"dark_red",bold:true}
execute as @e[type=#clawdcraft:rage_targets,distance=..8] at @s run function clawdcraft:rage_blade/smite
