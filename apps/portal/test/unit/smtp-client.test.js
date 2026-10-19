// deploy-audit H5: the SMTP client against a scripted relay — STARTTLS with EHLO re-sent, AUTH
// only inside TLS, CRLF bodies, RFC 2047 subjects, no plaintext fallback, no header injection.
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import tls from 'node:tls';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

process.env.DOC_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString('base64');
const { smtpSend } = await import('../../src/services/notify.service.js');

/* throwaway self-signed certificate for the relay (generated per run, never stored in git) */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'smtp-'));
const gen = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
  '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', path.join(TMP, 'k.pem'), '-out', path.join(TMP, 'c.pem')], { encoding: 'utf8' });
const HAVE_TLS = gen.status === 0;
const KEY = HAVE_TLS ? fs.readFileSync(path.join(TMP, 'k.pem')) : null;
const CERT = HAVE_TLS ? fs.readFileSync(path.join(TMP, 'c.pem')) : null;

function relay({ starttls = 'ok' } = {}) {
  const log = { cmds: [], data: '', authOverTls: null };
  const server = net.createServer((raw) => {
    let sock = raw, secure = false, buf = '', inData = false;
    const say = (l) => sock.write(l + '\r\n');
    const onLine = (line) => {
      if (inData) {
        if (line === '.') { inData = false; say('250 queued'); return; }
        log.data += line + '\n';
        return;
      }
      log.cmds.push((secure ? 'tls:' : '') + line.split(' ')[0].toUpperCase());
      if (/^EHLO/i.test(line)) { say('250-relay.test'); if (!secure) say('250-STARTTLS'); say('250 AUTH PLAIN'); }
      else if (/^STARTTLS/i.test(line)) {
        if (starttls !== 'ok') return say('454 TLS not available');
        say('220 go ahead');
        sock.removeAllListeners('data');
        sock = new tls.TLSSocket(raw, { isServer: true, key: KEY, cert: CERT });
        secure = true; buf = '';
        sock.on('data', onData);
      }
      else if (/^AUTH/i.test(line)) { log.authOverTls = secure; say('235 ok'); }
      else if (/^(MAIL|RCPT)/i.test(line)) say('250 ok');
      else if (/^DATA/i.test(line)) { inData = true; say('354 send'); }
      else if (/^QUIT/i.test(line)) { say('221 bye'); sock.end(); }
      else say('500 what');
    };
    const onData = (c) => {
      buf += c.toString('utf8');
      log.rawHasBareLf = log.rawHasBareLf || /[^\r]\n/.test(buf);
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2); onLine(l); }
    };
    sock.on('data', onData);
    sock.on('error', () => {});
    say('220 relay.test ESMTP');
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res({ server, port: server.address().port, log })));
}

test('STARTTLS: EHLO again inside TLS, AUTH only over TLS, CRLF body, encoded subject', { skip: !HAVE_TLS && 'openssl not available' }, async () => {
  const { server, port, log } = await relay();
  try {
    const r = await smtpSend({ host: '127.0.0.1', port, user: 'u', pass: 'p', from: 'Simal <kyc@simalme.com>', tlsOptions: { ca: CERT } },
      { to: 'partner@example.com', subject: 'تأكيد — confirm', text: 'line one\nline two\n.dot line' });
    assert.deepEqual(r, { via: 'smtp', tls: true });
    assert.deepEqual(log.cmds, ['EHLO', 'STARTTLS', 'tls:EHLO', 'tls:AUTH', 'tls:MAIL', 'tls:RCPT', 'tls:DATA', 'tls:QUIT']);
    assert.equal(log.authOverTls, true);
    assert.ok(!log.rawHasBareLf, 'every line ends in CRLF');
    assert.match(log.data, /^Subject: =\?UTF-8\?B\?/m);
    assert.match(log.data, /^line two$/m);
    assert.match(log.data, /^\.\.dot line$/m, 'dot-stuffed');
  } finally { server.close(); }
});

test('a relay that refuses STARTTLS gets no credentials and no message', async () => {
  const { server, port, log } = await relay({ starttls: 'refuse' });
  try {
    await assert.rejects(smtpSend({ host: '127.0.0.1', port, user: 'u', pass: 'p', from: 'kyc@simalme.com' },
      { to: 'partner@example.com', subject: 's', text: 't' }), /454 at STARTTLS/);
    assert.deepEqual(log.cmds, ['EHLO', 'STARTTLS']);
  } finally { server.close(); }
});

test('a recipient carrying CRLF cannot inject SMTP commands or headers', async () => {
  await assert.rejects(smtpSend({ host: '127.0.0.1', port: 1, from: 'kyc@simalme.com' },
    { to: 'a@b.test\r\nRCPT TO:<x@evil.test>', subject: 's', text: 't' }), /invalid recipient/);
});
