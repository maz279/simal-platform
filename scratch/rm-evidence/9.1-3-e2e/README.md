# rm(9.1-3) browser E2E harness

These scripts drive real Chrome over the DevTools protocol against the running
rig: portal on :8090 and edge on :8100, which serves the SSG deploy target.
Staff credentials are read from `apps/portal/.env` and never printed. Paths are
rig-absolute, because this is an evidence harness and not a CI gate.

| Script | What it proves |
| --- | --- |
| `publish-loop.mjs` | CMS publish → SSG worker build → deploy → served by :8100; telemetry names the build (10 checks) |
| `site-e2e.mjs` | Hero carousel (tabs, arrows, pause, deep link, CTA); consent banner across pages; add-to-RFQ → basket; 13 key EN/AR pages; header search + `/search/` + `/compare/`; mobile overflow; every home link (99) and every sitemap URL (232 + 2): 200, 0 exceptions, 0 CSP violations (68 checks) |
| `cms-e2e.mjs` | Staff login through the form (TOTP when required); admin console; all 32 CMS views; sidebar and dashboard navigation; publish pipeline; navigation editor payload; logout ends the session (13 checks) |
| `gitea-shot.mjs` | Screenshot of a CI platform run page |
| `cdp.mjs` | The driver: real mouse/keyboard input, exception, console, CSP and request capture |

```bash
node publish-loop.mjs
node site-e2e.mjs <iteration> <shotDir>
node cms-e2e.mjs <iteration> <shotDir>
```

Results for the three iterations are in `../9.1-milestone-evidence.md`.
The iteration 3 logs are `../9.1-3-it3-*.log`, and the screenshots are in `shots/`.
