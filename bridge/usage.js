// usage.js — brain-turn metering + the op-only `clawd usage` report (issue #6).
//
// The bridge records one handoff after each SUCCESSFUL tmux injection.
// It does not observe model replies, provider requests, billed tokens or cost.
// Each row represents that handoff only:
//
//   {"ts":"2026-09-29T06:22:11.123Z","kind":"direct","player":"Ana"}
//
//   ts      UTC, ISO-8601 with Z (never local time — journald is AEST, the
//           bridge logs in UTC; this file is UTC like the bridge)
//   kind    "direct" (addressed chat) | "overheard" (proximity) | "event"
//           (join/leave/advancement/death)
//   player  the associated player, when known
//
// The row schema has no field for message text — and none is ever passed in.
// Message text, raw chat, personal notes and credentials are never written;
// the recorder accepts (kind, player) only.
//
// NOT metered (they cost no brain turn): fast paths (come/follow/stay/home/
// listen/reset/usage), budget denials, and injections that failed (send-keys
// or Enter) — the caller records only after the inject returned true.
//
// The ledger is runtime state: gitignored, mode 0600, and the path is injected
// by the caller (bridge/clawd.js) so tests never touch the real one. All I/O is
// best-effort: a failure surfaces a bounded message through `onError` and never
// changes what the chat path does.
//
// `clawd usage` is bridge-side and token-free (no brain turn, nothing metered).
// Ops get today's totals by kind and the top players; non-ops get a canned
// refusal and no counts. The report is a PRIVATE tellraw to the requesting op
// (`@a[name="…",limit=1]`, name strictly validated) — player usage is never
// broadcast to @a.
//
// Offline tests: node usage.test.js   (also part of `npm test`)

const fs = require("fs");

const KINDS = new Set(["direct", "overheard", "event"]);
const FILE_MODE = 0o600;
const MAX_LINE_BYTES = 4096;          // longer lines are oversized -> skipped
const MAX_READ_BYTES = 8 * 1024 * 1024; // tail window; ~140k rows
const MAX_REPORT_CHARS = 220;         // one client chat line, with margin
const PLAYER_RE = /^[A-Za-z0-9_.]{1,32}$/; // same rule as gift.js/safe_teleport.js
const TOP_PLAYERS = 5;

// Bounded, single-line operational messages: no raw file content, no chat.
function bounded(s, n = 160) {
  const t = String(s ?? "").replace(/[\r\n\t]+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

// Player names are validated before they reach the ledger or a selector.
// Anything else (quotes, whitespace, newlines, over-long names) -> undefined.
function cleanPlayer(player) {
  return typeof player === "string" && PLAYER_RE.test(player) ? player : undefined;
}

function dayOf(t) {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// ─── Recorder ────────────────────────────────────────────────────────────────
// makeMeter({ file, now, onError }) -> { record, file }
//   file     the runtime ledger path (injected; required to write anything)
//   now      clock, default Date.now — injectable so tests never use the clock
//   onError  called with a bounded message on I/O failure; never throws
function makeMeter({ file = null, now = Date.now, onError = null } = {}) {
  const fail = (msg) => {
    const m = bounded(msg);
    try { onError?.(m); } catch { /* a broken reporter must not break metering */ }
    return { ok: false, error: m };
  };

  // Append one row. Returns {ok:true,row} or {ok:false,error}. Never throws.
  // An unmetered kind (undefined, fast paths, typos) is silently not logged —
  // that is the normal case for token-free injects.
  function record(kind, player) {
    if (!KINDS.has(kind)) return { ok: false, error: "kind not metered" };
    if (!file) return fail("meter has no file path");
    const row = { ts: new Date(now()).toISOString(), kind };
    const p = cleanPlayer(player);
    if (p) row.player = p; // omitted entirely when unknown/invalid
    const buf = Buffer.from(`${JSON.stringify(row)}\n`, "utf8");
    let fd;
    try {
      fd = fs.openSync(file,
        fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_NOFOLLOW,
        FILE_MODE);
      if (!fs.fstatSync(fd).isFile()) throw new Error("ledger path is not a regular file");
      // Repair perms if the file pre-existed with a looser mode.
      if ((fs.fstatSync(fd).mode & 0o777) !== FILE_MODE) fs.fchmodSync(fd, FILE_MODE);
      let off = 0;
      while (off < buf.length) off += fs.writeSync(fd, buf, off, buf.length - off);
      return { ok: true, row };
    } catch (e) {
      return fail(`ledger write failed (${e.code || e.message})`);
    } finally {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
    }
  }

  return { record, file };
}

// The metering seam: wrap an inject-to-brain fn so exactly the SUCCESSFUL
// injections are metered, from structured metadata the caller passed.
//   meteredInject(injectFn, meter)("text", { kind: "direct", player: "Ana" })
// No meta (e.g. the /clear fast path) -> inject unchanged, nothing logged.
function meteredInject(injectFn, meter) {
  if (typeof injectFn !== "function") throw new TypeError("meteredInject needs an inject function");
  return async function metered(text, meta) {
    const ok = await injectFn(text, meta);
    if (ok && meter) {
      try { meter.record(meta?.kind, meta?.player); } catch { /* metering never breaks chat */ }
    }
    return ok;
  };
}

// ─── Reader ──────────────────────────────────────────────────────────────────
// readRows(file) -> { rows, error }
//   ENOENT is not an error (fresh install: nothing metered yet).
//   Malformed JSON, unknown kinds, missing/naive timestamps and oversized
//   lines are skipped, never fatal. Only the last maxBytes are read.
function readRows(file, { maxBytes = MAX_READ_BYTES } = {}) {
  if (!file) return { rows: [], error: "no ledger path" };
  let fd;
  try {
    fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error("ledger path is not a regular file");
    const size = stat.size;
    const start = size > maxBytes ? size - maxBytes : 0;
    const buf = Buffer.allocUnsafe(size - start);
    let got = 0;
    while (got < buf.length) {
      const n = fs.readSync(fd, buf, got, buf.length - got, start + got);
      if (n <= 0) break;
      got += n;
    }
    let text = buf.subarray(0, got).toString("utf8");
    // A windowed read starts mid-line: drop that partial line.
    if (start > 0) {
      const nl = text.indexOf("\n");
      text = nl === -1 ? "" : text.slice(nl + 1);
    }
    const rows = [];
    for (const raw of text.split("\n")) {
      if (!raw.trim()) continue;
      if (Buffer.byteLength(raw) > MAX_LINE_BYTES) continue;
      let row;
      try { row = JSON.parse(raw); } catch { continue; }
      if (!row || typeof row !== "object" || !KINDS.has(row.kind)) continue;
      if (typeof row.ts !== "string" || !TS_RE.test(row.ts)) continue;
      rows.push(row);
    }
    return { rows, error: null, truncated: start > 0 };
  } catch (e) {
    if (e.code === "ENOENT") return { rows: [], error: null, truncated: false };
    return { rows: [], error: bounded(`ledger read failed (${e.code || e.message})`), truncated: false };
  } finally {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
  }
}

// ─── Aggregation ─────────────────────────────────────────────────────────────
// counts for one UTC day: totals by kind + top players (desc, then name for
// stable output). Pure.
function summarize(rows, at = Date.now(), top = TOP_PLAYERS) {
  const day = dayOf(at);
  const byKind = { direct: 0, overheard: 0, event: 0 };
  const players = new Map();
  let total = 0;
  for (const r of rows || []) {
    if (!r || !KINDS.has(r.kind) || dayOf(r.ts) !== day) continue;
    byKind[r.kind]++;
    total++;
    const p = cleanPlayer(r.player);
    if (p) players.set(p, (players.get(p) || 0) + 1);
  }
  const topPlayers = [...players.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, Math.max(0, top));
  return { day, total, byKind, topPlayers };
}

function formatReport(s) {
  const tops = s.topPlayers.length
    ? s.topPlayers.map(([n, c]) => `${n} ${c}`).join(", ")
    : "none yet";
  const body =
    `usage today (${s.day ?? "unknown"} UTC): ${s.partial ? "at least " : ""}${s.total} brain handoff${s.total === 1 ? "" : "s"} — ` +
    `direct ${s.byKind.direct}, overheard ${s.byKind.overheard}, event ${s.byKind.event}. Top: ${tops}.`;
  const qualified = s.partial ? `${body} (ledger read window capped)` : body;
  return qualified.length > MAX_REPORT_CHARS
    ? `${qualified.slice(0, MAX_REPORT_CHARS - 1)}…` : qualified;
}

// ─── Private delivery ────────────────────────────────────────────────────────
// A tellraw for ONE player. Returns null (fail closed) unless the name passes
// the strict player rule, so nothing can widen the selector to a broadcast.
function tellrawTo(player, text) {
  const name = cleanPlayer(player);
  if (!name) return null;
  const payload = [
    { text: "<Clawd> ", color: "gold", bold: true },
    { text: String(text), color: "gray", italic: true },
  ];
  return `tellraw @a[name="${name}",limit=1] ${JSON.stringify(payload)}`;
}

// The whole `clawd usage` fast-path decision, pure except for reading the
// ledger. Non-ops get no counts and no command at all.
// `now` accepts a clock function (like makeMeter) or a bare timestamp.
function opUsageReply(player, role, { file, now = Date.now, top = TOP_PLAYERS } = {}) {
  if (role !== "op") return { action: "refuse", command: null, text: null };
  const at = typeof now === "function" ? now() : now;
  const { rows, error, truncated } = readRows(file);
  if (error) {
    return {
      action: "error",
      command: tellrawTo(player, "my ledger isn't readable right now — ask an operator to check the clawd service."),
      text: null,
      error,
    };
  }
  const summary = summarize(rows, at, top);
  summary.partial = truncated;
  const text = formatReport(summary);
  const command = tellrawTo(player, text);
  if (!command) {
    return { action: "error", command: null, text: null, error: "invalid player name for a private report" };
  }
  return { action: "report", command, text, summary };
}

module.exports = {
  makeMeter,
  meteredInject,
  readRows,
  summarize,
  formatReport,
  tellrawTo,
  opUsageReply,
  cleanPlayer,
  KINDS,
  MAX_LINE_BYTES,
  MAX_READ_BYTES,
  FILE_MODE,
};
