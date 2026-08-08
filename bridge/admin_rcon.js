#!/usr/bin/env node
// admin_rcon.js — UNGUARDED one-shot RCON for human-supervised maintenance
// work (ops at a terminal, Claude Code maintenance sessions). Exists because
// rcon.js routes every scripted command through the rcon_guard denylist —
// the right default for Clawd's pre-approved path — which also blocks
// legitimate admin verbs (e.g. minecraft:reload after a datapack deploy)
// from sessions that DO have a human watching.
//
// The capability boundary is Clawd's --allowedTools in
// session/clawd_session.sh: this file is NOT on that list and MUST NEVER be
// added to it. If Clawd tries to run it, the human at the tmux session gets
// an approval prompt — that is the design working, not a bug.
//
// Belt and braces: refuses to run inside Clawd's brain session, the only
// environment that exports CLAWD_RCON_ECHO (see clawd_session.sh).
//
// Usage: node bridge/admin_rcon.js "minecraft:reload"

const { createRcon } = require("./rcon_helper");

async function main() {
  if (process.env.CLAWD_RCON_ECHO) {
    console.error("refused: admin_rcon.js must not run inside Clawd's brain session");
    process.exit(2);
  }
  const cmd = process.argv.slice(2).join(" ").trim();
  if (!cmd) {
    console.error('Usage: node bridge/admin_rcon.js "<command>"');
    process.exit(1);
  }
  const rcon = createRcon();
  await rcon.connect();
  const response = await rcon.send(cmd);
  if (response) console.log(response);
  await rcon.end().catch(() => {});
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
