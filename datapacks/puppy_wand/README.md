# Puppy Wand

A bone that turns whatever you bonk into a baby wolf (hearts, poof, yip).

**Deploy:** copy this directory into `world/datapacks/` on the server, then
`minecraft:reload` (never bare `reload` — that's Bukkit's plugin reload).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:bone[minecraft:custom_name={text:"Puppy Wand",color:"gold",italic:false},minecraft:lore=[{text:"Bonk a mob. Get a puppy.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_puppy_wand:1b},minecraft:max_stack_size=1]
```

**How it works:** a hidden `player_hurt_entity` advancement fires when the
mainhand bone carries `{clawdcraft_puppy_wand:1b}` custom data; its reward
function finds the victim by `HurtTime:10s` (only true the tick damage lands)
and swaps it for a `{Age:-24000}` wolf.

**Won't transform:** players, wolves (protects tamed dogs), bosses
(ender dragon / wither / warden), armor stands, items, item displays.
Everything else — including villagers and other tamed pets — is fair game,
so hand it out accordingly.

**Format:** `min_format`/`max_format` data format 94 (MC 1.21.11, from the
server jar's `version.json`). Bump when the server jar moves.
