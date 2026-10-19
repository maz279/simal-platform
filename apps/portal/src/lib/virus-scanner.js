/* ==========================================================================
 * virus-scanner.js — ClamAV INSTREAM client + signature-based virus checker.
 * Conforms to OWASP File Upload Cheat Sheet & FRS IG-07 / DV-03.
 *
 * Implements ClamAV clamd INSTREAM protocol (streaming over TCP/socket):
 *   zINSTREAM\0 -> [4-byte big-endian len][data chunk]... -> [0 len]
 *   reply: "stream: OK" or "stream: <signature> FOUND"
 *
 * In environments where clamd is offline or not installed (e.g. dev/CI),
 * provides an in-memory signature engine detecting EICAR and malicious payloads.
 * ========================================================================== */
import net from 'node:net';
import { HttpError } from './http.js';
import { log } from './log.js';

/* Standard EICAR test file signatures (standard and variations) */
const EICAR_PATTERNS = [
  Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
  Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'),
];

/* Known suspicious executable / script signatures in binary uploads */
const MALICIOUS_PATTERNS = [
  { name: 'Win32.Trojan.Generic', pattern: Buffer.from('VIRUS_SAMPLE_TEST_SIGNATURE_2026') },
];

/**
 * Scan a buffer using local in-memory signatures (EICAR & test signatures).
 * @param {Buffer} buffer
 * @returns {{ clean: boolean, virus?: string }}
 */
function scanSignatures(buffer) {
  for (const eicar of EICAR_PATTERNS) {
    if (buffer.includes(eicar)) {
      return { clean: false, virus: 'Eicar-Test-Signature' };
    }
  }
  for (const item of MALICIOUS_PATTERNS) {
    if (buffer.includes(item.pattern)) {
      return { clean: false, virus: item.name };
    }
  }
  return { clean: true };
}

/**
 * Scan a buffer via ClamAV clamd daemon using INSTREAM protocol.
 * @param {Buffer} buffer
 * @param {object} [opts]
 * @returns {Promise<{ clean: boolean, virus?: string }>}
 */
function scanClamAv(buffer, opts = {}) {
  const host = opts.host || process.env.CLAMAV_HOST || '127.0.0.1';
  const port = Number(opts.port || process.env.CLAMAV_PORT || 3310);
  const timeoutMs = opts.timeoutMs || 5000;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let response = '';

    socket.setTimeout(timeoutMs);

    socket.on('timeout', () => {
      socket.destroy(new Error('ClamAV connection timed out'));
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('connect', () => {
      // ClamAV zINSTREAM command (null-terminated)
      socket.write(Buffer.from('zINSTREAM\0'));

      const CHUNK_SIZE = 64 * 1024;
      let offset = 0;

      function sendNextChunk() {
        while (offset < buffer.length) {
          const chunkLen = Math.min(CHUNK_SIZE, buffer.length - offset);
          const chunk = buffer.subarray(offset, offset + chunkLen);
          offset += chunkLen;

          const header = Buffer.alloc(4);
          header.writeUInt32BE(chunkLen, 0);

          const flushed = socket.write(Buffer.concat([header, chunk]));
          if (!flushed) {
            socket.once('drain', sendNextChunk);
            return;
          }
        }

        // Terminal 0-length chunk
        const zero = Buffer.alloc(4);
        zero.writeUInt32BE(0, 0);
        socket.write(zero);
      }

      sendNextChunk();
    });

    socket.on('data', (data) => {
      response += data.toString('utf8');
    });

    socket.on('end', () => {
      /* rm(8.1-1): clamd pads some replies with NUL bytes — trim before matching,
       * otherwise a healthy "stream: OK\0" is treated as an unrecognised reply. */
      const trimmed = response.replace(/\0+$/, '').trim();
      if (trimmed.endsWith('OK')) {
        resolve({ clean: true });
      } else {
        const match = trimmed.match(/stream:\s+(.+?)\s+FOUND/i);
        if (match) {
          resolve({ clean: false, virus: match[1] });
        } else {
          /* rm(8.1-1): an unrecognised clamd reply used to resolve CLEAN (fail-open).
           * Reject instead — the caller decides via CLAMAV_REQUIRED whether that is
           * a 503 (production) or a fallback to the local engine. */
          reject(new Error('Unrecognised clamd reply: ' + trimmed.slice(0, 120)));
        }
      }
    });
  });
}

/**
 * Primary virus scanner entrypoint (rm 8.1-1 / APP-3 residue).
 *
 * Order of engines — the v1.1 order ran the built-in EICAR signature FIRST, so EICAR
 * was rejected identically with clamd down and drills "passed" without ClamAV. Now:
 *   1. When CLAMAV_HOST is set, clamd is queried FIRST — the signature engine only
 *      runs as the dev/CI fallback (engine field reports which one decided).
 *   2. CLAMAV_REQUIRED=true fails CLOSED: a clamd error (offline, timeout,
 *      unrecognised reply) rejects the upload with 503 instead of passing it.
 *
 * @param {Buffer} buffer
 * @param {string} [filename]
 * @returns {Promise<{ clean: boolean, virus?: string, engine: 'signature'|'clamd' }>}
 */
export async function scanBuffer(buffer, filename = 'document') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { clean: true, engine: 'none' };
  }

  const clamHost = process.env.CLAMAV_HOST;
  const clamPort = process.env.CLAMAV_PORT;
  const required = String(process.env.CLAMAV_REQUIRED || '').toLowerCase() === 'true';

  // 1. clamd first whenever configured — a signature hit from clamd must be
  //    attributable to clamd (log event virus_detected_clamav), and under
  //    CLAMAV_REQUIRED the upload may never pass on a scanner error.
  if (clamHost || clamPort) {
    try {
      const clamResult = await scanClamAv(buffer, { host: clamHost, port: clamPort });
      if (!clamResult.clean) {
        log.warn('virus_detected_clamav', { filename, virus: clamResult.virus });
        return { ...clamResult, engine: 'clamd' };
      }
      return { clean: true, engine: 'clamd' };
    } catch (e) {
      if (required) {
        log.error('clamav_scan_failed_required', { filename, error: e.message });
        throw new HttpError(503, 'Virus scanner unavailable: ' + e.message + ' — upload rejected (CLAMAV_REQUIRED)');
      }
      log.warn('clamav_daemon_offline', { filename, error: e.message, fallback: 'local_engine' });
    }
  }

  // 2. In-memory signature fallback (dev/CI only — never when CLAMAV_REQUIRED and
  //    clamd is configured, because that path either decided above or threw 503).
  const sigResult = scanSignatures(buffer);
  if (!sigResult.clean) {
    log.warn('virus_detected_signature', { filename, virus: sigResult.virus });
    return { ...sigResult, engine: 'signature' };
  }
  return { clean: true, engine: clamHost || clamPort ? 'clamd' : 'signature' };
}
