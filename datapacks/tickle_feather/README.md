# Tickle Feather

A feather that leaves whatever you bonk too busy giggling to fight for 30
seconds — happy sparkles, chirpy squeaks, harmless wobbling. The pacifist
option.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:feather[minecraft:custom_name={text:"Tickle Feather",color:"yellow",italic:false},minecraft:lore=[{text:"Coochie coochie coo.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_tickle_feather:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as
the puppy wand. The victim gets Weakness 255 (zeroes melee damage) +
Slowness III for 30s, a `clawdcraft_tickled` tag, and a 600-tick score; a
tick function sparkles giggles until it hits zero. Re-tickling refreshes
the timer.

**Honest limitation:** weakness only disarms melee. Skeletons, bogged,
strays, pillagers, blazes, ghasts and witches still attack at range — the
feather works best on the bitey ones (zombies, spiders, wolves...).

**Won't tickle:** players, creepers (a tickled creeper that still explodes
is a betrayal, so they're excluded), bosses (ender dragon / wither /
warden — ranged attacks ignore weakness anyway), armor stands, items,
item displays.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
