// Offline tests for chat_budget.js — no config, no network, fake clock.
// Run: node chat_budget.test.js   (also part of `npm test`)

const { makeBudget } = require("./chat_budget");

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; }
  else { fail++; console.error(`  FAIL: ${name}`); }
}

const T0 = 1_000_000_000_000; // fixed epoch base; never touch the real clock

// ── defaults: first message allowed, spend starts cooldown ──────────────────
{
  const b = makeBudget();
  ok(b.check("Ana", "player", T0).ok, "first message is allowed");
  b.spend("Ana", T0);
  ok(!b.check("Ana", "player", T0 + 1000).ok, "blocked during cooldown");
  ok(b.check("Ana", "player", T0 + 1000).reason === "cooldown", "reason is cooldown");
  ok(b.check("Ana", "player", T0 + 15_000).ok, "allowed after cooldown expires");
  ok(b.check("Ben", "player", T0 + 1000).ok, "other players unaffected");
}

// ── hourly cap, rolling window ───────────────────────────────────────────────
{
  const b = makeBudget({ cooldownMs: 0, maxPerHour: 3 });
  for (let i = 0; i < 3; i++) b.spend("Ana", T0 + i);
  const v = b.check("Ana", "player", T0 + 10);
  ok(!v.ok && v.reason === "hourly cap", "hourly cap hit");
  ok(b.check("Ana", "player", T0 + 3_600_001).ok, "hour window rolls over");
}

// ── daily cap outlives the hourly window ─────────────────────────────────────
{
  const b = makeBudget({ cooldownMs: 0, maxPerHour: 1000, maxPerDay: 5 });
  for (let i = 0; i < 5; i++) b.spend("Ana", T0 + i * 3_700_000); // spread over hours
  const v = b.check("Ana", "player", T0 + 5 * 3_700_000);
  ok(!v.ok && v.reason === "daily cap", "daily cap hit across hours");
  ok(b.check("Ana", "player", T0 + 86_400_001 + 4 * 3_700_000).ok, "day window rolls over");
}

// ── ops exempt (default) / not exempt when configured ───────────────────────
{
  const b = makeBudget({ cooldownMs: 60_000 });
  b.spend("OpGuy", T0);
  ok(b.check("OpGuy", "op", T0 + 1).ok, "ops exempt by default");
  const b2 = makeBudget({ cooldownMs: 60_000, opsExempt: false });
  b2.spend("OpGuy", T0);
  ok(!b2.check("OpGuy", "op", T0 + 1).ok, "opsExempt:false applies caps to ops");
}

// ── enabled:false disables everything ────────────────────────────────────────
{
  const b = makeBudget({ enabled: false, cooldownMs: 60_000, maxPerHour: 0 });
  b.spend("Ana", T0);
  ok(b.check("Ana", "player", T0 + 1).ok, "enabled:false bypasses all limits");
}

// ── denial line is itself throttled ──────────────────────────────────────────
{
  const b = makeBudget();
  ok(b.shouldSayDenial("Ana", T0), "first denial is spoken");
  ok(!b.shouldSayDenial("Ana", T0 + 1000), "repeat denial within cooldown is silent");
  ok(b.shouldSayDenial("Ana", T0 + 15_000), "denial speakable again after cooldown");
}

console.log(`chat_budget: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
