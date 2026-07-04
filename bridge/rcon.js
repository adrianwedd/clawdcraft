#!/usr/bin/env node
// rcon.js — RCON client: one-shot command or interactive mode.
// Usage: node rcon.js "list"     |     node rcon.js   (interactive)

const { createRcon } = require("./rcon_helper");

const rcon = createRcon();

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    await rcon.connect();
    console.log("RCON connected. Type commands (Ctrl+C to exit):");
    const readline = require("readline");
    const rl = readline.createInterface({ input: process.stdin });
    rl.on("line", async (line) => {
      const cmd = line.trim();
      if (!cmd) return;
      try {
        const response = await rcon.send(cmd);
        if (response) console.log(response);
      } catch (e) {
        console.error("Error:", e.message);
      }
    });
    rl.on("close", () => {
      rcon.end();
      process.exit(0);
    });
  } else {
    await rcon.connect();
    const response = await rcon.send(args.join(" "));
    if (response) console.log(response);
    rcon.end();
  }
}

main().catch((e) => {
  console.error("RCON error:", e.message);
  process.exit(1);
});
