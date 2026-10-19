// isolate scanBuffer against the live clamd with the exact drill EICAR bytes
const { scanBuffer } = await import('../src/lib/virus-scanner.js');
const EICAR = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', 'latin1');
const clean = Buffer.from('%PDF-1.4 clean probe');
console.log('eicar scan:', JSON.stringify(await scanBuffer(EICAR, 'eicar.pdf')));
console.log('clean scan:', JSON.stringify(await scanBuffer(clean, 'x.pdf')));
