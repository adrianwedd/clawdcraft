#!/usr/bin/env node
// rcon.js — RCON client: one-shot command or interactive mode.
// Usage: node rcon.js "list"     |     node rcon.js   (interactive)
//
// One-shot commands (and piped stdin) pass through the rcon_guard denylist —
// that's the path Clawd is pre-approved to run. Interactive mode from a real
// terminal is a human and is unguarded; use it for admin commands.
//
// Op visibility: when CLAWD_RCON_ECHO is set (exported by
// session/clawd_session.sh, i.e. only inside Clawd's brain session), every
// executed command is echoed to online ops as a quiet gray line. This is the
// selective replacement for broadcast-rcon-to-ops=true: ops see what Clawd
// deliberately runs, but not the bridge's movement ticks (companion glide,
// skin sync, emote hops), which use the bridge's internal connection and
// never pass through this script.

const { createRcon } = require("./rcon_helper");
const { check } = require("./rcon_guard");
const CFG = require("./config");

const rcon = createRcon();

async function echoToOps(cmd) {
  if (!process.env.CLAWD_RCON_ECHO) return;
  const shown = cmd.length > 100 ? cmd.slice(0, 100) + "…" : cmd;
  const payload = JSON.stringify({ text: `⚙ Clawd: ${shown}`, color: "dark_gray", italic: true });
  for (const op of CFG.ops) {
    // name= must be quoted: Bedrock (Floodgate) names start with a dot.
    await rcon.send(`tellraw @a[name=${JSON.stringify(String(op))},limit=1] ${payload}`).catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const guarded = !process.stdin.isTTY; // piped stdin is script-driven, not a human
    await rcon.connect();
    console.log(guarded ? "RCON connected (guarded: piped input)." : "RCON connected. Type commands (Ctrl+C to exit):");
    const readline = require("readline");
    const rl = readline.createInterface({ input: process.stdin });
    rl.on("line", async (line) => {
      const cmd = line.trim();
      if (!cmd) return;
      if (guarded) {
        const v = check(cmd);
        if (!v.ok) {
          console.error(`refused: ${v.reason}`);
          return;
        }
      }
      try {
        const response = await rcon.send(cmd);
        if (response) console.log(response);
        await echoToOps(cmd);
      } catch (e) {
        console.error("Error:", e.message);
      }
    });
    rl.on("close", () => {
      rcon.end();
      process.exit(0);
    });
  } else {
    const cmd = args.join(" ");
    const v = check(cmd);
    if (!v.ok) {
      console.error(`refused: ${v.reason}`);
      console.error("(the guard covers scripted use; a human can run `node bridge/rcon.js` interactively from a terminal)");
      process.exit(2);
    }
    await rcon.connect();
    const response = await rcon.send(cmd);
    if (response) console.log(response);
    await echoToOps(cmd);
    rcon.end();
  }
}

main().catch((e) => {
  console.error("RCON error:", e.message);
  process.exit(1);
});
