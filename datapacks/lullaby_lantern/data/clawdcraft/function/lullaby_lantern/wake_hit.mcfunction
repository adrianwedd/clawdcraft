# Runs as the attacker when hurting a sleeping entity with anything OTHER than the
# lantern itself (the advancement negates the lantern's custom_data) — otherwise
# re-bonking a sleeping mob with the lantern raced against this and gave a
# nondeterministic result. Finds the sleeping victim and wakes it up.
advancement revoke @s only clawdcraft:lullaby_lantern_wake
execute at @s as @e[tag=clawdcraft_sleeping,distance=..8,limit=1,sort=nearest,nbt={HurtTime:10s}] at @s run function clawdcraft:lullaby_lantern/wake
