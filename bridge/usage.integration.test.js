// Execute the actual private-command handler; transports/world effects are denied.
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const os = require("os");
const assert = require("assert/strict");
const U = require("./usage");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(process.env.CLAWD_HANDLER_SOURCE || path.join(__dirname, "clawd.js"), "utf8");
const boundary = source.indexOf("// ─── Main ─");
assert(boundary > 0, "recognised bridge entrypoint boundary required");
const handlerSource = source.slice(0, boundary) + "\nmodule.exports = { handle };";
const NOW = Date.parse("2026-10-24T12:00:00Z");

async function capture(player, unreadable = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-usage-handler-"));
  const file = path.join(dir, "clawd_usage.jsonl");
  const calls = [];
  let forbidden = 0;
  const deny = () => { forbidden++; throw Error("world/tmux/process effect forbidden"); };
  if (unreadable) fs.mkdirSync(file);
  else {
    const meter = U.makeMeter({ file, now: () => NOW });
    meter.record("direct", "FixturePlayer");
    meter.record("event");
  }
  const fakeRcon = { connect: async () => {}, sendRL: async (cmd) => { calls.push(cmd); return ""; } };
  const config = { ...require("../config.example.json"), root: dir, ops: ["FixtureOp"] };
  const shim = (id) => {
    if (id === "./config") return config;
    if (id === "child_process") return { spawn: deny, execFile: deny };
    if (id === "./rcon_helper") return { createRcon: () => fakeRcon };
    if (["./companion", "./avatar", "./ambient"].includes(id)) return new Proxy({}, { get: () => deny });
    if (id === "./usage") return { ...U, opUsageReply: (p, role, opts) => U.opUsageReply(p, role, { ...opts, now: NOW }) };
    return id.startsWith("./") ? require(path.join(__dirname, id.slice(2))) : require(id);
  };
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return NOW; } }
  const context = { require: shim, console: { log() {}, error() {} }, process: { env: {}, on() {} },
    __dirname, setTimeout: deny, clearTimeout() {}, Buffer, Date: FixedDate, module: { exports: {} } };
  try {
    vm.runInNewContext(handlerSource, context, { filename: "production-clawd-handler.js" });
    await context.module.exports.handle(player, "clawd usage");
    assert.equal(forbidden, 0);
    if (!unreadable) assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    return calls;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

(async () => {
  const op = await capture("FixtureOp");
  assert.equal(op.length, 1);
  assert(op[0].startsWith('tellraw @a[name="FixtureOp",limit=1] '));
  assert(op[0].includes("2 brain handoffs"));
  const player = await capture("FixtureNonOp");
  assert.equal(player.length, 1);
  assert(player[0].startsWith('tellraw @a[name="FixtureNonOp",limit=1] '));
  assert(!player[0].includes("2 brain handoffs"));
  assert.equal((await capture('Bad"Name')).length, 0);
  const error = await capture("FixtureOp", true);
  assert.equal(error.length, 1);
  assert(error[0].startsWith('tellraw @a[name="FixtureOp",limit=1] '));
  assert(!error[0].includes("2 brain handoffs"));
  console.log("usage integration: 4 private handler cases passed; zero companion, tmux or real RCON effects");
})().catch((error) => { console.error(error); process.exitCode = 1; });
