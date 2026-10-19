/* ==========================================================================
 * form.js — 7-step KYC wizard, API-backed (drafts, staging, submission).
 * Client validates for UX; the server is the authority (422 → field errors).
 * ========================================================================== */
(function () {
  'use strict';

  function param(name) { return new URLSearchParams(location.search).get(name); }
  var role = param('role') === 'customer' ? 'customer' : (param('role') === 'vendor' ? 'vendor' : null);
  if (!role) { location.replace('index.html'); return; }

  var $ = (s, c) => (c || document).querySelector(s);
  var $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  var form = document.getElementById('kyc-form');

  var STEP_LABELS = ['Company', 'Tax & e-invoicing', 'Contacts', 'Signatories & UBO', 'Banking', 'Documents', 'Declare & submit'];
  var state = {
    role, email: null, step: 1, stepReached: 1,
    draftId: null, draftToken: null,
    inviteCode: param('invite') || null,
    data: blankData(),
    documents: []   /* staged docs: [{type,name,size,mime,docId}] */
  };
  function blankData() {
    return { company: { address: {} }, tax: {}, contacts: { primary: {}, finance: {}, other: {} },
      signatories: [blankSignatory()], ubos: [], banking: {}, declarations: {} };
  }
  function blankSignatory() { return { id_type: 'eid', authority_basis: '' }; }

  /* ---------- role setup ---------- */
  function applyRole() {
    $('#wizard-title').textContent = role === 'vendor' ? 'Vendor / Supplier onboarding' : 'Customer onboarding';
    $('#gate-role-badge').textContent = role === 'vendor' ? 'Vendor / Supplier' : 'Customer';
    $('#warehouse-q').hidden = role !== 'vendor';
    $('#credit-field').hidden = role !== 'customer';
    if (role === 'vendor') {
      $('#f-fc_name').dataset.rules = 'required';
      $('#f-fc_email').dataset.rules = 'required email';
    }
  }

  /* ---------- path utils ---------- */
  function getPath(o, p) { return p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o); }
  function setPath(o, p, v) {
    const ks = p.split('.'); let cur = o;
    for (let i = 0; i < ks.length - 1; i++) { if (typeof cur[ks[i]] !== 'object' || !cur[ks[i]]) cur[ks[i]] = {}; cur = cur[ks[i]]; }
    cur[ks[ks.length - 1]] = v;
  }
  function evalCond(expr) {
    return expr.split('&&').every(part => {
      const m = part.trim().match(/^([a-zA-Z_.]+)\s*(===|!==)\s*'(.+)'$/);
      if (m) {
        const v = getPath(state.data, m[1]);
        const s = v === undefined || v === null ? '' : String(v);
        return m[2] === '===' ? s === m[3] : s !== m[3];
      }
      return !!getPath(state.data, part);
    });
  }
  function applyConditions() {
    $$('[data-show]').forEach(el => { el.hidden = !evalCond(el.getAttribute('data-show')); });
  }

  /* ---------- collect / fill ---------- */
  function collectField(el) {
    if (el.type === 'radio') { if (el.checked) setPath(state.data, el.name, el.value); return; }
    if (el.type === 'checkbox') { setPath(state.data, el.name, el.checked); return; }
    setPath(state.data, el.name, el.value);
  }
  function collectAll() {
    $$('input[name], select[name], textarea[name]', form).forEach(el => {
      if (el.type === 'radio') { if (el.checked) setPath(state.data, el.name, el.value); }
      else collectField(el);
    });
  }
  function fill() {
    $$('input[name], select[name], textarea[name]', form).forEach(el => {
      if (el.type === 'radio') {
        if (String(getPath(state.data, el.name) || '') === el.value) el.checked = true;
        return;
      }
      if (el.type === 'checkbox') { el.checked = !!getPath(state.data, el.name); return; }
      const v = getPath(state.data, el.name);
      if (v !== undefined && v !== null) el.value = v;
    });
    renderSignatories(); renderUbos(); renderBranchTrns(); renderDocLists(); renderSummary();
  }

  /* ---------- client validation (quick; server is authority) ---------- */
  const MESSAGES = {
    required: 'This field is required.', email: 'Enter a valid email address.',
    phone: 'Enter a valid phone number.', url: 'Enter a valid URL starting with http:// or https://',
    number: 'Numbers only, please.', pct: 'Enter a percentage between 0 and 100.',
    peppol: 'Peppol ID format: scheme:number, e.g. 0235:<TIN>',
    tin: 'UAE TIN is exactly 15 digits.', iban: 'Enter a valid IBAN (UAE: 23 characters).',
    eid: 'Enter a valid Emirates ID or switch to Passport.',
    dateNotPast: 'This date must be in the future.', dateNotFuture: 'This date cannot be in the future.'
  };
  function fieldVisible(el) {
    let n = el;
    while (n && n !== form) { if (n.hidden) return false; n = n.parentElement; }
    return true;
  }
  function validateControl(el) {
    const rules = (el.dataset.rules || '').split(/\s+/).filter(Boolean);
    if (!fieldVisible(el)) { setFieldError(el, null); return true; }
    const value = el.value.trim();
    for (const r of rules) {
      let ok = true;
      if (r === 'required' || r === 'requiredIfVisible') ok = !!value;
      else if (r === 'email') ok = !value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
      else if (r === 'phone') ok = !value || /^\+?[0-9][0-9\s-]{6,17}$/.test(value);
      else if (r === 'url') ok = !value || /^https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/\S*)?$/.test(value);
      else if (r === 'number') ok = !value || /^-?\d+(\.\d+)?$/.test(value);
      else if (r === 'pct') ok = !value || (parseFloat(value) >= 0 && parseFloat(value) <= 100);
      else if (r === 'peppol') ok = !value || /^\d{4}:[A-Za-z0-9.\-+]{4,20}$/.test(value);
      else if (r === 'tin') ok = !value || /^\d{15}$/.test(value);
      else if (r === 'iban') {
        const ib = value.replace(/\s+/g, '').toUpperCase();
        ok = !value || (ib.startsWith('AE') ? /^AE\d{21}$/.test(ib) : /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(ib));
      }
      else if (r === 'eid') ok = !value || /^784-?\d{4}-?\d{7}-?\d$/.test(value);
      else if (r === 'dateNotPast') ok = !value || new Date(value).getTime() > Date.now();
      else if (r === 'dateNotFuture') ok = !value || new Date(value).getTime() <= Date.now();
      if (!ok) { setFieldError(el, MESSAGES[r] || 'Invalid value.'); return false; }
    }
    setFieldError(el, null);
    return true;
  }
  function setFieldError(el, msg) {
    const wrap = el.closest('.field');
    if (!wrap) { el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return; }
    const err = wrap.querySelector('[data-err]');
    if (msg) {
      wrap.classList.add('invalid');
      el.setAttribute('aria-invalid', 'true');
      if (err) {
        if (!err.id) { window.__errIdSeq = (window.__errIdSeq || 0) + 1; err.id = 'err-' + String(el.id || el.name || 'f' + window.__errIdSeq).replace(/[^a-zA-Z0-9-]/g, ''); }
        err.innerHTML = UI.icon('alertTri', 12) + ' ' + UI.esc(msg);
        el.setAttribute('aria-describedby', err.id);
      }
    } else {
      wrap.classList.remove('invalid');
      el.setAttribute('aria-invalid', 'false');
      el.removeAttribute('aria-describedby');
      if (err) err.textContent = '';
    }
  }
  function validateStep(n) {
    let ok = true, firstBad = null;
    $$(`#step-${n} [data-rules]`).forEach(el => {
      const good = validateControl(el);
      if (!good) { ok = false; if (!firstBad) firstBad = el; }
    });
    if (n === 7) {
      const allDec = ['dec-accuracy', 'dec-ubo', 'dec-updates', 'dec-pdpl'].every(id => $('#' + id).checked);
      const sig = $('#dec-signature').value.trim();
      if (!allDec || sig.length < 3) {
        ok = false;
        $('#sig-error').hidden = allDec;
        if (!allDec) UI.toast('Please accept all four declarations to continue.', 'warn');
      } else $('#sig-error').hidden = true;
    }
    if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return ok;
  }

  /* ---------- stepper ---------- */
  function buildStepper() {
    const ol = $('#stepper'); ol.innerHTML = '';
    STEP_LABELS.forEach((label, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="step-index"></span><span>' + UI.esc(label) + '</span>';
      li.addEventListener('click', () => { if (i + 1 <= state.stepReached && i + 1 <= state.step) gotoStep(i + 1); });
      ol.appendChild(li);
    });
  }
  function paintStepper() {
    $$('#stepper li').forEach((li, i) => {
      li.classList.toggle('active', i + 1 === state.step);
      li.querySelector('.step-index').innerHTML = (i + 1 < state.step) ? UI.icon('check', 12) : String(i + 1);
      li.setAttribute('aria-current', i + 1 === state.step ? 'step' : 'false');
    });
  }
  function gotoStep(n) {
    state.step = n; state.stepReached = Math.max(state.stepReached, n);
    $$('.step-body', form).forEach(p => {
      const show = Number(p.dataset.step) === n;
      if (show && p.hidden) { p.classList.remove('step-enter'); void p.offsetWidth; p.classList.add('step-enter'); }
      p.hidden = !show;
    });
    paintStepper();
    $('#btn-prev').disabled = n === 1;
    $('#btn-next').hidden = n === 7;
    $('#btn-submit').hidden = n !== 7;
    $('#step-counter').textContent = 'Step ' + n + ' of 7';
    applyConditions();
    if (n === 7) renderSummary();
    if (n === 6) refreshDocRequiredFlags();
    saveDraft();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- repeatables ---------- */
  function renderSignatories() {
    const list = $('#signatory-list'); list.innerHTML = '';
    state.data.signatories.forEach((sig, i) => {
      const node = $('#tpl-signatory').content.firstElementChild.cloneNode(true);
      node.querySelector('[data-idx]').textContent = i + 1;
      node.querySelector('[data-remove]').addEventListener('click', () => { state.data.signatories.splice(i, 1); renderSignatories(); });
      /* the ID-number format follows the chosen ID type: EID layout vs free-form passport */
      const idNum = node.querySelector('[data-f="id_number"]');
      const syncIdRule = () => {
        idNum.dataset.rules = 'required' + (sig.id_type === 'eid' ? ' eid' : '');
        idNum.placeholder = sig.id_type === 'eid' ? '784-YYYY-NNNNNNN-C' : 'e.g. P1234567';
      };
      syncIdRule();
      $$('[data-f]', node).forEach(inp => {
        const f = inp.dataset.f;
        if (sig[f] !== undefined && sig[f] !== null) inp.value = sig[f];
        inp.addEventListener('input', () => { sig[f] = inp.value; debounceSave(); });
        inp.addEventListener('change', () => { sig[f] = inp.value; if (f === 'id_type') syncIdRule(); debounceSave(); });
      });
      list.appendChild(node);
    });
  }
  function renderUbos() {
    const list = $('#ubo-list'); list.innerHTML = '';
    state.data.ubos.forEach((ubo, i) => {
      const node = $('#tpl-ubo').content.firstElementChild.cloneNode(true);
      node.querySelector('[data-idx]').textContent = i + 1;
      node.querySelector('[data-remove]').addEventListener('click', () => { state.data.ubos.splice(i, 1); renderUbos(); updateUboTotal(); });
      $$('[data-f]', node).forEach(inp => {
        const f = inp.dataset.f;
        if (ubo[f] !== undefined && ubo[f] !== null) inp.value = ubo[f];
        inp.addEventListener('input', () => { ubo[f] = inp.value; debounceSave(); if (f === 'ownership_pct') updateUboTotal(); });
      });
      list.appendChild(node);
    });
    updateUboTotal();
  }
  function updateUboTotal() {
    const total = state.data.ubos.reduce((a, u) => a + (parseFloat(u.ownership_pct) || 0), 0);
    const hint = $('#ubo-total-hint');
    hint.textContent = 'Ownership total: ' + Math.round(total * 100) / 100 + '%';
    hint.style.color = (total > 100 || (state.data.ubos.length && total < 100)) ? 'var(--warn-700)' : 'var(--gray-500)';
  }
  function renderBranchTrns() {
    const list = $('#branch-trn-list'); list.innerHTML = '';
    const arr = state.data.tax.branch_trns = state.data.tax.branch_trns || [];
    arr.forEach((v, i) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<input class="input mono" style="max-width:280px" value="' + UI.esc(v) + '" maxlength="15" aria-label="Branch TRN">' +
        '<button type="button" class="icon-btn" aria-label="Remove">' + UI.icon('x', 14) + '</button>';
      row.querySelector('input').addEventListener('input', e => { arr[i] = e.target.value; debounceSave(); });
      row.querySelector('button').addEventListener('click', () => { arr.splice(i, 1); renderBranchTrns(); });
      list.appendChild(row);
    });
  }

  /* ---------- documents (server-staged, magic-byte verified) ---------- */
  const EXT_OK = ['pdf', 'jpg', 'jpeg', 'png', 'heic'];
  function buildDocSlots() {
    const wrap = $('#doc-slots'); wrap.innerHTML = '';
    ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'ubo_ids', 'tenancy', 'bank_proof', 'poa', 'signature'].forEach(id => {
      const t = { trade_license: 'Trade Licence', trn_cert: 'TRN Certificate', moa: 'MOA / Articles', signatory_id: 'Signatory Emirates ID / Passport', ubo_ids: 'UBO ID Documents', tenancy: 'Tenancy / Ejari', bank_proof: 'Bank Letter / Cheque', poa: 'POA / Board Resolution', signature: 'Specimen Signature & Stamp' }[id];
      const div = document.createElement('div');
      div.className = 'form-section'; div.dataset.doc = id;
      div.innerHTML = '<h4>' + t + ' <span class="badge badge-neutral req-flag" hidden>Required</span></h4>' +
        '<div class="dropzone" tabindex="0" role="button" aria-label="Upload ' + t + '">' +
        '<div class="dz-icon">' + UI.icon('upload', 26) + '</div>' +
        '<div class="dz-title">Drag &amp; drop, or <span class="link">browse files</span></div>' +
        '<div class="dz-hint">PDF, JPG, PNG or HEIC · max 10 MB</div>' +
        '<input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" multiple hidden></div>' +
        '<div class="stack mt-2 file-list"></div>';
      const dz = div.querySelector('.dropzone'), input = div.querySelector('input[type=file]');
      dz.addEventListener('click', () => input.click());
      dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
      ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
      dz.addEventListener('drop', e => handleFiles(e.dataTransfer.files, div.dataset.doc));
      input.addEventListener('change', () => { handleFiles(input.files, div.dataset.doc); input.value = ''; });
      wrap.appendChild(div);
    });
    refreshDocRequiredFlags(); renderDocLists();
  }
  function refreshDocRequiredFlags() {
    const req = state.role === 'vendor'
      ? { trade_license: 1, trn_cert: 1, moa: 1, signatory_id: 1, tenancy: 1, ubo_ids: 1, bank_proof: 1 }
      : { trade_license: 1, trn_cert: 1, moa: 1, signatory_id: 1, bank_proof: 1 };
    if (state.data.signatories.some(s => s.authority_basis === 'POA')) req.poa = 1;
    $$('#doc-slots [data-doc]').forEach(div => {
      const flag = div.querySelector('.req-flag');
      const isReq = !!req[div.dataset.doc];
      flag.hidden = !isReq;
      flag.className = 'badge ' + (isReq ? 'badge-danger' : 'badge-neutral') + ' req-flag';
      flag.textContent = isReq ? 'Required' : 'Optional';
    });
  }
  async function handleFiles(files, docType) {
    const docs = Array.from(files).map(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (EXT_OK.indexOf(ext) < 0) { UI.toast('“' + f.name + '” rejected — allowed: PDF, JPG, PNG, HEIC', 'error'); return null; }
      if (f.size > 10 * 1024 * 1024) { UI.toast('“' + f.name + '” is over the 10 MB limit', 'error'); return null; }
      return f;
    }).filter(Boolean);
    if (!docs.length) return;
    UI.toast('Uploading ' + docs.length + ' file(s)…', 'info');
    /* base64 in 32 KB slices: one String.fromCharCode per byte was slow on a 10 MB scan */
    const toB64 = (buf) => {
      const bytes = new Uint8Array(buf); let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    };
    const readOne = (f) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res({ type: docType, name: f.name, mime: f.type || 'application/octet-stream', dataB64: toB64(r.result) });
      r.onerror = () => rej(new Error('Could not read “' + f.name + '”'));
      r.readAsArrayBuffer(f);
    });
    /* deploy-audit B3: one document per request, so a request stays inside the server's
     * per-upload body cap however many files are dropped at once */
    let done = 0;
    for (const f of docs) {
      try {
        const r = await API.stageDocuments(state.draftId, state.draftToken, [await readOne(f)]);
        /* merge by type: newer staged docs for a slot replace older ones */
        const byType = {};
        state.documents.forEach(d => { byType[d.type] = d; });
        (r.staged || []).forEach(s => { byType[s.type] = { type: s.type, name: s.name, size: s.size, mime: s.mime, docId: s.docId }; });
        state.documents = Object.values(byType);
        renderDocLists();
        done++;
      } catch (e) {
        UI.toast(e.message || 'Upload failed', 'error');
        if (e.details && e.details.length) UI.toast(e.details[0].message, 'error');
      }
    }
    if (done) UI.toast('Uploaded ' + done + ' file(s).', 'success');
  }
  function renderDocLists() {
    $$('#doc-slots [data-doc]').forEach(div => {
      const arr = state.documents.filter(d => d.type === div.dataset.doc);
      const list = div.querySelector('.file-list'); list.innerHTML = '';
      arr.forEach(f => {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.innerHTML = '<span class="file-ic">' + UI.icon('doc', 16) + '</span>' +
          '<span class="file-meta"><span class="file-name">' + UI.esc(f.name) + '</span>' +
          '<span class="file-sub">' + UI.fmtBytes(f.size) + ' · stored on server</span></span>';
        list.appendChild(row);
      });
      const missing = div.querySelector('.req-flag') && !div.querySelector('.req-flag').hidden && arr.length === 0;
      div.querySelector('.dropzone').style.borderColor = missing ? 'var(--danger-500)' : '';
      div.querySelector('.dz-hint').textContent = missing ? '⚠ This document is required before submitting' : 'PDF, JPG, PNG or HEIC · max 10 MB';
    });
  }

  /* ---------- summary ---------- */
  function kv(k, v) { return '<div class="kv"><div class="k">' + UI.esc(k) + '</div><div class="v">' + UI.esc(v || '—') + '</div></div>'; }
  function renderSummary() {
    const c = state.data.company || {}, t = state.data.tax || {}, b = state.data.banking || {}, p = state.data.contacts.primary || {};
    $('#review-summary').innerHTML = '<div class="kv-grid">' +
      kv('Role', role === 'vendor' ? 'Vendor / Supplier' : 'Customer') +
      kv('Legal name', c.legal_name_en) + kv('Licence no.', c.license_number) +
      kv('TRN', t.trn) + kv('Peppol ID', t.peppol_id) +
      kv('Primary contact', p.name ? p.name + ' · ' + p.email : '') +
      kv('Signatories', String((state.data.signatories || []).length)) +
      kv('Beneficial owners', String((state.data.ubos || []).length)) +
      kv('IBAN', b.iban ? b.iban.slice(0, 7) + '••••••' + b.iban.slice(-4) : '') +
      kv('Documents staged', String(state.documents.length)) + '</div>';
  }

  /* ---------- draft persistence (server) ---------- */
  let saveTimer = null;
  function debounceSave() { markSaving(); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 800); }
  function markSaving() { const el = $('#save-state'); el.className = 'save-state saving'; $('#save-state-text').textContent = 'Saving…'; }
  function markSaved() { const el = $('#save-state'); el.className = 'save-state saved'; $('#save-state-text').textContent = 'Saved ' + new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }); }
  function markOffline() { const el = $('#save-state'); el.className = 'save-state'; $('#save-state-text').textContent = 'Not connected'; }
  async function saveDraft() {
    if (!state.draftId) return;
    collectAll();
    try {
      await API.saveDraft(state.draftId, state.draftToken, { data: state.data, step: state.step });
      markSaved();
    } catch { markOffline(); }
  }

  /* ---------- duplicate-TRN live check (FR-P-015) ---------- */
  let trnTimer = null;
  function checkDuplicateTin(trn) {
    clearTimeout(trnTimer);
    if (!/^\d{15}$/.test(trn)) { $('#trn-duplicate-warning').hidden = true; return; }
    trnTimer = setTimeout(async () => {
      try {
        const r = await API.tinCheck(trn);
        const warn = $('#trn-duplicate-warning'), txt = $('#trn-duplicate-text');
        if (r.exists) {
          txt.innerHTML = 'This TRN is already on file as <b>' + UI.esc(r.company) + '</b> (' + UI.esc(r.reference) +
            ', ' + (UI.STATUS[r.status] ? UI.STATUS[r.status].label.toLowerCase() : r.status) + '). Continue only if this is an update or resubmission.';
          warn.hidden = false;
        } else warn.hidden = true;
      } catch { /* transient */ }
    }, 400);
  }

  /* ---------- submit ---------- */
  async function submitForm() {
    const btn = $('#btn-submit');
    btn.disabled = true; btn.textContent = 'Submitting…';
    collectAll();
    try {
      const application = {
        role, company: state.data.company, tax: state.data.tax, contacts: state.data.contacts,
        signatories: state.data.signatories, ubos: state.data.ubos, banking: state.data.banking,
        declarations: {
          accuracy: { checked: true, signed_name: $('#dec-signature').value.trim() },
          ubo_aml: { checked: $('#dec-ubo').checked },
          updates: { checked: $('#dec-updates').checked },
          pdpl_consent: { checked: $('#dec-pdpl').checked },
        },
      };
      const r = await API.submitApplication({
        draftId: state.draftId, draftToken: state.draftToken, application, inviteCode: state.inviteCode,
      });
      UI.toast('Submitted — reference ' + r.reference + (r.screeningClear === false ? ' (flagged for screening review)' : ''), 'success');
      setTimeout(() => {
        location.href = 'confirmation.html?ref=' + encodeURIComponent(r.reference) + '&email=' + encodeURIComponent(state.email);
      }, 600);
    } catch (e) {
      btn.disabled = false; btn.innerHTML = UI.icon('send', 16) + ' Submit for review';
      if (e.details && e.details.length) {
        UI.toast(e.details[0].message, 'error');
        const field = e.details[0].field || '';
        const stepMap = { company: 1, tax: 2, contacts: 3, signator: 4, ubo: 4, banking: 5, documents: 6, declarations: 7 };
        for (const pre of Object.keys(stepMap)) { if (field.startsWith(pre)) { gotoStep(stepMap[pre]); break; } }
      } else UI.toast(e.message || 'Submission failed', 'error');
    }
  }

  /* ---------- gate ---------- */
  const prefillEmail = param('email');
  if (prefillEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(prefillEmail)) $('#gate-email').value = prefillEmail;
  if (state.inviteCode) {
    API.inviteInfo(state.inviteCode).then(info => {
      const note = document.createElement('div');
      note.className = 'alert ' + (info.found ? 'alert-success' : 'alert-warn');
      note.innerHTML = info.found
        ? UI.icon('check', 15) + ' <span>Invitation <b>' + UI.esc(info.code) + '</b> recognised — welcome, <b>' + UI.esc(info.company) + '</b>.</span>'
        : UI.icon('info', 15) + ' <span>Invite code not recognised — you can still continue.</span>';
      $('#gate-email').closest('.field').after(note);
    }).catch(() => {});
  }
  $('#gate-continue').addEventListener('click', async () => {
    const em = $('#gate-email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      $('#gate-email').setAttribute('aria-invalid', 'true');
      $('#gate-email-err').style.display = 'inline-flex';
      return;
    }
    $('#gate-email').setAttribute('aria-invalid', 'false');
    $('#gate-email-err').style.display = 'none';
    $('#gate-continue').disabled = true;
    try {
      /* createDraft returns the EXISTING draft when one is open for email+role —
         restore its data/documents/step so "resume" actually resumes (FR-P-005/011) */
      const d = await API.createDraft(em, role);
      state.email = em; state.draftId = d.draftId; state.draftToken = d.token;
      let restored = false;
      const reapplyRef = param('reapply');
      if (reapplyRef) {
        try {
          const prev = await API.publicStatus(reapplyRef, em);
          if (prev && prev.data) {
            state.data = Object.assign(blankData(), prev.data);
            state.documents = prev.documents || [];
            restored = true;
            if (prev.rejection_reason) {
              const alertBox = document.createElement('div');
              alertBox.className = 'alert alert-warn mt-3 mb-4';
              alertBox.innerHTML = '<span><b>Prior submission feedback:</b> ' + UI.esc(prev.rejection_reason) + '<br><small>Update the flagged fields and resubmit.</small></span>';
              const wf = $('#kyc-form') || $('#wizard');
              if (wf && wf.parentElement) wf.parentElement.insertBefore(alertBox, wf);
            }
          }
        } catch {}
      } else if (d.data && Object.keys(d.data).length) {
        state.data = d.data;
        state.documents = d.documents || [];
        state.stepReached = Math.max(1, Math.min(7, d.step || 1));
        restored = true;
      }
      $('#gate').hidden = true; $('#wizard').hidden = false;
      init();
      if (restored) {
        gotoStep(state.stepReached, true);
        UI.toast(reapplyRef ? 'Loaded prior application — update flagged fields and submit.' : 'Draft restored — continuing at step ' + state.stepReached + ' of 7.', 'success');
      }
    } catch (e) {
      UI.toast(e.message || 'Could not start draft', 'error');
      $('#gate-continue').disabled = false;
    }
  });
  $('#gate-email').addEventListener('keydown', e => { if (e.key === 'Enter') $('#gate-continue').click(); });
  if (param('reapply') && prefillEmail) { setTimeout(() => $('#gate-continue').click(), 100); }

  /* ---------- init ---------- */
  let inited = false;
  function init() {
    if (inited) return; inited = true;
    applyRole(); buildStepper(); renderSignatories(); renderUbos(); renderBranchTrns(); buildDocSlots();
    fill(); bindEvents(); gotoStep(1, true); markSaved();
    setInterval(saveDraft, 30000);
  }

  function bindEvents() {
    form.addEventListener('input', e => {
      const el = e.target;
      if (el.name) { collectField(el); applyConditions(); debounceSave(); }
      if (el.dataset.f) debounceSave();
      if (el.id === 'dec-signature') $('#sign-preview').textContent = el.value;
      if (el.id === 'f-trn') checkDuplicateTin(el.value.trim());
    });
    form.addEventListener('change', e => {
      const el = e.target;
      if (el.name) {
        collectField(el); applyConditions();
        if (el.name === 'company.country') refreshDocRequiredFlags();
        if (el.name === 'banking.currency') {
          // IBAN is mandatory for AED accounts (PRD §10); optional for foreign currencies
          const ib = document.querySelector('#f-iban');
          if (ib) {
            ib.dataset.rules = (el.value === 'AED') ? 'required iban' : 'iban';
            const star = ib.closest('.field').querySelector('label span');
            if (star) star.style.display = (el.value === 'AED') ? '' : 'none';
            validateControl(ib);
          }
        }
        debounceSave();
      }
      if (el.dataset.rules && el.getAttribute('aria-invalid') === 'true') validateControl(el);
    });
    form.addEventListener('blur', e => { if (e.target.dataset.rules && e.target.value) validateControl(e.target); }, true);

    $('#btn-prev').addEventListener('click', () => { if (state.step > 1) gotoStep(state.step - 1); });
    $('#btn-next').addEventListener('click', () => {
      collectAll();
      if (!validateStep(state.step)) { UI.toast('Please fix the highlighted fields to continue.', 'warn'); return; }
      gotoStep(state.step + 1);
    });
    $('#add-signatory').addEventListener('click', () => {
      if (state.data.signatories.length >= 3) { UI.toast('Maximum 3 signatories — contact us for more.', 'warn'); return; }
      state.data.signatories.push(blankSignatory()); renderSignatories();
    });
    $('#add-ubo').addEventListener('click', () => { state.data.ubos.push({}); renderUbos(); });
    $('#add-branch-trn').addEventListener('click', () => { (state.data.tax.branch_trns = state.data.tax.branch_trns || []).push(''); renderBranchTrns(); });
    $('#fill-peppol').addEventListener('click', () => {
      const trn = (state.data.tax.trn || '').trim();
      if (!/^\d{15}$/.test(trn)) { UI.toast('Enter a valid 15-digit TRN first.', 'warn'); return; }
      const tin10 = trn.slice(0, 10);
      $('#f-peppol_id').value = '0235:' + tin10;
      setPath(state.data, 'tax.peppol_id', '0235:' + tin10);
      validateControl($('#f-peppol_id')); debounceSave();
    });
    document.getElementById('btn-exit').addEventListener('click', e => {
      e.preventDefault(); saveDraft(); location.href = 'index.html';
    });
    form.addEventListener('submit', e => {
      e.preventDefault(); collectAll();
      for (let s = 1; s <= 7; s++) {
        state.step = s;
        if (!validateStep(s)) { gotoStep(s, true); UI.toast('Step ' + s + ' needs attention.', 'warn'); return; }
      }
      const missing = $$('#doc-slots [data-doc]').filter(div => {
        const flag = div.querySelector('.req-flag');
        return flag && !flag.hidden && !state.documents.some(d => d.type === div.dataset.doc);
      });
      if (missing.length) { gotoStep(6, true); UI.toast('Please upload the required documents.', 'warn'); return; }
      submitForm();
    });
  }

  /* flush the draft on page hide with a keepalive fetch (survives unload —
     sendBeacon was unreliable in embedded browsers) */
  window.addEventListener('pagehide', function () {
    if (!state.draftId || $('#wizard').hidden) return;
    try {
      collectAll();
      API.saveDraft(state.draftId, state.draftToken, { data: state.data, step: state.step, documents: state.documents }, true)
        .catch(function () { /* best effort on unload */ });
    } catch (e) { /* best effort */ }
  });
  window.addEventListener('beforeunload', function () {
    if (!state.draftId || $('#wizard').hidden) return;
    try {
      collectAll();
      API.saveDraft(state.draftId, state.draftToken, { data: state.data, step: state.step, documents: state.documents }, true)
        .catch(function () { /* best effort */ });
    } catch (e) { /* best effort */ }
  });
})();
