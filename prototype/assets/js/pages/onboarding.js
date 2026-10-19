/* KYC wizard (FRS-K / FRS §21.5): 7 steps, per-step validation, TRN 15-digit +
   Peppol preview, UAE IBAN 23-char MOD-97, autosave, review + submit. */
(function () {
  var STEP_RULES = {
    1: [['company', 'Legal name is required'], ['licence', 'Trade licence number is required'], ['btype', 'Business type is required']],
    2: [['owner', 'Owner name is required'], ['contact', 'Primary contact is required'], ['email', 'Work email is required', 'email'], ['phone', 'Phone is required', 'phone']],
    3: [['addr1', 'Registered address is required'], ['city', 'City is required'], ['country', 'Country is required']],
    4: [], 5: [], 6: [], 7: []
  };
  var step = 1, TOTAL = 7;
  var draft = S.ls('kycDraft', null) || {};
  if (draft._step) step = Math.min(TOTAL, draft._step);

  var $ = function (sel) { return document.querySelector(sel); };

  function renderSteps() {
    document.getElementById('steps').innerHTML = Array.from({ length: TOTAL }, function (_, i) {
      var n = i + 1, cls = 'st';
      if (n < step) cls += ' done';
      if (n === step) cls += ' on';
      return '<span class="' + cls + '"><b>' + (n < step ? '✓' : n) + '</b> ' +
        ['Company', 'Contacts', 'Addresses', 'Tax', 'Banking', 'Documents', 'Review'][i] + '</span>';
    }).join('');
  }

  function collect() {
    document.querySelectorAll('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k');
      draft[k] = el.type === 'checkbox' ? el.checked : el.value;
    });
  }

  function hydrate() {
    document.querySelectorAll('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k');
      if (draft[k] != null) {
        if (el.type === 'checkbox') el.checked = !!draft[k];
        else el.value = draft[k];
      }
    });
    updateTaxHints();
  }

  function updateTaxHints() {
    var trn = draft.trn || '';
    var h = document.querySelector('[data-h="trn"]');
    if (h) h.textContent = trn ? (S.v.trn(trn) ? '✓ 15 digits — valid format' : '✕ TRN must be exactly 15 digits') : '15 digits, no spaces';
    var pp = document.getElementById('peppol-preview');
    if (pp) pp.value = S.v.peppol(trn.replace(/\D/g, ''));
    var ib = draft.iban || '';
    var hi = document.querySelector('[data-h="iban"]');
    if (hi) hi.textContent = ib ? (S.v.iban(ib) ? '✓ Valid UAE IBAN (23 chars, checksum passes)' : '✕ Expected AE + 21 characters with valid MOD-97 checksum') : 'AE + 21 characters';
  }

  function save() {
    collect();
    draft._step = step;
    S.save('kycDraft', draft);
    var a = document.getElementById('autosave');
    a.hidden = false;
    setTimeout(function () { a.hidden = true; }, 1800);
  }

  function validate() {
    var rules = STEP_RULES[step] || [];
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i], v = (draft[r[0]] || '').trim;
      if (!v) return r[1];
      if (r[2] === 'email' && !S.v.email(v)) return 'Enter a valid email';
      if (r[2] === 'phone' && !S.v.phone(v)) return 'Enter a valid phone';
    }
    if (step === 4 && !S.v.trn(draft.trn || '')) return 'TRN must be exactly 15 digits';
    if (step === 5) {
      if (!(draft.bank || '').trim()) return 'Bank name is required';
      if (!S.v.iban(draft.iban || '')) return 'IBAN: AE + 21 characters with valid MOD-97 checksum (try AE07 0331 2345 6789 0123 456)';
    }
    if (step === 6 && !draft.doc_licence) return 'Trade licence document is required';
    return null;
  }

  function showStep() {
    document.querySelectorAll('.wiz').forEach(function (w) { w.hidden = +w.getAttribute('data-step') !== step; });
    document.getElementById('w-prev').hidden = step === 1;
    document.getElementById('w-next').textContent = step === TOTAL ? 'Submit application →' : 'Continue →';
    renderSteps();
    if (step === TOTAL) renderReview();
  }

  function renderReview() {
    var rows = [
      ['Legal name', draft.company], ['Trade licence', draft.licence], ['Business type', draft.btype],
      ['Owner', draft.owner], ['Contact', draft.contact + ' · ' + draft.email + ' · ' + draft.phone],
      ['Address', [draft.addr1, draft.city, draft.country].filter(Boolean).join(', ')],
      ['TRN', draft.trn], ['Peppol ID', S.v.peppol((draft.trn || '').replace(/\D/g, ''))],
      ['IBAN', draft.iban],
      ['Documents', ['doc_licence|Trade licence', 'doc_passport|Passport/ID', 'doc_bank|Bank letter']
        .map(function (x) { var p = x.split('|'); return (draft[p[0]] ? '✓ ' : '○ ') + p[1]; }).join(' · ')]
    ];
    document.getElementById('review').innerHTML = '<table class="tbl">' + rows.map(function (r) {
      return '<tr><td style="width:34%;color:var(--slate);font-weight:600">' + r[0] + '</td><td>' + S.esc(r[1] || '—') + '</td></tr>';
    }).join('') + '</table>';
  }

  document.getElementById('w-prev').addEventListener('click', function () { collect(); step = Math.max(1, step - 1); save(); showStep(); });
  document.getElementById('w-next').addEventListener('click', function () {
    collect();
    var err = validate(), e = document.getElementById('w-err');
    if (err) { e.hidden = false; e.textContent = '⚠ ' + err; S.toast(err, 'err'); return; }
    e.hidden = true;
    if (step < TOTAL) { step++; save(); showStep(); window.scrollTo({ top: 120, behavior: 'smooth' }); return; }
    if (!document.getElementById('w-consent').checked) {
      e.hidden = false; e.textContent = '⚠ Confirmation is required'; S.toast('Confirmation is required', 'err'); return;
    }
    // submit
    var app = {
      ref: 'KYC-' + new Date().getFullYear() + '-' + String(1500 + S.ls('kycCounter', 0) + 1).padStart(4, '0'),
      company: draft.company, email: draft.email, contact: draft.contact,
      trn: draft.trn, peppol: S.v.peppol(draft.trn.replace(/\D/g, '')), iban: draft.iban,
      docs: { licence: !!draft.doc_licence, passport: !!draft.doc_passport, bank: !!draft.doc_bank },
      status: 'In review', at: new Date().toISOString(), sla: 0, flagged: [], notes: '',
      draft: draft
    };
    S.save('kycCounter', S.ls('kycCounter', 0) + 1);
    S.saveApp(app);
    S.save('kycDraft', null);
    S.login(draft.email, draft.contact || draft.company);
    S.toast('Application ' + app.ref + ' submitted — review within 2 business days');
    setTimeout(function () { location.href = 'account.html?submitted=' + app.ref; }, 900);
  });

  document.querySelectorAll('[data-k]').forEach(function (el) {
    el.addEventListener('input', function () { collect(); updateTaxHints(); save(); });
    el.addEventListener('change', function () { collect(); updateTaxHints(); save(); });
  });

  hydrate(); showStep();

  // partner tiers (content package §07)
  var tg = document.getElementById('tier-grid');
  if (tg) tg.innerHTML = CONTENT.partnerTiers.map(function (t, i) {
    return '<div class="card card-p" style="' + (i === 0 ? 'border-top:4px solid var(--blue);' : '') + '">' +
      '<span class="badge ' + (i === 2 ? 'b-gold' : 'b-blue') + '">' + t.t + (i === 2 ? ' — invitation' : '') + '</span>' +
      '<p style="font-size:12.5px;color:var(--slate);margin-top:9px"><b>Requirements:</b> ' + S.esc(t.req) + '</p>' +
      '<p style="font-size:12.5px;color:var(--slate);margin-top:5px"><b>Margins:</b> ' + S.esc(t.margin) + ' · <b>Terms:</b> ' + S.esc(t.terms) + '</p>' +
      '<p style="font-size:12.5px;color:var(--slate);margin-top:5px"><b>Best for:</b> ' + S.esc(t.best) + '</p></div>';
  }).join('');
})();
