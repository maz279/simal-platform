// rm(7.2-2)/F-2026-N17 unit tests — SLA clock in fractional GST business days.
// Done-when (roadmap 7.2-2): 1.6bd breaches; 1.4bd does not; a Sunday counts 0;
// query_raised pauses; partner_updated restarts the clock.
import test from 'node:test';
import assert from 'node:assert/strict';

// GST (UTC+4) anchors — 2026-10-05 is a Monday
const DAY = 86400000;
const MON = Date.parse('2026-10-05T00:00:00+04:00');
const TUE = MON + DAY;

const { businessDaysBetween, slaState } = await import('../../src/services/review.service.js');

test('businessDaysBetween is fractional, not floored', () => {
  assert.equal(Math.round(businessDaysBetween(MON, TUE) * 10) / 10, 1);
  assert.equal(Math.round(businessDaysBetween(MON, TUE + 0.6 * DAY) * 10) / 10, 1.6);
  assert.equal(Math.round(businessDaysBetween(MON, TUE + 0.4 * DAY) * 10) / 10, 1.4);
});

test('a span crossing a Sunday counts the Sunday as 0', () => {
  // Saturday 12:00 GST → Monday 12:00 GST = Sat 0.5 + Sun 0 + Mon 0.5 = 1.0
  const sat = Date.parse('2026-10-10T12:00:00+04:00');
  const mon = Date.parse('2026-10-12T12:00:00+04:00');
  assert.equal(Math.round(businessDaysBetween(sat, mon) * 10) / 10, 1);
  // Friday 00:00 → Monday 00:00 = Fri 1 + Sat 1 + Sun 0 = 2 (Sat stays a business day by default)
  assert.equal(Math.round(businessDaysBetween(Date.parse('2026-10-09T00:00:00+04:00'), MON + 7 * DAY) * 10) / 10, 2);
});

test('1.6 business days pending (submitted status) breaches the 2bd SLA? no — 1.6 < 2', () => {
  const now = TUE + 0.6 * DAY;
  const s = { id: 'X', status: 'submitted', submittedAt: MON, history: [] };
  const st = slaState(s, now);
  assert.equal(st.ageBusinessDays, 1.6);
  assert.equal(st.slaBreached, false); // 1.6 bd < threshold 2 — the FLOORING bug made even 2.4 look like 1
});

test('2.4 business days pending breaches; 1.4 does not', () => {
  const old = { id: 'A', status: 'submitted', submittedAt: MON, history: [] };
  assert.equal(slaState(old, TUE + 1.4 * DAY).slaBreached, true);  // 2.4 bd ≥ 2
  const young = { id: 'B', status: 'submitted', submittedAt: MON, history: [] };
  assert.equal(slaState(young, TUE + 0.4 * DAY).slaBreached, false); // 1.4 bd < 2
});

test('query_raised pauses the SLA timer (a11)', () => {
  const s = { id: 'C', status: 'query_raised', submittedAt: MON, history: [] };
  assert.equal(slaState(s, TUE + 5 * DAY).slaBreached, false); // however old, paused
});

test('partner_updated restarts the clock (a11)', () => {
  const restartTs = TUE; // resubmitted one business day after submission
  const s = {
    id: 'D', status: 'submitted', submittedAt: MON,
    history: [{ status: 'partner_updated', label: 'resubmitted', ts: restartTs }],
  };
  // 3 bd after SUBMISSION but only 2 bd after the RESTART → breaches at exactly 2
  assert.equal(slaState(s, TUE + 2 * DAY).slaBreached, true);
  // 1.4 bd after the restart → not breached even though 2.4 bd after submission
  assert.equal(slaState(s, TUE + 1.4 * DAY).slaBreached, false);
});

test('the LATEST partner_updated wins', () => {
  const s = {
    id: 'E', status: 'submitted', submittedAt: MON,
    history: [
      { status: 'partner_updated', label: 'r1', ts: MON + DAY },
      { status: 'partner_updated', label: 'r2', ts: TUE + 2 * DAY },
    ],
  };
  const st = slaState(s, TUE + 3 * DAY); // only 1 bd after r2
  assert.equal(st.ageBusinessDays, 1);
  assert.equal(st.slaBreached, false);
});

test('non-pending statuses never breach', () => {
  for (const status of ['approved', 'rejected', 'onboarding']) {
    assert.equal(slaState({ id: 'F', status, submittedAt: MON, history: [] }, TUE + 9 * DAY).slaBreached, false);
  }
});

test('boundary: exactly 2 business days breaches', () => {
  const s = { id: 'G', status: 'submitted', submittedAt: MON, history: [] };
  assert.equal(slaState(s, MON + 3 * DAY).slaBreached, true); // Mon 00:00 → Thu 00:00 = 3 bd (≥2)
  assert.equal(slaState(s, MON + 2 * DAY).slaBreached, true);  // exactly 2 bd (≥ 2, not > 2)
});

test('fractional boundary: 1.9 bd does not breach, 2.0 bd does (the v1.1 floor bug)', () => {
  // v1.1's whole-day stepper read 1.9 bd as 1 — under threshold 2 nothing between
  // 2.0 and 3.0 could ever fire. The fractional clock must see 1.9 and 2.0 exactly.
  const s = { id: 'H', status: 'submitted', submittedAt: MON, history: [] };
  const st19 = slaState(s, MON + 1.9 * DAY);
  assert.equal(st19.ageBusinessDays, 1.9);
  assert.equal(st19.slaBreached, false);
  const st20 = slaState(s, MON + 2 * DAY);
  assert.equal(st20.ageBusinessDays, 2);
  assert.equal(st20.slaBreached, true);
});
