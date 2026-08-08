# Rage Blade

A netherite sword that guards its owner: when they drop to 3 hearts or
less with hostile mobs within 8 blocks, it detonates automatically —
one-shots every hostile in range (dragon-growl, explosion flash), grants
8s Absorption II + 5s Regeneration so the trigger moment is survivable,
then goes on a 30-second cooldown. Works from anywhere in the inventory,
not just the hand.

**Deploy:** copy into `world/datapacks/`, then
`node bridge/admin_rcon.js "minecraft:reload"` (+ `datapack enable` if it
comes up disabled).

**Give one** (ops / RCON only — deliberately NOT in the gift.js allowlist):

```
minecraft:give <player> minecraft:netherite_sword[minecraft:custom_name={text:"Rage Blade",color:"dark_red",italic:false},minecraft:lore=[{text:"Protects you when all seems lost.",color:"gray",italic:false}],minecraft:enchantment_glint_override=true,minecraft:custom_data={clawdcraft_rage_blade:1b},minecraft:max_stack_size=1]
```

**How it works:** a tick function watches a `health`-criteria scoreboard
(`clawdcraft_hp`); at `..6` with no `clawdcraft_ragecd` cooldown and a
`#clawdcraft:rage_targets` mob within 8 blocks, it checks hotbar / main
inventory / offhand for `{clawdcraft_rage_blade:1b}` custom data and fires.

**Targets:** the `#clawdcraft:rage_targets` entity tag — all regular
hostiles including warden, creaking, and neutral-but-provokable types
(enderman, piglin, zombified piglin). Excludes the wither and ender
dragon (bosses stay bosses). Any custom-data-carrying item matches the
inventory check, so the "blade" could be re-themed onto another item
without touching functions.

**Format:** data format 94 (MC 1.21.11). Bump with the server jar.
