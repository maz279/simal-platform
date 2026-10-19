import fs from 'node:fs';
const p = 'C:/software_project/Simal_Corporate_website/Audit/Independent_Forensic_Audit_2026-10-12/audit_report_2/ROADMAP_TASK_TRACKER.csv';
let t = fs.readFileSync(p, 'utf8');
const lines = t.split(/\r?\n/);
let hits = 0;
for (let i = 0; i < lines.length; i++) {
  if (/^"RM-6\.3-[12]"/.test(lines[i]) && lines[i].includes('"open"')) {
    lines[i] = lines[i].replace('"open",""', '"done","scratch/rm-evidence/6.3-milestone-evidence.md"');
    hits++;
    console.log('marked:', lines[i].slice(0, 60));
  }
}
if (hits !== 2) { console.error('expected 2 rows, matched ' + hits); process.exit(1); }
fs.writeFileSync(p, lines.join('\r\n'));
console.log('tracker updated OK');
