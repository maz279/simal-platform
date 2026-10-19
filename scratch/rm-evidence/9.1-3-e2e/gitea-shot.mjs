// Screenshot a CI platform run page (Gitea UI) as visual evidence.
// node gitea-shot.mjs <runId> <outPng>
import fs from 'node:fs';
import { launch } from './cdp.mjs';
const [runId, out] = process.argv.slice(2);
const { password } = JSON.parse(fs.readFileSync('C:/software_project/Simal_Corporate_website/Codebase/data/ci-platform/credentials.json', 'utf8'));
const browser = await launch({ width: 1440, height: 1000 });
const page = await browser.newPage();
try {
  await page.goto('http://localhost:3000/user/login', 800);
  await page.type('#user_name', 'simal-ci');
  await page.type('#password', password);
  await page.click('form.ui.form button.ui.primary.button', { navigate: true, settle: 1000 });
  await page.goto(`http://localhost:3000/simal-ci/simal-platform/actions/runs/${runId}`, 2500);
  const jobs = await page.ev(`[...document.querySelectorAll('.job-brief-item, .job-brief-list a, [class*=job-brief]')].map(e => e.innerText.trim().split('\\n')[0]).filter(Boolean)`);
  console.log('run page title:', await page.ev('document.title'));
  console.log('job entries visible:', jobs.length);
  await page.shot(out);
  console.log('saved', out);
} finally { await browser.close(); }
