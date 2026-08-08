# Runs as the victim, at the victim: poof out, puppy in.
# Bare kill/summon are safe here — datapack functions always resolve vanilla
# commands; EssentialsX shadowing only affects the RCON/chat command path.
particle minecraft:poof ~ ~0.6 ~ 0.25 0.4 0.25 0.05 25
particle minecraft:heart ~ ~1.2 ~ 0.4 0.3 0.4 1 6
playsound minecraft:entity.wolf.ambient neutral @a[distance=..24] ~ ~ ~ 1 1.8
summon minecraft:wolf ~ ~ ~ {Age:-24000,PersistenceRequired:1b}
kill @s
