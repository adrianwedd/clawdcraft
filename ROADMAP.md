# ROADMAP

Feature direction for ClawdCraft. **HANDOFF.md** is current state, **STRATEGY.md**
is doctrine (it wins on any conflict), this file is where we're going.
Issues live at https://github.com/adrianwedd/clawdcraft/issues — one per item.

## Constraints that shape everything

- **Tokens are the operating cost.** Every brain turn is real money; features
  should default to bridge-side (free) and spend brain turns only where a
  canned line can't be charming enough.
- **Safety is enforced in code, never prompt** (gift.js / rcon_guard.js
  pattern). Any feature granting Clawd new reach needs its enforcement point
  named before it's built.
- **Bedrock parity.** Half the audience is on Geyser: no glowing outlines, no
  item_displays — express everything in particles, sounds, and movement.
- **It runs on a Pi 5** next to the server itself. Cheap ticks, no heavy deps.
- **The audience is kids.** Warm, brief, safe > clever.

## Now (next sessions)

| # | Feature | Why now |
|---|---------|---------|
| [#12](https://github.com/adrianwedd/clawdcraft/issues/12) | Enable + tune ambient presence in production | Built and live-but-off; needs an op in-game to switch on and observe. Human-gated. |
| [#11](https://github.com/adrianwedd/clawdcraft/issues/11) | Prompt line: refusals are final | One line; stops the model burning turns retrying guard-blocked commands. Safety surface — owner go-ahead required. |
| [#6](https://github.com/adrianwedd/clawdcraft/issues/6) | Brain-turn metering + `clawd usage` | Tuning #12 and the chat budget properly needs the numbers. |

**Done since last pass:** [#1](https://github.com/adrianwedd/clawdcraft/issues/1) per-player token budget for direct chat — shipped `878b5d6`.

## Next (make Clawd more alive, mostly token-free)

| # | Feature |
|---|---------|
| [#3](https://github.com/adrianwedd/clawdcraft/issues/3) | Mood system — bridge-side state via particles + sounds |
| [#4](https://github.com/adrianwedd/clawdcraft/issues/4) | Hide-and-seek — token-free game mode |
| [#5](https://github.com/adrianwedd/clawdcraft/issues/5) | Scheduled ambient life — dawn/dusk/weather rituals |
| [#2](https://github.com/adrianwedd/clawdcraft/issues/2) | Quest engine v1 — data-defined quests, gift.js-enforced rewards |
| [#7](https://github.com/adrianwedd/clawdcraft/issues/7) | Watchdog — detect and recover a wedged brain/bridge |

## Later

| # | Feature |
|---|---------|
| [#8](https://github.com/adrianwedd/clawdcraft/issues/8) | Build log (phase 1) + `clawd undo` (phase 2) |
| [#9](https://github.com/adrianwedd/clawdcraft/issues/9) | Discord relay — read-only parental oversight first |
| [#10](https://github.com/adrianwedd/clawdcraft/issues/10) | Seasonal pack styles (halloween/winter crab) |

## Gated — build only when the trigger fires (STRATEGY.md graveyard)

These were considered and deliberately deferred. Don't relitigate; watch for
the trigger.

- **Structured memory** — only when plain per-player JSON notes demonstrably
  fail (lost context, note-count pressure). Until then memory.js is enough.
- **MCP server** — only if the tmux bridge creaks (injection races, session
  instability). The tmux design is load-bearing for attach-and-steer safety.
- **ClawdBody Paper plugin** (true native movement via the Paper Pathfinder
  API) — only if the 425ms glide-tp still feels teleport-y after the movement
  polish already shipped. Decompiling CraftGPT proved there's no cheaper
  shortcut: vanilla allay AI flies to build height (the y=261 incident), so
  native movement means an in-process plugin, not NBT tricks.

## Non-goals

- Headless `claude -p` (kills attach-anytime oversight and the approval gate)
- Combat, griefing tools, or anything that moves/kills player builds or mobs
  beyond Clawd's own body
- Gift/reward paths that bypass the gift.js allowlist
