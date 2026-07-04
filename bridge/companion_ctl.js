#!/usr/bin/env node
// companion_ctl.js — set Clawd's companion mode (read by companion.js each tick).
//   node bridge/companion_ctl.js auto   # normal: follow last speaker, else roam+collect
//   node bridge/companion_ctl.js stay   # freeze in place (no follow, no roam)
//   node bridge/companion_ctl.js home   # go tidy up at the depot even if players are on
const fs = require("fs");
const path = require("path");
const CFG = require("./config");
const mode = process.argv[2];
if (!["auto", "stay", "home"].includes(mode)) {
  console.error("usage: node bridge/companion_ctl.js auto|stay|home");
  process.exit(1);
}
fs.writeFileSync(path.join(CFG.root, "companion_ctl.json"), JSON.stringify({ mode, ts: new Date().toISOString() }));
console.log(`companion mode: ${mode}`);
