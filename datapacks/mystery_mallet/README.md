# Mystery Mallet

The Puppy Wand as a slot machine: a wooden mallet that turns whatever you
bonk into a RANDOM harmless critter — chicken, frog, armadillo, cat,
rabbit, baby goat, baby camel, or baby sniffer. Level-up jingle, poof,
prize.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:wooden_axe[minecraft:custom_name={text:"Mystery Mallet",color:"dark_purple",italic:false},minecraft:lore=[{text:"What will it be?!",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_mystery_mallet:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as
the puppy wand; `random value 1..8` stored into a scoreboard picks the
summon. No axolotl on the roster — they dehydrate and die on land, which
is the wrong kind of surprise. All prizes get PersistenceRequired.

**Won't transform:** players, wolves AND cats (nobody gambles away a tamed
pet), bosses (ender dragon / wither / warden), armor stands, items, item
displays. Everything else — villagers included — is fair game, so hand it
out accordingly.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
