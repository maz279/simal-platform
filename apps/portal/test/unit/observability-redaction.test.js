// test/unit/observability-redaction.test.js — rm(9.3-1)/NFR-3
// The PDPL redaction applied before ANY payload leaves the box: TRN/IBAN/phone
// digit runs must become [n]; short numbers must survive; the message is capped.
import test from 'node:test';
import assert from 'node:assert/strict';
import { redactObsMessage } from '../../src/lib/log.js';

test('NFR-3 redaction: 15-digit TRNs and 21-digit IBAN bodies become [n]', () => {
  assert.equal(redactObsMessage('duplicate TRN 100200300040090 rejected'), 'duplicate TRN [n] rejected');
  assert.equal(redactObsMessage('IBAN AE860260001013312996200000 mismatch'), 'IBAN AE[n] mismatch');
});

test('NFR-3 redaction: phone-length runs are stripped, short numbers survive', () => {
  assert.equal(redactObsMessage('call +971508487861 failed'), 'call +[n] failed');
  assert.equal(redactObsMessage('retry 12345 after 5 s'), 'retry 12345 after 5 s');
  assert.equal(redactObsMessage('port 5433 db simal'), 'port 5433 db simal');
});

test('NFR-3 redaction: null/undefined become empty, message capped at 200 chars', () => {
  assert.equal(redactObsMessage(null), '');
  assert.equal(redactObsMessage(undefined), '');
  const long = 'x'.repeat(500);
  assert.equal(redactObsMessage(long).length, 200);
  const numeric = ('7'.repeat(400) + ' end');
  assert.ok(!/\d{6,}/.test(redactObsMessage(numeric)), 'no long digit run survives');
});
