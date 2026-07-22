# Repository Guidelines

## Project Structure & Module Organization

`bridge/` contains the CommonJS Node.js integration between Minecraft chat, RCON, tmux, and Claude Code. Keep focused behavior in modules such as `ambient.js`, `companion.js`, and `chat_budget.js`; the main process is `bridge/clawd.js`. Offline tests live beside their modules as `bridge/*.test.js`. `session/` holds the launcher and Clawd system prompt, `packs/` contains resource-pack sources and the Python builder, and `systemd/` provides the service template. Read `STRATEGY.md` and `HANDOFF.md` before changing behavior: this checkout is also the live installation.

## Build, Test, and Development Commands

- `cd bridge && npm ci`: install the locked Node.js dependencies.
- `cd bridge && CLAWD_CONFIG=../config.example.json npm test`: run offline guard and chat-budget tests without local secrets.
- `node bridge/clawd.js --test "TestPlayer: clawd hello"`: inject a synthetic chat line; requires a local `config.json` and runtime services.
- `node bridge/clawd.js`: run the bridge in the foreground for manual testing.
- `python3 packs/tools/build_packs.py --mc-version 1.21.11`: generate Java and Bedrock packs under ignored `packs/build/`; requires Pillow and network access on the first run.

Do not restart the live `clawd` service unless the task explicitly calls for deployment.

## Coding Style & Naming Conventions

Match the existing style: two-space indentation and semicolons in JavaScript, four spaces and standard `snake_case` in Python, and `set -euo pipefail` in shell scripts. Use `camelCase` for JavaScript functions and variables, `UPPER_SNAKE_CASE` for constants, and lowercase descriptive module names. There is no configured formatter or linter, so keep diffs small and follow neighboring code. Preserve `minecraft:` command prefixes where used; plugin command shadowing is a known hazard.

## Testing Guidelines

Add deterministic, offline tests beside the affected module using the `*.test.js` suffix. Cover both allowed and rejected paths for safety controls, and avoid real clocks, RCON connections, tmux sessions, or network calls. Run the command above before submitting changes; manually exercise `--test` only when configuration-dependent behavior changes.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects consistent with history, for example `Gate cross-dimension companion teleports` or `ROADMAP.md: clarify feature order`. Keep each commit scoped to one concern. Pull requests should explain user-visible behavior, safety implications, configuration changes, and verification performed; link the relevant issue and include screenshots or logs when resource-pack visuals or in-game behavior changes.

## Security & Configuration

Copy `config.example.json` to ignored `config.json`; never commit RCON passwords, player state, logs, or generated packs. Changes to `rcon_guard.js`, gift allowlists, or `session/clawd_prompt.md` require explicit denial-path tests and careful review.
