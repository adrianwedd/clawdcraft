// chat_budget.js — per-player budget for brain-bound direct chat (issue #1).
//
// Ambient relays have cooldowns + hourly caps (ambient.js); direct "clawd ..."
// chat had none, so one enthusiastic player could trigger unlimited brain
// turns. This caps the BRAIN path only: fast paths (come/follow/stay/home/
// listen/reset) stay free and uncapped, and denials are answered bridge-side
// with a canned in-character line — zero tokens.
//
// Config (optional "chatBudget" section in config.json, all fields optional):
//   { "enabled": true, "cooldownMs": 15000, "maxPerHour": 30,
//     "maxPerDay": 150, "opsExempt": true }
//
// State is in-memory per bridge process (like ambient's) — a restart resets
// counters, which is fine for spam protection.

function makeBudget(opts = {}) {
  const o = {
    enabled: true,
    cooldownMs: 15_000,
    maxPerHour: 30,
    maxPerDay: 150,
    opsExempt: true,
    ...opts,
  };

  const players = {}; // name -> { last, hour:{n,since}, day:{n,since}, lastDenialSaid }
  const get = (p) =>
    (players[p] ??= { last: 0, hour: { n: 0, since: 0 }, day: { n: 0, since: 0 }, lastDenialSaid: 0 });
  const roll = (w, ms, now) => {
    if (now - w.since > ms) { w.n = 0; w.since = now; }
  };

  // Would a brain turn for this player be within budget right now?
  function check(player, role, now = Date.now()) {
    if (!o.enabled) return { ok: true };
    if (o.opsExempt && role === "op") return { ok: true };
    const s = get(player);
    roll(s.hour, 3_600_000, now);
    roll(s.day, 86_400_000, now);
    if (now - s.last < o.cooldownMs) return { ok: false, reason: "cooldown" };
    if (s.hour.n >= o.maxPerHour) return { ok: false, reason: "hourly cap" };
    if (s.day.n >= o.maxPerDay) return { ok: false, reason: "daily cap" };
    return { ok: true };
  }

  // Record one brain turn. Call only after the inject actually succeeded.
  function spend(player, now = Date.now()) {
    const s = get(player);
    roll(s.hour, 3_600_000, now);
    roll(s.day, 86_400_000, now);
    s.last = now;
    s.hour.n++;
    s.day.n++;
  }

  // The canned denial itself must not become chat spam: say it at most once
  // per cooldown window per player, silently drop repeats.
  function shouldSayDenial(player, now = Date.now()) {
    const s = get(player);
    if (now - s.lastDenialSaid < o.cooldownMs) return false;
    s.lastDenialSaid = now;
    return true;
  }

  return { check, spend, shouldSayDenial, opts: o };
}

module.exports = { makeBudget };
