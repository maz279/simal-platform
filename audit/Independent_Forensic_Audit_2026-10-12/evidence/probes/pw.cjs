const pw = require('C:/Users/maz_2/AppData/Local/ms-playwright-go/1.57.0/package');
const EXE = 'C:/Users/maz_2/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const _launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = (o = {}) => _launch({ executablePath: EXE, ...o });
module.exports = pw;
