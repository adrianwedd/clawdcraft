// rcon_guard.js — code-enforced denylist for RCON commands issued by Clawd.
//
// Enforced by bridge/rcon.js for one-shot and piped-stdin use (the paths the
// Clawd session is pre-approved to run via --allowedTools). Interactive use
// from a real terminal (TTY) is a human at the keyboard and is NOT guarded —
// that is the escape hatch for admin commands; no --force flag on purpose,
// since Clawd's pre-approval covers any flag we add.
//
// Philosophy (HANDOFF 2026-07-04): DENYLIST, not an allowlist of verbs — raw
// command freedom is what makes builds magical. Blocked:
//   - server/admin verbs: stop, restart, reload, op, deop, whitelist,
//     ban(-ip), pardon(-ip), kick — in any namespace (minecraft:, essentials:)
//   - kill/tp/teleport touching broad @a/@e selectors. Tight selectors pass:
//     limit=1, or name=, or type= plus a positive (non-negated) tag=.
//     Clawd's documented avatar fix-commands are tight and must keep passing
//     (see rcon_guard.test.js).
// `execute ... run <cmd>` is unwrapped to the final verb, and when that verb
// is kill/tp EVERY selector in the whole command must be tight — this catches
// `execute as @e run minecraft:kill @s`.
//
// The same rules live as prose in session/clawd_prompt.md ("NEVER run ...");
// this file is the enforcement the prompt can't provide. Keep them in sync.

const DENY_VERBS = new Set([
  "stop", "restart", "reload",
  "op", "deop", "whitelist",
  "ban", "ban-ip", "pardon", "pardon-ip", "kick",
]);
const KILL_TP = new Set(["kill", "tp", "teleport"]);

// "minecraft:kill" -> "kill", "/stop" -> "stop", "essentials:tp" -> "tp"
function verbOf(token) {
  return (token || "")
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/^[a-z_][a-z0-9_.-]*:/, "");
}

// Find @a/@e selectors, capturing bracket args with balanced-depth scanning —
// selector args nest [] and {} (e.g. nbt={Tags:["clawd"]}) so a regex won't do.
function selectors(cmd) {
  const out = [];
  for (let i = 0; i < cmd.length - 1; i++) {
    if (cmd[i] !== "@") continue;
    const kind = cmd[i + 1].toLowerCase();
    if (kind !== "a" && kind !== "e") continue;
    const after = cmd[i + 2];
    if (after !== undefined && /[a-z0-9_]/i.test(after) && after !== "[") continue; // e.g. "@allay" is not a selector
    let j = i + 2;
    let args = null;
    if (cmd[j] === "[") {
      let depth = 0, inStr = false;
      const start = j + 1;
      for (; j < cmd.length; j++) {
        const c = cmd[j];
        if (inStr) {
          if (c === '"' && cmd[j - 1] !== "\\") inStr = false;
          continue;
        }
        if (c === '"') inStr = true;
        else if (c === "[" || c === "{") depth++;
        else if (c === "]" || c === "}") {
          depth--;
          if (depth === 0) { args = cmd.slice(start, j); break; }
        }
      }
    }
    out.push({ kind, args });
    i = j;
  }
  return out;
}

function isTight(args) {
  if (!args) return false;
  if (/\blimit\s*=\s*1\b/.test(args)) return true;
  if (/\bname\s*=/.test(args)) return true;
  if (/\btype\s*=/.test(args) && /\btag\s*=\s*(?!\s*!)[^,\]\s]/.test(args)) return true;
  return false;
}

// check("minecraft:kill @e") -> { ok: false, reason: "..." }
function check(command) {
  const cmd = String(command || "").trim();
  if (!cmd) return { ok: true };
  let tokens = cmd.replace(/^\/+/, "").split(/\s+/);
  let verb = verbOf(tokens[0]);
  for (let hops = 0; verb === "execute" && hops < 8; hops++) {
    const runIdx = tokens.findIndex((t, i) => i > 0 && t.toLowerCase() === "run");
    if (runIdx === -1 || runIdx === tokens.length - 1) { verb = ""; break; } // probe-only execute (if entity ...)
    tokens = tokens.slice(runIdx + 1);
    verb = verbOf(tokens[0]);
  }
  if (DENY_VERBS.has(verb)) {
    return {
      ok: false,
      reason: `'${verb}' is server/admin control — blocked for Clawd (denylist in bridge/rcon_guard.js)`,
    };
  }
  if (KILL_TP.has(verb)) {
    for (const s of selectors(cmd)) {
      if (!isTight(s.args)) {
        return {
          ok: false,
          reason: `${verb} with a broad @${s.kind} selector — every selector needs limit=1, name=, or type=+tag= (e.g. @e[type=minecraft:allay,tag=clawd])`,
        };
      }
    }
  }
  return { ok: true };
}

module.exports = { check, DENY_VERBS, KILL_TP };
