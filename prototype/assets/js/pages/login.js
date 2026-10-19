/* Login: mock auth — any valid email + password ≥8 chars signs in;
   demo shortcuts: reviewer@simalme.com → admin panel hint */
(function () {
  var tabIn = document.getElementById('tab-in'), tabUp = document.getElementById('tab-up');
  tabIn.addEventListener('click', function () { tabIn.classList.add('on'); tabUp.classList.remove('on'); document.getElementById('pane-in').hidden = false; document.getElementById('pane-up').hidden = true; });
  tabUp.addEventListener('click', function () { tabUp.classList.add('on'); tabIn.classList.remove('on'); document.getElementById('pane-up').hidden = false; document.getElementById('pane-in').hidden = true; });

  var err = function (id, msg) { var e = document.getElementById(id); e.hidden = false; e.textContent = '⚠ ' + msg; };

  document.getElementById('in-go').addEventListener('click', function () {
    var em = document.getElementById('in-email').value.trim();
    var pw = document.getElementById('in-pass').value;
    var e = document.getElementById('in-err'); e.hidden = true;
    if (!S.v.email(em)) return err('in-err', 'Enter a valid email.');
    if (!S.v.pwd(pw)) return err('in-err', 'Password must be at least 8 characters (prototype: any 8+ works).');
    S.login(em);
    S.toast('Signed in as ' + em);
    setTimeout(function () { location.href = em.indexOf('reviewer') > -1 || em.indexOf('admin') > -1 ? 'admin-queue.html' : 'account.html'; }, 600);
  });
  document.getElementById('in-pass').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') document.getElementById('in-go').click(); });

  document.getElementById('in-link').addEventListener('click', function (ev) {
    ev.preventDefault();
    var em = document.getElementById('in-email').value.trim();
    if (!S.v.email(em)) return err('in-err', 'Enter your email first, then request the link.');
    S.toast('One-time link sent to ' + em + ' (valid 60 min)');
  });
  document.getElementById('forgot').addEventListener('click', function (ev) {
    ev.preventDefault();
    var em = document.getElementById('in-email').value.trim();
    if (!S.v.email(em)) return err('in-err', 'Enter your email first.');
    S.toast('Reset link sent to ' + em);
  });

  document.getElementById('up-go').addEventListener('click', function () {
    var em = document.getElementById('up-email').value.trim();
    var e = document.getElementById('up-err'); e.hidden = true;
    if (!S.v.email(em)) return err('up-err', 'Enter a valid work email.');
    S.login(em);
    location.href = 'onboarding.html';
  });
})();
