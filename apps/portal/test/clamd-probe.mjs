// rm(8.1-1) raw clamd INSTREAM probe (no shell escaping of the EICAR string).
import net from 'node:net';
const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', 'latin1');
const clean = Buffer.from('%PDF-1.4 clean test file for simal rm-8.1 drill');
function instream(buf) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host: '127.0.0.1', port: 3310 });
    let out = '';
    s.setTimeout(15000);
    s.on('timeout', () => s.destroy(new Error('timeout')));
    s.on('error', reject);
    s.on('connect', () => {
      s.write(Buffer.from('zINSTREAM\0'));
      const hdr = Buffer.alloc(4); hdr.writeUInt32BE(buf.length);
      s.write(Buffer.concat([hdr, buf]));
      s.write(Buffer.alloc(4));
    });
    s.on('data', (d) => { out += d.toString(); });
    s.on('end', () => resolve(out.trim()));
  });
}
console.log('clean reply:', await instream(clean));
console.log('eicar reply:', await instream(eicar));
