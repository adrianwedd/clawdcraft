# Runs as the rider when the timer hits zero. The slow falling applied at
# bubble time keeps running for the drift down — no fall damage.
tag @s remove clawdcraft_bubbled
scoreboard players reset @s clawdcraft_bubble
particle minecraft:bubble_pop ~ ~0.8 ~ 0.4 0.5 0.4 0.1 30
playsound minecraft:entity.fishing_bobber.splash neutral @a[distance=..24] ~ ~ ~ 1 1.5
