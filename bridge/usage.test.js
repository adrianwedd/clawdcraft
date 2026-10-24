// usage.test.js — offline tests for usage.js (issue #6 brain-turn metering).
// No config.json, no RCON, no tmux, no real clock, no real ledger path: every
// case writes inside an injected scratch dir (mkdtemp, removed at exit).
//
// Run: node usage.test.js      (also part of `npm test`)

const fs = require("fs");
const os = require("os");
const path = require("path");
const U = require("./usage");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-usage-test-"));
process.on("exit", () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} });

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; return; }
  fail++;
  console.error(`  FAIL: ${name}`);
}
function same(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), `${name} (got ${JSON.stringify(a)})`); }
function noThrow(fn, name) {
  try { return fn(); } catch (e) { fail++; console.error(`  FAIL: ${name} — threw ${e.message}`); return undefined; }
}

// Fixed clocks. The ledger day is UTC: 2026-09-29T23:59Z and 2026-09-30T00:00Z
// are different days even though both are 2026-09-30 on an AEST wall clock.
const DAY1 = Date.parse("2026-09-29T06:00:00.000Z");
const DAY1_EVE = Date.parse("2026-09-29T23:59:00.000Z");
const DAY2 = Date.parse("2026-09-30T00:00:01.000Z");

const file = (n) => path.join(dir, n);
const write = (p, s) => fs.writeFileSync(p, s);
const rows = (p) => fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
// Pull the text-component payload out of a tellraw command: after the selector.
const payloadOf = (cmd) => JSON.parse(cmd.slice(cmd.indexOf("] [") + 2));
const selectorsIn = (cmd) => cmd.match(/@[aeprs](\[[^\]]*\])?/g) || [];

(async () => {
  // ── seam: successful inject meters exactly one row, failed inject none ─────
  {
    const log = file("seam.jsonl");
    const clock = { t: DAY1 };
    const errs = [];
    const meter = U.makeMeter({ file: log, now: () => clock.t, onError: (m) => errs.push(m) });
    // The inject seam: the caller supplies structured metadata, the wrapper
    // meters only when the inject reported success.
    const brain = U.meteredInject(async (text) => !String(text).includes("BOOM"), meter);

    ok(await brain("hello", { kind: "direct", player: "Ana" }) === true, "successful inject returns true");
    ok(await brain("BOOM", { kind: "direct", player: "Ana" }) === false, "failed inject returns false");
    clock.t = DAY1 + 1000;
    await brain("overheard", { kind: "overheard", player: "Ben" });

    const r = rows(log);
    ok(r.length === 2, `only successful injects are logged (got ${r.length})`);
    same(r.map((x) => [x.kind, x.player]), [["direct", "Ana"], ["overheard", "Ben"]], "kinds and players");
    ok(r[0].ts === "2026-09-29T06:00:00.000Z", "timestamp is UTC ISO-8601 with Z");
    ok(r[1].ts === "2026-09-29T06:00:01.000Z", "timestamp follows the injected clock");
    ok(errs.length === 0, "no metering errors on the happy path");
  }

  // ── a failed send-keys/Enter leaves no row at all ─────────────────────────
  {
    const log = file("failed-send.jsonl");
    const meter = U.makeMeter({ file: log, now: () => DAY1 });
    // inject() returns false on send-keys/Enter failure, before metering — the
    // realistic failure shape, exercised through the same seam.
    let attempts = 0;
    const failing = async () => { attempts++; return false; };
    const brain = U.meteredInject(failing, meter);
    for (let i = 0; i < 3; i++) await brain("[MC chat] <Ana> (player): hi", { kind: "direct", player: "Ana" });
    ok(attempts === 3, "failed injects still reach the inject function");
    ok(!fs.existsSync(log), "failed injections never create a ledger row");
  }

  // ── no-meta inject (e.g. the /clear fast path) meters nothing ─────────────
  {
    const log = file("nometa.jsonl");
    const meter = U.makeMeter({ file: log, now: () => DAY1 });
    const brain = U.meteredInject(async () => true, meter);
    await brain("/clear");                                        // no meta at all
    await brain("[MC chat] <Ana> (player): hi", { kind: "fastpath" }); // unmeterable kind
    await brain("x", { kind: "direct" });                         // no player, but valid kind
    const r = rows(log);
    ok(r.length === 1 && r[0].kind === "direct", "meta-less and unknown-kind injects are not logged");
    ok(r[0].player === undefined, "missing player is omitted from the row");
  }

  // ── record(): only the three metered kinds; bad names dropped ─────────────
  {
    const log = file("kinds.jsonl");
    const meter = U.makeMeter({ file: log, now: () => DAY1 });
    const r1 = meter.record("direct", "Ana");
    ok(r1.ok && fs.existsSync(log), "record writes the ledger");
    ok((fs.statSync(log).mode & 0o777) === 0o600, "ledger file mode is 0600");
    ok(meter.record("nope", "Ana").ok === false, "unknown kind is not logged");
    ok(meter.record(undefined, "Ana").ok === false, "missing kind is not logged");
    ok(meter.record("direct", "Ana").ok === true, "each valid kind is accepted");
    for (const k of ["overheard", "event"]) ok(meter.record(k, "Ana").ok === true, `kind ${k} accepted`);

    const before = rows(log).length;
    meter.record("event", 'Ann" onMouse 0 0 0 run op X'); // selector-shaped name
    meter.record("event", "x".repeat(40));                // over-long name
    meter.record("event", "Ann a");
    const raw = fs.readFileSync(log, "utf8");
    const after = rows(log);
    ok(after.length === before + 3, "rows with unusable player names are still counted as events");
    ok(after.slice(before).every((x) => x.player === undefined), "invalid player is omitted, never sanitized in");
    ok(!raw.includes('Ann"') && !raw.includes("x".repeat(40)), "no raw invalid name text reaches the ledger");
  }

  // ── the row has no field that could carry message text ────────────────────
  {
    const log = file("notext.jsonl");
    const meter = U.makeMeter({ file: log, now: () => DAY1 });
    const brain = U.meteredInject(async () => true, meter);
    const SECRET = "my password is hunter2; note: hates spiders";
    await brain(`[MC chat] <Ana> (player): ${SECRET}`, { kind: "direct", player: "Ana" });
    await brain(`[MC overheard near Clawd] <Ben> (player): ${SECRET}`, { kind: "overheard", player: "Ben" });
    await brain(`[MC event] Ben just died: "${SECRET}"`, { kind: "event", player: "Ben" });
    const raw = fs.readFileSync(log, "utf8");
    ok(!raw.includes("hunter2") && !raw.includes("spiders"), "message text never appears in the ledger");
    ok(!raw.includes("MC chat") && !raw.includes("MC event"), "prompt envelope never appears in the ledger");
    same(Object.keys(rows(log)[0]).sort(), ["kind", "player", "ts"], "row schema is exactly ts/kind/player");
    ok(rows(log).every((x) => Object.keys(x).length === 3), "no row carries extra fields");
  }

  // ── UTC-day rollover: counts split at 00:00Z, not at local midnight ───────
  {
    const log = file("rollover.jsonl");
    U.makeMeter({ file: log, now: () => DAY1 }).record("direct", "Ana");
    const eve = U.makeMeter({ file: log, now: () => DAY1_EVE });
    eve.record("direct", "Ana");
    eve.record("overheard", "Ben");
    eve.record("event", "Cara");
    U.makeMeter({ file: log, now: () => DAY2 }).record("direct", "Ben");

    const all = U.readRows(log).rows;
    ok(all.length === 5, "all five rows are in the ledger");

    const d1 = U.summarize(all, DAY1);
    ok(d1.day === "2026-09-29", `day 1 is the UTC date (got ${d1.day})`);
    ok(d1.total === 4, `day 1 totals (got ${d1.total})`);
    same(d1.byKind, { direct: 2, overheard: 1, event: 1 }, "day 1 counts by kind");
    same(d1.topPlayers, [["Ana", 2], ["Ben", 1], ["Cara", 1]], "day 1 top players");

    const dEve = U.summarize(all, DAY1_EVE);
    ok(dEve.day === "2026-09-29" && dEve.total === 4, "the same four rows sit on both sides of 06:00Z");
    // 2026-09-30T00:00Z is already 30 Sep 10:00 local (AEST) — the split is UTC.
    ok(new Date(DAY1_EVE).toISOString().slice(0, 10) === "2026-09-29", "23:59Z is still the 29th");
    ok(new Date(DAY2).toISOString().slice(0, 10) === "2026-09-30", "00:00:01Z is the 30th");

    const d2 = U.summarize(all, DAY2);
    ok(d2.day === "2026-09-30" && d2.total === 1, "day 2 excludes day 1 rows");
    same(d2.byKind, { direct: 1, overheard: 0, event: 0 }, "day 2 counts by kind");
    same(d2.topPlayers, [["Ben", 1]], "day 2 top players");
  }

  // ── top players: descending, ties by name, capped, report is plain text ───
  {
    const log = file("top.jsonl");
    const m = U.makeMeter({ file: log, now: () => DAY1 });
    for (let i = 0; i < 3; i++) m.record("direct", "Zoe");
    for (let i = 0; i < 3; i++) m.record("overheard", "Ana");
    m.record("event", "Ben");
    for (const p of ["Cara", "Dan", "Eve", "Fay"]) m.record("event", p);

    const s = U.summarize(U.readRows(log).rows, DAY1, 5);
    ok(s.total === 11, `total counts every kind (got ${s.total})`);
    same(s.topPlayers.map(([n]) => n), ["Ana", "Zoe", "Ben", "Cara", "Dan"], "descending counts, ties by name, capped at 5");
    const text = U.formatReport(s);
    ok(text.length <= 220, `report fits one chat line (${text.length} chars)`);
    ok(text.includes("direct 3") && text.includes("overheard 3") && text.includes("event 5"), `report renders counts: ${text}`);
    ok(!text.includes("@a") && !text.includes("@e"), "report text is plain — no selector in the payload");
    ok(!/[{}]/.test(text), "report text carries no JSON/command syntax");
    ok(U.formatReport(U.summarize([], DAY1)).includes("none yet"), "empty report says none yet");
  }

  // ── malformed / corrupt / oversized rows are skipped, never fatal ─────────
  {
    const log = file("garbage.jsonl");
    const good = JSON.stringify({ ts: "2026-09-29T06:00:00.000Z", kind: "direct", player: "Ana" });
    write(log, [
      good,
      "{not json at all",                                                  // malformed
      "[1,2,3]",                                                           // wrong shape
      '{"ts":"2026-09-29T06:00:00.000Z","kind":"bogus"}',                  // unknown kind
      '{"kind":"direct"}',                                                 // missing ts
      '{"ts":"2026-09-29 06:00:00","kind":"direct"}',                      // naive timestamp
      JSON.stringify({ ts: "2026-09-29T06:00:00.000Z", kind: "direct", player: "Ana" }),
      JSON.stringify({ ts: "2026-09-29T06:00:00.000Z", kind: "event", player: "Ben", pad: "y".repeat(U.MAX_LINE_BYTES) }), // oversized
      "",
      JSON.stringify({ ts: "2026-09-29T06:00:00.000Z", kind: "event", player: "Cara" }),
    ].join("\n") + "\n");

    const read = noThrow(() => U.readRows(log), "reading a corrupt ledger") || {};
    ok(read.error === null, "a corrupt ledger still reads (no fatal error)");
    ok(read.rows.length === 3, `only the 3 well-formed rows survive (got ${read.rows?.length})`);
    same(read.rows.map((r) => [r.kind, r.player]), [["direct", "Ana"], ["direct", "Ana"], ["event", "Cara"]], "good rows keep order and content");
    const s = noThrow(() => U.summarize(read.rows, DAY1), "summarizing dirty input");
    ok(s && s.total === 3 && s.byKind.direct === 2 && s.byKind.event === 1, "dirty ledger summarizes to the clean rows only");
  }

  // ── missing ledger, and the bounded tail window ───────────────────────────
  {
    const read = U.readRows(file("does-not-exist.jsonl"));
    ok(read.rows.length === 0 && read.error === null, "missing ledger reads as empty, not an error");
    ok(U.summarize([], DAY1).total === 0, "empty ledger summarizes to zero");
    ok(U.opUsageReply("OpGuy", "op", { file: file("nope.jsonl"), now: DAY1 }).action === "report", "a fresh install still reports zero to an op");

    const big = file("big.jsonl");
    write(big, Array.from({ length: 500 }, () =>
      JSON.stringify({ ts: "2026-09-29T06:00:00.000Z", kind: "direct", player: "Ana" })).join("\n") + "\n");
    const capped = U.readRows(big, { maxBytes: 2048 });
    ok(capped.truncated === true, "tail-window read reports incomplete coverage");
    ok(capped.rows.length > 0 && capped.rows.length < 500, "windowed read caps how many rows it parses");
    ok(capped.rows.every((r) => r.player === "Ana" && r.kind === "direct"), "windowed read yields no partial-row artifact");
    ok(U.summarize(capped.rows, DAY1).byKind.direct === capped.rows.length, "windowed rows still aggregate");
    ok(U.formatReport({ ...U.summarize(capped.rows, DAY1), partial: true })
      .includes("at least"), "truncated totals never present as exact");
  }

  // ── a symlink cannot redirect private runtime data into another file ─────
  {
    const target = file("keep-private.txt");
    const link = file("ledger-symlink.jsonl");
    write(target, "original bytes");
    fs.symlinkSync(target, link);
    const meter = U.makeMeter({ file: link, now: () => DAY1 });
    ok(meter.record("direct", "Ana").ok === false, "meter refuses a symlink ledger");
    ok(fs.readFileSync(target, "utf8") === "original bytes", "symlink target is unchanged");
    const read = U.readRows(link);
    ok(read.rows.length === 0 && !!read.error, "reader refuses a symlink ledger");
  }

  // ── meter I/O failure: bounded operational error, never throws ────────────
  {
    const errs = [];
    const broken = U.makeMeter({
      file: path.join(dir, "no-such-dir", "deep", "x.jsonl"),
      now: () => DAY1,
      onError: (m) => errs.push(m),
    });
    const r = noThrow(() => broken.record("direct", "Ana"), "record on an unwritable path");
    ok(r && r.ok === false && typeof r.error === "string", "unwritable ledger reports ok:false + error");
    ok(errs.length === 1, "onError fires once");
    ok(errs[0].length <= 160 && !/[\r\n]/.test(errs[0]), "onError gets one bounded single-line message");
    ok(!r.error.includes(dir) && !r.error.includes("/"), "error message carries a code, not a full path");
    noThrow(() => broken.record("direct", "Ana"), "repeat failure");

    const noFile = U.makeMeter({ now: () => DAY1 });
    ok(noFile.record("direct", "Ana").ok === false, "meter without an injected file refuses to log (no default path)");
    const boom = U.makeMeter({ file: file("x.jsonl"), now: () => DAY1, onError: () => { throw new Error("reporter down"); } });
    noThrow(() => boom.record("direct", "Ana"), "a throwing onError cannot break metering");
    const brain = U.meteredInject(async () => true, boom);
    ok(await brain("t", { kind: "direct", player: "Ana" }) === true, "a failing meter never breaks the inject seam");
  }

  // ── unreadable ledger: op degrades to a private error line, no counts ────
  {
    const d = file("dir-as-file");
    fs.mkdirSync(d, { recursive: true });
    const read = U.readRows(d);
    ok(read.rows.length === 0 && typeof read.error === "string" && !/[\r\n]/.test(read.error), "unreadable ledger path reports a bounded error");
    const r = U.opUsageReply("OpGuy", "op", { file: d, now: DAY1 });
    ok(r.action === "error" && typeof r.command === "string", "op reply degrades to a private error line");
    ok(r.command.startsWith('tellraw @a[name="OpGuy",limit=1] '), "error line is still private to the op");
    ok(!/\d+ brain (?:turn|handoff)/.test(r.command), "error line leaks no counts");
  }

  // ── op-only routing + selector safety ────────────────────────────────────
  {
    const log = file("ops.jsonl");
    const m = U.makeMeter({ file: log, now: () => DAY1 });
    m.record("direct", "Ana");
    m.record("direct", "Ana");
    m.record("event", "Ben");

    const op = U.opUsageReply("OpGuy", "op", { file: log, now: () => DAY1 });
    ok(op.action === "report", "op gets a report");
    ok(op.summary.total === 3 && op.summary.byKind.direct === 2 && op.summary.byKind.event === 1, "op report counts match the ledger");
    ok(op.summary.topPlayers.some(([n, c]) => n === "Ana" && c === 2), "op report summary carries the top player");
    ok((op.text || "").includes("Ana 2"), `report text carries the top player: ${op.text}`);
    const prefix = 'tellraw @a[name="OpGuy",limit=1] ';
    ok(op.command.startsWith(prefix), "selector is exactly the requesting op, limit=1");
    ok(op.command.length > prefix.length && op.command[prefix.length] === "[", "payload follows the selector");
    ok(!/tellraw @a\s/.test(op.command), "NEVER a broadcast to @a");
    same(selectorsIn(op.command), ['@a[name="OpGuy",limit=1]'], "the only selector is the requesting op, limit=1");
    ok(op.command.slice(prefix.length).includes("Ana 2"), "report carries the top player");

    // Non-ops: refused, and no counts/command come back at all.
    for (const role of ["player", "op ", "OP!", "Operator", "guest", "", null, undefined, 1, {}]) {
      const r = U.opUsageReply("Ana", role, { file: log, now: () => DAY1 });
      ok(r.action === "refuse" && r.command === null && r.text === null && r.summary === undefined,
        `non-op role ${JSON.stringify(role)} refused with nothing attached`);
    }
    // Role decides, not the name.
    const impostor = U.opUsageReply("OpGuy", "player", { file: log, now: () => DAY1 });
    ok(impostor.action === "refuse" && impostor.command === null, "role decides, not the name");

    // Selector injection: no name needing escaping can ever become a command.
    for (const bad of [
      'Ana" @a', 'Ana" ]', 'Ana",limit=99999', "Ana @a", "Ana\n@a", "Ana\t@a", "Ana\r@a",
      "Ana\\", "Ana'", "@a", "@e", "An a", "", "x".repeat(33), "Ana;op", "Ann@a", "Ann:op",
    ]) {
      const r = U.opUsageReply(bad, "op", { file: log, now: () => DAY1 });
      ok(r.action === "error" && r.command === null, `invalid op name ${JSON.stringify(bad)} yields no command`);
      ok(U.tellrawTo(bad, "hi") === null, `tellrawTo refuses ${JSON.stringify(bad)}`);
    }
    ok(U.cleanPlayer("Ana") === "Ana" && U.cleanPlayer('Ana"') === undefined, "cleanPlayer is the single validation point");

    // Valid dotted/underscored names pass, and the payload is data not syntax.
    const q = U.opUsageReply("Ana.Rose_99", "op", { file: log, now: () => DAY1 });
    ok(q.action === "report" && q.command.startsWith('tellraw @a[name="Ana.Rose_99",limit=1] '), "valid dotted/underscored names pass");
    const payload = payloadOf(q.command);
    ok(Array.isArray(payload) && typeof payload[1].text === "string", "payload is a JSON text component array");
    ok(payload[0].text === "<Clawd> " && payload[1].text === q.text, "payload pairs the gold tag with the report text");
    const injected = U.tellrawTo("Ana", 'hi"] ,{"text":"@a"}');
    ok(payloadOf(injected)[1].text === 'hi"] ,{"text":"@a"}', "report text is JSON-escaped, never commands");
    // The only selector in command position is the op's; an "@a" in the text is
    // inert JSON data (it is the second match, and it parses back as the text).
    same(selectorsIn(injected)[0], '@a[name="Ana",limit=1]', "the command selector is the op, limit=1");
    same(selectorsIn(U.tellrawTo("Ana", "plain report")).length, 1, "ordinary report has exactly one selector");
  }

  // ── pure functions: nothing writes outside the injected path ─────────────
  {
    const before = fs.readdirSync(dir);
    const log = file("scratch.jsonl");
    const meter = U.makeMeter({ file: log, now: () => DAY1 });
    const brain = U.meteredInject(async () => true, meter);
    await brain("x", { kind: "event", player: "Ana" });
    U.readRows(log);
    U.summarize([], DAY1);
    U.formatReport(U.summarize([], DAY1));
    U.tellrawTo("Ana", "hi");
    U.opUsageReply("Ana", "player", { file: log, now: DAY1 });  // refuse path reads nothing
    U.opUsageReply("OpGuy", "op", { file: log, now: DAY1 });
    const added = fs.readdirSync(dir).filter((f) => !before.includes(f));
    same(added, ["scratch.jsonl"], "only the injected ledger path was written");
  }

  console.log(`usage: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(`usage.test.js crashed: ${e.stack}`);
  process.exit(1);
});
