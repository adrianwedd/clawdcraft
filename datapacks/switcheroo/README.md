# Switcheroo Sword

A golden sword that swaps you with whatever you hit — ender-pearl chime,
purple particles, instant trading of places. Swap with the skeleton on the
ledge; swap yourself out of a corner.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:golden_sword[minecraft:custom_name={text:"Switcheroo Sword",color:"gold",italic:false},minecraft:lore=[{text:"Trading places!",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_switcheroo:1b},minecraft:max_stack_size=1]
```

**How it works:** same `player_hurt_entity` + `HurtTime:10s` pattern as the
puppy wand. The attacker gets a scratch `clawdcraft_swapper` tag, then a
marker records the victim's spot, victim teleports to the player, player
teleports to the marker, marker dies — all in one tick.

**Won't swap:** players, the ender dragon and wither (teleporting a boss
can wedge its fight), armor stands, items, item displays. The warden IS
allowed — swapping away from one is a legitimate escape. Note that tp
dismounts passengers, so swapping with a ridden mob leaves the rider
behind.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
