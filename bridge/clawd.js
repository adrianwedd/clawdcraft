#!/usr/bin/env node
// clawd.js — MineClawd bridge: Claude Code living in your Minecraft server.
//
// Watches server chat for messages addressed to "clawd" and types them into a
// persistent *interactive* Claude Code session running in tmux (auto-created
// from session/clawd_session.sh). That session answers in game chat itself by
// running bridge/say.js, and can act in the world via bridge/rcon.js.
//
// Clawd appears in-world as an invulnerable allay (tag from config) that flies
// to whoever is talking to it and glows/chimes while thinking.
//
// Watch or steer Clawd's brain live:  tmux attach -t clawd
//
// Usage:
//   node bridge/clawd.js                     # run the bridge (see systemd/)
//   node bridge/clawd.js --test "Name: msg"  # inject one synthetic chat line
//
// In game:
//   clawd <anything>    talk to Clawd / ask for help / ask for builds
//   clawd come          call the avatar to you (no tokens)
//   clawd reset         clear the Clawd session's context (/clear)

const { spawn, execFile } = require("child_process");
const path = require("path");
const CFG = require("./config");
const { createRcon, sleep } = require("./rcon_helper");

const LAUNCHER = path.join(CFG.root, "session/clawd_session.sh");
const OPS = new Set(CFG.ops);
const AVATAR = `@e[type=minecraft:allay,tag=${CFG.avatarTag},limit=1]`;

const ts = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${ts()}]`, ...a);

// ─── RCON ────────────────────────────────────────────────────────────────────
let rcon = null;
async function rc(cmd) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (!rcon) { rcon = createRcon(); await rcon.connect(); }
      return await rcon.sendRL(cmd);
    } catch (e) {
      log(`RCON error (${e.message}), reconnecting...`);
      try { rcon?.end(); } catch {}
      rcon = null;
      await sleep(1500);
    }
  }
  return "";
}

async function say(text) {
  log(`<Clawd> ${text}`);
  await rc(`tellraw @a ["",{"text":"<Clawd> ","color":"gold","bold":true},${JSON.stringify({ text, color: "yellow" })}]`);
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
// NB: EssentialsX shadows bare `tp`/`kill` (even inside `execute ... run`) and
// chokes on selectors — always use the `minecraft:` prefix for those.
// NoAI+NoGravity: allays wander to build height in minutes otherwise; the
// avatar hovers where placed and only moves when we tp it.
async function ensureAvatar(player) {
  const probe = await rc(`execute if entity @e[type=minecraft:allay,tag=${CFG.avatarTag}]`);
  if (/Test passed/i.test(probe)) {
    await rc(`execute at ${player} run minecraft:tp ${AVATAR} ~1.5 ~1 ~1.5`);
  } else {
    await rc(`execute at ${player} run summon minecraft:allay ~1.5 ~1 ~1.5 {CustomName:"Clawd",Tags:["${CFG.avatarTag}"],PersistenceRequired:1b,Invulnerable:1b,NoAI:1b,NoGravity:1b}`);
  }
}

// Glow is Java-only (Geyser doesn't render outlines), so also particles+chime
// which Bedrock players do see/hear.
const startThinking = async () => {
  await rc(`effect give ${AVATAR} minecraft:glowing infinite 0 true`);
  await rc(`execute at ${AVATAR} run particle minecraft:enchant ~ ~0.5 ~ 0.3 0.3 0.3 0.05 30`);
  await rc(`execute at ${AVATAR} run playsound minecraft:block.amethyst_block.chime neutral @a ~ ~ ~ 0.8 0.9`);
};

// ─── tmux session (Clawd's brain) ────────────────────────────────────────────
function tmux(...args) {
  return new Promise((resolve) =>
    execFile("tmux", args, (err, stdout) => resolve(err ? null : stdout))
  );
}

async function paneReady() {
  const pane = await tmux("capture-pane", "-t", CFG.tmuxSession, "-p");
  return pane !== null && pane.includes("❯");
}

async function ensureSession() {
  if ((await tmux("has-session", "-t", CFG.tmuxSession)) !== null) return true;
  if (CFG.tmuxSession !== "clawd") {
    log(`tmux session '${CFG.tmuxSession}' not found and won't be auto-created`);
    return false;
  }
  log("creating tmux session 'clawd' (Clawd's brain)...");
  await tmux("new-session", "-d", "-s", "clawd", "-x", "200", "-y", "50", "-c", CFG.root, LAUNCHER);
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (await paneReady()) { log("Clawd session is up"); return true; }
  }
  log("WARNING: created session but prompt not detected after 30s");
  return (await tmux("has-session", "-t", "clawd")) !== null;
}

async function inject(text) {
  if (!(await ensureSession())) return false;
  const clean = text.replace(/[\r\n]+/g, " ").trim();
  if ((await tmux("send-keys", "-t", CFG.tmuxSession, "-l", clean)) === null) return false;
  await sleep(300);
  return (await tmux("send-keys", "-t", CFG.tmuxSession, "Enter")) !== null;
}

// ─── Chat handling ───────────────────────────────────────────────────────────
async function handle(player, message) {
  const m = message.match(/^@?clawd[,:!.]?\s*(.*)$/i);
  if (!m) return;
  const prompt = m[1].trim();
  log(`trigger from ${player}: "${prompt || "(hello)"}"`);

  if (/^(come|here|come here)$/i.test(prompt)) {
    await ensureAvatar(player);
    await say("*flies over* Here I am!");
    return;
  }
  if (/^reset$/i.test(prompt)) {
    if (CFG.tmuxSession !== "clawd") {
      await say("My brain is shared with my operator right now — I can't wipe it. Ask them!");
      return;
    }
    await inject("/clear");
    await say("*shakes sparkles off* Fresh start! What's up?");
    return;
  }
  if (!prompt) {
    await ensureAvatar(player);
    await say("Hi! I'm Clawd! Say 'clawd' plus anything — questions, or asks like 'clawd build me a fountain'.");
    return;
  }

  await ensureAvatar(player);
  await startThinking();
  await rc(`title @a actionbar {"text":"✦ Clawd is thinking...","color":"gray","italic":true}`);
  const role = OPS.has(player) ? "op" : "player";
  const ok = await inject(`[MC chat] <${player}> (${role}): ${prompt}`);
  if (!ok) {
    await rc(`effect clear ${AVATAR} minecraft:glowing`);
    await say("*rubs head* My brain isn't awake right now. Tell an operator to check the clawd service!");
  }
  // The Clawd session replies on its own via say.js (which also clears the glow).
}

// Paper chat lines: [HH:MM:SS] [Async Chat Thread - #N/INFO]: <Name> message
// (optionally prefixed with [Not Secure] for unsigned/Bedrock chat)
const CHAT_RE = /INFO\]:\s+(?:\[Not Secure\]\s+)?<([^>]+)>\s+(.+)$/;

function watchLog() {
  const tail = spawn("tail", ["-F", "-n", "0", CFG.logFile]);
  let buf = "";
  tail.stdout.on("data", (data) => {
    buf += data;
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const m = line.match(CHAT_RE);
      if (m) handle(m[1], m[2]).catch((e) => log(`unhandled: ${e.message}`));
    }
  });
  tail.on("close", () => {
    log("tail exited, restarting in 3s");
    setTimeout(watchLog, 3000);
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
const testArg = process.argv.indexOf("--test");
if (testArg !== -1) {
  const [, player, msg] = process.argv[testArg + 1]?.match(/^([^:]+):\s*(.+)$/) || [];
  if (!player) { console.error('usage: node clawd.js --test "PlayerName: clawd hello"'); process.exit(1); }
  handle(player, msg).then(() => { rcon?.end(); process.exit(0); });
} else {
  log(`MineClawd bridge starting (tmux: ${CFG.tmuxSession}, ops: ${[...OPS].join(", ") || "none"})`);
  ensureSession().then(() => watchLog());
}
