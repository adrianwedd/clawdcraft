# Runs as the attacking player, same tick as the hit (advancement reward).
# No HurtTime victim-find needed — the gust is centered on the player, not
# the victim, so ANY landed bonk triggers it. Cooldown-gated so
# spam-clicking doesn't strobe the server.
advancement revoke @s only clawdcraft:breeze_bat_hit
execute unless score @s clawdcraft_batcd matches 1.. at @s run function clawdcraft:breeze_bat/blow
