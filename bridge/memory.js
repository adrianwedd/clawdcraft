#!/usr/bin/env node
// memory.js — Clawd's per-player long-term memory (survives /clear and
// session recreation). Used by the Clawd tmux session.
//
// Usage:
//   node bridge/memory.js get <player>            # print saved notes
//   node bridge/memory.js set <player> <note...>  # append a note (keeps last 20)
//   node bridge/memory.js forget <player>         # delete all notes for a player

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "clawd_memory");
const MAX_NOTES = 20;

const [cmd, player, ...rest] = process.argv.slice(2);
if (!cmd || !player || !/^[A-Za-z0-9_.]{1,32}$/.test(player)) {
  console.error("usage: node memory.js get|set|forget <player> [note...]");
  process.exit(1);
}
const file = path.join(DIR, `${player}.json`);

if (cmd === "get") {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    console.log(data.notes.map((n) => `- ${n}`).join("\n") || "(no notes)");
  } catch {
    console.log("(no notes yet for this player)");
  }
} else if (cmd === "set") {
  const note = rest.join(" ").trim();
  if (!note) { console.error("set requires a note"); process.exit(1); }
  fs.mkdirSync(DIR, { recursive: true });
  let data = { notes: [] };
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
  data.notes.push(`[${new Date().toISOString().slice(0, 10)}] ${note}`);
  data.notes = data.notes.slice(-MAX_NOTES);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`remembered (${data.notes.length}/${MAX_NOTES} notes for ${player})`);
} else if (cmd === "forget") {
  try { fs.unlinkSync(file); console.log(`forgot everything about ${player}`); }
  catch { console.log("(nothing to forget)"); }
} else {
  console.error(`unknown command '${cmd}' — use get, set, or forget`);
  process.exit(1);
}
