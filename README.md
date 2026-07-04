# ClawdCraft 🦀

Put **Claude Code inside your Minecraft server** as *Clawd* — a friendly in-game
creature players talk to in chat. Clawd answers, remembers players, hands out
small gifts, casts effects, and builds things — powered by a real, persistent
Claude Code session you can watch and steer in tmux.

```
Player types:            clawd build me a fountain
                              │
logs/latest.log  ──tail──►  bridge/clawd.js  ──tmux send-keys──►  Claude Code session
                              │                                    (tmux: clawd)
                         allay avatar                                   │
                         glows + chimes                    runs bridge/say.js, rcon.js,
                                                           gift.js, memory.js via RCON
                                                                        │
                                                          <Clawd> Here you go! *sparkles*
```

## Why a tmux session instead of headless `claude -p`?

- **Attach anytime**: `tmux attach -t clawd` shows Clawd thinking in real time;
  type into it like any Claude Code session.
- **Human-in-the-loop safety**: Clawd is only pre-approved to run four scripts
  (say/rcon/gift/memory). Anything else waits for a human to approve in tmux.
- **One continuous conversation** that survives bridge restarts.

## Requirements

- A [PaperMC](https://papermc.io) server (or any server that logs vanilla-style
  chat lines) with RCON enabled
- Node.js 18+, tmux, and the [Claude Code](https://claude.com/claude-code) CLI
  (logged in) on the same machine
- Optional: Geyser/Floodgate for Bedrock cross-play (fully supported — see notes)

## Install

```bash
git clone https://github.com/you/clawdcraft && cd clawdcraft
cd bridge && npm install && cd ..
cp config.example.json config.json   # then edit: rcon password, log path, ops
node bridge/clawd.js                 # run in foreground to try it
```

For always-on operation, copy `systemd/clawd.service.example` to
`/etc/systemd/system/clawd.service`, adjust user/paths, then:

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now clawd
```

Test without joining the game:

```bash
node bridge/clawd.js --test "YourName: clawd hello"
```

## In game

| Say | What happens |
|-----|--------------|
| `clawd <anything>` | Talk to Clawd — questions, requests, builds |
| `clawd come` | Avatar flies to you (free, no tokens) |
| `clawd follow me` | Companion mode: glides along beside you (free) |
| `clawd stay` | Companion freezes in place (free) |
| `clawd go home` | Companion returns to its depot and tidies up (free) |
| `clawd reset` | Wipes the conversation (`/clear`) |

Players listed in `config.json` `ops` are tagged `(op)` and may ask for world
changes; everyone else gets chat, gifts, and charm only.

## The avatar

Clawd is an invulnerable, hovering allay (`NoAI` — allays wander to build
height otherwise). It glows while thinking (Java), chimes and sparkles
(both editions), and emotes with particles/sounds/hops when it speaks.

**Custom look**: `packs/tools/build_packs.py` builds a Java resource pack and a
Bedrock `.mcpack` that make Clawd look like the coral crab mascot
(`packs/reference/clawd.webp`):

```bash
cd packs/tools && python3 build_packs.py --mc-version <your MC version>
```

The default `--style crab` generates both editions' assets from one cube spec,
and wild allays are untouched on both. Bedrock gets true custom allay geometry
(a crab with swinging claws — vanilla animations still drive the bones),
applied only to allays named "Clawd" via a name-keyed render controller. Java —
where vanilla packs can't reshape entities — gets a crab *item model* that the
bridge floats over the allay as an `item_display` (set `"avatarModel": "crab"`
in `config.json` **after** deploying the packs), scaled to fully enclose and
hide the carrier; the pack overrides no vanilla assets at all. `--style
classic` instead does a plain coral recolor of all allays with no shape change
and needs no config flag.

- Java: host `build/clawdcraft-java.zip` anywhere public, set `resource-pack=`
  and `resource-pack-sha1=` in `server.properties` (the script prints the sha1).
- Bedrock: drop `build/clawdcraft-bedrock.mcpack` into
  `plugins/Geyser-Spigot/packs/`. Restart the server after either change.

**Companion behaviors** (`bridge/companion.js`, optional): with a `companion`
section in `config.json` (see `config.example.json`), the allay gets a body of
its own — it follows whoever last spoke to Clawd with smooth glide-teleports,
and when they log off it flies home to a depot platform, patrols, and sorts
dropped items into per-item-type chests (allocating new chest+hopper+sign
cells as needed; items near players are left alone). All movement is plain
RCON from the bridge — the allay keeps `NoAI`, and none of it costs tokens.
Modes: `node bridge/companion_ctl.js auto|stay|home`, or the in-game phrases
above.

## Safety model

- The Claude session's *only* pre-approved powers are the four bridge scripts.
- Gifts are enforced **in code** (`bridge/gift.js` allowlist), not in the prompt —
  players can't sweet-talk Clawd into a netherite sword.
- Op-only world changes are prompt-enforced; treat every op as someone you'd
  hand RCON to.
- Hard rules (no stop/op/ban/broad-kill) live in `session/clawd_prompt.md`.
- Chat is relayed to Anthropic's API and consumes your Claude Code usage;
  the `clawd` prefix keeps that opt-in per message.

## Gotchas we learned the hard way

- **EssentialsX shadows `tp`/`kill`** — even inside `execute ... run`. Use
  `minecraft:tp` / `minecraft:kill` in anything RCON-driven.
- **Failed commands often return empty strings over RCON**; verify with
  `execute if entity ...` instead of parsing error text.
- **Bedrock players can't chat at all** unless `enforce-secure-profile=false`
  (they have no Mojang signing key; their chat logs with a `[Not Secure]` tag).
- **Geyser doesn't render glowing outlines** — that's why emotes use particles
  and sounds.

## License

MIT (code). The Clawd mascot likeness belongs to Anthropic — the reference
image in `packs/reference/` is from
[homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons);
review rights before redistributing generated art.
