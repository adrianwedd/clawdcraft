# Runs as the victim, at the victim: roll a d10, assign random silly CustomName.
execute store result score @s clawdcraft_name_roll run random value 1..10
particle minecraft:enchant ~ ~1 ~ 0.5 0.5 0.5 0.5 30
particle minecraft:end_rod ~ ~1 ~ 0.3 0.4 0.3 0.05 10
playsound minecraft:entity.villager.work_cartographer neutral @a[distance=..24] ~ ~ ~ 1 1.2
execute if score @s clawdcraft_name_roll matches 1 run data merge entity @s {CustomName:'{"text":"Sir Squeaks"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 2 run data merge entity @s {CustomName:'{"text":"Lord Wiggles"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 3 run data merge entity @s {CustomName:'{"text":"Draco Malfoy-ish III"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 4 run data merge entity @s {CustomName:'{"text":"Big Chungus Jr"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 5 run data merge entity @s {CustomName:'{"text":"Kevin"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 6 run data merge entity @s {CustomName:'{"text":"Baron Von Fluff"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 7 run data merge entity @s {CustomName:'{"text":"Captain Noodlehead"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 8 run data merge entity @s {CustomName:'{"text":"Professor McSnuggles"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 9 run data merge entity @s {CustomName:'{"text":"Count Chocula"}',CustomNameVisible:1b}
execute if score @s clawdcraft_name_roll matches 10 run data merge entity @s {CustomName:'{"text":"Soggy Waffle"}',CustomNameVisible:1b}
scoreboard players reset @s clawdcraft_name_roll
