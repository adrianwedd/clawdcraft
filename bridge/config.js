// Loads MineClawd configuration.
// Looks for, in order: $CLAWD_CONFIG, <repo root>/config.json.
// Copy config.example.json to config.json and edit it for your server.

const fs = require("fs");
const path = require("path");

const candidates = [
  process.env.CLAWD_CONFIG,
  path.join(__dirname, "..", "config.json"),
].filter(Boolean);

const file = candidates.find((f) => fs.existsSync(f));
if (!file) {
  console.error(
    "MineClawd: no config found. Copy config.example.json to config.json in the repo root and edit it."
  );
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(file, "utf8"));

for (const key of ["rcon", "logFile"]) {
  if (!cfg[key]) {
    console.error(`MineClawd: config is missing required key "${key}" (${file})`);
    process.exit(1);
  }
}

module.exports = {
  rcon: { host: "localhost", port: 25575, timeout: 30000, ...cfg.rcon },
  logFile: cfg.logFile,
  ops: cfg.ops || [],
  tmuxSession: cfg.tmuxSession || "clawd",
  claudeBin: cfg.claudeBin || "claude",
  model: cfg.model || "claude-sonnet-5",
  avatarTag: cfg.avatarTag || "clawd",
  configPath: file,
  root: path.join(__dirname, ".."),
};
