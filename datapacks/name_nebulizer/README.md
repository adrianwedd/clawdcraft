# Name Nebulizer

A whimsical name tag that rebrands mobs on impact: bonk a mob to give it a random
silly name from a curated list of absurd titles (e.g. "Sir Squeaks", "Draco Malfoy-ish III", "Big Chungus Jr").

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:name_tag[minecraft:custom_name={text:"Name Nebulizer",color:"light_purple",italic:false},minecraft:lore=[{text:"Rebrand your enemies.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_name_nebulizer:1b},minecraft:max_stack_size=1]
```

**How it works:** the `player_hurt_entity` advancement triggers on hit; a `random value 1..10` scoreboard roll selects and applies a new visible `CustomName` to the nearest victim (`HurtTime:10s`).

**Won't affect:** players, armor stands, items, item displays, bosses (ender dragon, wither, warden).

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
