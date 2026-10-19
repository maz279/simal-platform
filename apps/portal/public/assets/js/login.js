/* ==========================================================================
   login.js — Executive B2B Authentication Controller
   Features:
   - Step 1 Credentials validation & submission
   - Show / Hide password toggle
   - Step 2 Segmented 6-digit OTP MFA verification
   - Auto-advance, backspace auto-retreat, clipboard paste handling, auto-submit
   - Step 3 Forgot password recovery request
   - Step 4 Tokenized password reset confirmation (?reset=TOKEN)
   - Silent session status detection via /api/auth/session (zero 401 console noise)
   - Role-based routing: partner -> invoices.html, staff -> admin.html
   ========================================================================== */

(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.from(document.querySelectorAll(sel)); };

  // DOM Elements - Credentials
  var stepCredentials = $('#step-credentials');
  var formCredentials = $('#form-credentials');
  var emInput = $('#em');
  var pwInput = $('#pw');
  var goBtn = $('#go');
  var btnText = $('#btn-text');
  var btnArrow = $('#btn-arrow');
  var btnSpinner = $('#btn-spinner');
  var authAlert = $('#auth-alert');
  var authAlertText = $('#auth-alert-text');
  var btnShowForgot = $('#btn-show-forgot');

  var togglePwBtn = $('#toggle-pw');
  var pwIconShow = $('#pw-icon-show');
  var pwIconHide = $('#pw-icon-hide');

  // DOM Elements - Dev Toolbar
  var devToolbar = $('#auth-dev-toolbar');

  // DOM Elements - MFA
  var stepMfa = $('#step-mfa');
  var formMfa = $('#form-mfa');
  var mfaBackBtn = $('#mfa-back');
  var mfaGoBtn = $('#mfa-go');
  var mfaBtnText = $('#mfa-btn-text');
  var mfaBtnArrow = $('#mfa-btn-arrow');
  var mfaBtnSpinner = $('#mfa-btn-spinner');
  var mfaAlert = $('#mfa-alert');
  var mfaAlertText = $('#mfa-alert-text');
  var mfaUserEmail = $('#mfa-user-email');
  var btnQuickToken = $('#btn-quick-token');
  var otpBoxes = [$('#otp-1'), $('#otp-2'), $('#otp-3'), $('#otp-4'), $('#otp-5'), $('#otp-6')];
  var otpContainer = $('#otp-container');

  // DOM Elements - Password Reset Request
  var stepResetRequest = $('#step-reset-request');
  var formResetRequest = $('#form-reset-request');
  var resetEmailInput = $('#reset-email');
  var resetBackBtn = $('#reset-back');
  var btnResetSubmit = $('#btn-reset-submit');
  var resetBtnText = $('#reset-btn-text');
  var resetBtnSpinner = $('#reset-btn-spinner');
  var resetAlert = $('#reset-alert');
  var resetAlertText = $('#reset-alert-text');
  var resetSuccess = $('#reset-success');
  var resetSuccessText = $('#reset-success-text');

  // DOM Elements - Password Reset Confirm
  var stepResetConfirm = $('#step-reset-confirm');
  var formResetConfirm = $('#form-reset-confirm');
  var resetNewPw = $('#reset-new-pw');
  var resetConfirmPw = $('#reset-confirm-pw');
  var btnConfirmSubmit = $('#btn-confirm-submit');
  var confirmBtnText = $('#confirm-btn-text');
  var confirmBtnSpinner = $('#confirm-btn-spinner');
  var resetConfirmAlert = $('#reset-confirm-alert');
  var resetConfirmAlertText = $('#reset-confirm-alert-text');
  var resetConfirmSuccess = $('#reset-confirm-success');
  var resetConfirmSuccessText = $('#reset-confirm-success-text');

  // State
  var currentChallengeId = null;
  var currentEmail = '';
  var currentResetToken = null;

  // =========================================================================
  // Environment & Toolbar Visibility
  // =========================================================================
  function initEnvironment() {
    var host = window.location.hostname || '';
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
    var hasDevParam = /[?&]dev=1\b/i.test(window.location.search);

    if (devToolbar) {
      if (isLocal || hasDevParam) {
        devToolbar.hidden = false;
      } else {
        devToolbar.hidden = true;
      }
    }
  }

  // Developer Fast-Fill Toolbar
  $$('.auth-dev-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-email');
      var pw = btn.getAttribute('data-pw');
      if (email && pw) {
        emInput.value = email;
        pwInput.value = pw;
        hideAuthError();
        $$('.auth-dev-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showStep('credentials');
        pwInput.focus();
      }
    });
  });

  // =========================================================================
  // Step Navigation
  // =========================================================================
  function showStep(stepName) {
    hideAuthError();
    hideMfaError();
    hideResetAlert();
    hideResetSuccess();
    hideResetConfirmAlert();
    hideResetConfirmSuccess();

    if (stepCredentials) stepCredentials.classList.add('hidden');
    if (stepMfa) stepMfa.classList.remove('active');
    if (stepResetRequest) stepResetRequest.style.display = 'none';
    if (stepResetConfirm) stepResetConfirm.style.display = 'none';

    if (stepName === 'credentials') {
      if (stepCredentials) stepCredentials.classList.remove('hidden');
    } else if (stepName === 'mfa') {
      if (stepMfa) stepMfa.classList.add('active');
    } else if (stepName === 'reset-request') {
      if (stepResetRequest) stepResetRequest.style.display = 'block';
    } else if (stepName === 'reset-confirm') {
      if (stepResetConfirm) stepResetConfirm.style.display = 'block';
    }
  }

  // =========================================================================
  // Alert Helpers
  // =========================================================================
  function showAuthError(msg) {
    if (!authAlert) return;
    authAlertText.textContent = msg;
    authAlert.hidden = false;
  }
  function hideAuthError() {
    if (authAlert) authAlert.hidden = true;
  }

  function showMfaError(msg) {
    if (!mfaAlert) return;
    mfaAlertText.textContent = msg;
    mfaAlert.hidden = false;
  }
  function hideMfaError() {
    if (mfaAlert) mfaAlert.hidden = true;
  }

  function showResetAlert(msg) {
    if (!resetAlert) return;
    resetAlertText.textContent = msg;
    resetAlert.hidden = false;
  }
  function hideResetAlert() {
    if (resetAlert) resetAlert.hidden = true;
  }

  function showResetSuccess(msg) {
    if (!resetSuccess) return;
    resetSuccessText.textContent = msg;
    resetSuccess.hidden = false;
  }
  function hideResetSuccess() {
    if (resetSuccess) resetSuccess.hidden = true;
  }

  function showResetConfirmAlert(msg) {
    if (!resetConfirmAlert) return;
    resetConfirmAlertText.textContent = msg;
    resetConfirmAlert.hidden = false;
  }
  function hideResetConfirmAlert() {
    if (resetConfirmAlert) resetConfirmAlert.hidden = true;
  }

  function showResetConfirmSuccess(msg) {
    if (!resetConfirmSuccess) return;
    resetConfirmSuccessText.textContent = msg;
    resetConfirmSuccess.hidden = false;
  }
  function hideResetConfirmSuccess() {
    if (resetConfirmSuccess) resetConfirmSuccess.hidden = true;
  }

  // =========================================================================
  // Loading State Helpers
  // =========================================================================
  function setAuthLoading(loading) {
    if (goBtn) goBtn.disabled = loading;
    if (btnSpinner) btnSpinner.style.display = loading ? 'inline-block' : 'none';
    if (btnArrow) btnArrow.style.display = loading ? 'none' : 'inline-block';
    if (btnText) btnText.textContent = loading ? 'Authenticating...' : 'Sign In';
  }

  function setMfaLoading(loading) {
    if (mfaGoBtn) mfaGoBtn.disabled = loading;
    if (mfaBtnSpinner) mfaBtnSpinner.style.display = loading ? 'inline-block' : 'none';
    if (mfaBtnArrow) mfaBtnArrow.style.display = loading ? 'none' : 'inline-block';
    if (mfaBtnText) mfaBtnText.textContent = loading ? 'Verifying...' : 'Verify & Continue';
  }

  function setResetLoading(loading) {
    if (btnResetSubmit) btnResetSubmit.disabled = loading;
    if (resetBtnSpinner) resetBtnSpinner.style.display = loading ? 'inline-block' : 'none';
    if (resetBtnText) resetBtnText.textContent = loading ? 'Sending Link...' : 'Send Recovery Link';
  }

  function setConfirmLoading(loading) {
    if (btnConfirmSubmit) btnConfirmSubmit.disabled = loading;
    if (confirmBtnSpinner) confirmBtnSpinner.style.display = loading ? 'inline-block' : 'none';
    if (confirmBtnText) confirmBtnText.textContent = loading ? 'Updating...' : 'Save New Password & Sign In';
  }

  // =========================================================================
  // Password Visibility Toggle
  // =========================================================================
  if (togglePwBtn && pwInput) {
    togglePwBtn.addEventListener('click', function () {
      var isPw = pwInput.type === 'password';
      pwInput.type = isPw ? 'text' : 'password';
      if (pwIconShow) pwIconShow.style.display = isPw ? 'none' : 'block';
      if (pwIconHide) pwIconHide.style.display = isPw ? 'block' : 'none';
      togglePwBtn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
      pwInput.focus();
    });
  }

  // =========================================================================
  // Step 1: Sign In & Credentials
  // =========================================================================
  function signIn() {
    hideAuthError();
    var email = emInput ? emInput.value.trim() : '';
    var password = pwInput ? pwInput.value : '';

    if (!email) {
      if (emInput) emInput.focus();
      return showAuthError('Please enter your corporate email address.');
    }
    if (!password) {
      if (pwInput) pwInput.focus();
      return showAuthError('Please enter your account password.');
    }

    setAuthLoading(true);

    API.login(email, password)
      .then(function (r) {
        setAuthLoading(false);
        if (r && r.mfaRequired) {
          switchToMfa(email, r.mfaChallengeId);
          return;
        }
        return completeLogin();
      })
      .catch(function (e) {
        setAuthLoading(false);
        var msg = 'Invalid email or password. Please verify and try again.';
        if (e.status === 429) {
          msg = 'Too many attempts — please wait a few seconds and try again.';
        } else if (e.status === 400 && e.message) {
          msg = e.message;
        }
        showAuthError(msg);
      });
  }

  if (formCredentials) {
    formCredentials.addEventListener('submit', function (ev) {
      ev.preventDefault();
      signIn();
    });
  } else if (goBtn) {
    goBtn.addEventListener('click', signIn);
  }

  // =========================================================================
  // Self-Registration Controller (GAP-A1 / FRS A-01/08)
  // =========================================================================
  var tabSignIn = $('#tab-signin');
  var tabRegister = $('#tab-register');
  var formRegister = $('#form-register');
  var regName = $('#reg-name');
  var regEm = $('#reg-em');
  var regPw = $('#reg-pw');
  var regPwConfirm = $('#reg-pw-confirm');
  var regGo = $('#reg-go');
  var regBtnText = $('#reg-btn-text');
  var regBtnSpinner = $('#reg-btn-spinner');
  var regBtnArrow = $('#reg-btn-arrow');

  if (tabSignIn && tabRegister) {
    tabSignIn.addEventListener('click', function () {
      tabSignIn.classList.add('on');
      tabSignIn.style.background = '#fff';
      tabSignIn.style.color = '#0F172A';
      tabSignIn.setAttribute('aria-selected', 'true');
      tabRegister.classList.remove('on');
      tabRegister.style.background = 'transparent';
      tabRegister.style.color = '#64748B';
      tabRegister.setAttribute('aria-selected', 'false');
      if (formCredentials) formCredentials.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
      var t = $('.auth-title'), st = $('.auth-subtitle');
      if (t) t.textContent = 'Sign in to Simal';
      if (st) st.textContent = 'Enter your corporate credentials to access your secure workspace.';
      hideAuthError();
    });

    tabRegister.addEventListener('click', function () {
      tabRegister.classList.add('on');
      tabRegister.style.background = '#fff';
      tabRegister.style.color = '#0F172A';
      tabRegister.setAttribute('aria-selected', 'true');
      tabSignIn.classList.remove('on');
      tabSignIn.style.background = 'transparent';
      tabSignIn.style.color = '#64748B';
      tabSignIn.setAttribute('aria-selected', 'false');
      if (formCredentials) formCredentials.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
      var t = $('.auth-title'), st = $('.auth-subtitle');
      if (t) t.textContent = 'Register Partner Account';
      if (st) st.textContent = 'Create your account to issue UAE FTA PINT compliant e-invoices and access Simal services.';
      hideAuthError();
    });
  }

  function setRegLoading(loading) {
    if (regGo) regGo.disabled = loading;
    if (regBtnSpinner) regBtnSpinner.style.display = loading ? 'inline-block' : 'none';
    if (regBtnArrow) regBtnArrow.style.display = loading ? 'none' : 'inline-block';
    if (regBtnText) regBtnText.textContent = loading ? 'Creating Account...' : 'Create Partner Account';
  }

  function registerAccount() {
    hideAuthError();
    var name = regName ? regName.value.trim() : '';
    var email = regEm ? regEm.value.trim() : '';
    var password = regPw ? regPw.value : '';
    var passwordConfirm = regPwConfirm ? regPwConfirm.value : '';

    if (!name || name.length < 2) {
      if (regName) regName.focus();
      return showAuthError('Please enter your full name (at least 2 characters).');
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      if (regEm) regEm.focus();
      return showAuthError('Please enter a valid work email address.');
    }
    if (!password || password.length < 8) {
      if (regPw) regPw.focus();
      return showAuthError('Password must be at least 8 characters long.');
    }
    if (password !== passwordConfirm) {
      if (regPwConfirm) regPwConfirm.focus();
      return showAuthError('Passwords do not match. Please verify.');
    }

    setRegLoading(true);

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name: name, email: email, password: password })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        return data;
      });
    }).then(function () {
      setRegLoading(false);
      return completeLogin();
    }).catch(function (err) {
      setRegLoading(false);
      showAuthError(err.message || 'Registration failed');
    });
  }

  if (formRegister) {
    formRegister.addEventListener('submit', function (ev) {
      ev.preventDefault();
      registerAccount();
    });
  }

  // =========================================================================
  // Step 2: MFA Controller
  // =========================================================================
  function switchToMfa(email, challengeId) {
    currentChallengeId = challengeId;
    currentEmail = email;
    if (mfaUserEmail) mfaUserEmail.textContent = email;
    showStep('mfa');
    clearOtp();
    setTimeout(function () {
      if (otpBoxes[0]) otpBoxes[0].focus();
    }, 50);
  }

  if (mfaBackBtn) {
    mfaBackBtn.addEventListener('click', function () {
      currentChallengeId = null;
      showStep('credentials');
      if (pwInput) pwInput.focus();
    });
  }

  function getOtpValue() {
    return otpBoxes.map(function (b) { return b ? b.value.trim() : ''; }).join('');
  }

  function clearOtp() {
    otpBoxes.forEach(function (b) {
      if (b) {
        b.value = '';
        b.classList.remove('filled');
      }
    });
  }

  function fillOtp(codeStr) {
    var digits = String(codeStr).replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach(function (d, i) {
      if (otpBoxes[i]) {
        otpBoxes[i].value = d;
        otpBoxes[i].classList.add('filled');
      }
    });
    if (digits.length === 6) {
      verifyMfa();
    } else if (otpBoxes[digits.length]) {
      otpBoxes[digits.length].focus();
    }
  }

  otpBoxes.forEach(function (box, idx) {
    if (!box) return;

    box.addEventListener('input', function (ev) {
      var val = ev.target.value.replace(/\D/g, '');
      if (val.length > 1) {
        fillOtp(val);
        return;
      }
      box.value = val;
      if (val) {
        box.classList.add('filled');
        if (idx < 5 && otpBoxes[idx + 1]) {
          otpBoxes[idx + 1].focus();
        } else if (idx === 5) {
          if (getOtpValue().length === 6) {
            verifyMfa();
          }
        }
      } else {
        box.classList.remove('filled');
      }
    });

    box.addEventListener('keydown', function (ev) {
      if (ev.key === 'Backspace') {
        if (!box.value && idx > 0 && otpBoxes[idx - 1]) {
          otpBoxes[idx - 1].focus();
          otpBoxes[idx - 1].value = '';
          otpBoxes[idx - 1].classList.remove('filled');
          ev.preventDefault();
        } else {
          box.classList.remove('filled');
        }
      } else if (ev.key === 'ArrowLeft' && idx > 0 && otpBoxes[idx - 1]) {
        otpBoxes[idx - 1].focus();
      } else if (ev.key === 'ArrowRight' && idx < 5 && otpBoxes[idx + 1]) {
        otpBoxes[idx + 1].focus();
      } else if (ev.key === 'Enter') {
        verifyMfa();
      }
    });

    box.addEventListener('focus', function () {
      box.select();
    });
  });

  if (otpContainer) {
    otpContainer.addEventListener('paste', function (ev) {
      var pasted = (ev.clipboardData || window.clipboardData).getData('text');
      if (pasted) {
        ev.preventDefault();
        fillOtp(pasted);
      }
    });
  }

  function verifyMfa() {
    hideMfaError();
    var code = getOtpValue();
    if (code.length < 6) {
      return showMfaError('Please enter all 6 digits of the verification code.');
    }
    if (!currentChallengeId) {
      showStep('credentials');
      return showAuthError('Authentication challenge expired. Please sign in again.');
    }

    setMfaLoading(true);

    API.verifyMfa(currentChallengeId, code)
      .then(function () {
        setMfaLoading(false);
        return completeLogin();
      })
      .catch(function (e) {
        setMfaLoading(false);
        var msg = 'Invalid verification code. Please check your authenticator app and try again.';
        if (e.status === 429) {
          msg = 'Too many attempts — please wait a moment before retrying.';
        }
        showMfaError(msg);
        clearOtp();
        if (otpBoxes[0]) otpBoxes[0].focus();
      });
  }

  if (formMfa) {
    formMfa.addEventListener('submit', function (ev) {
      ev.preventDefault();
      verifyMfa();
    });
  } else if (mfaGoBtn) {
    mfaGoBtn.addEventListener('click', verifyMfa);
  }

  // =========================================================================
  // Step 3: Password Reset Request
  // =========================================================================
  if (btnShowForgot) {
    btnShowForgot.addEventListener('click', function () {
      showStep('reset-request');
      if (resetEmailInput) {
        resetEmailInput.value = emInput ? emInput.value.trim() : '';
        resetEmailInput.focus();
      }
    });
  }

  if (resetBackBtn) {
    resetBackBtn.addEventListener('click', function () {
      showStep('credentials');
      if (pwInput) pwInput.focus();
    });
  }

  function handleResetRequest() {
    hideResetAlert();
    hideResetSuccess();

    var email = resetEmailInput ? resetEmailInput.value.trim() : '';
    if (!email) {
      if (resetEmailInput) resetEmailInput.focus();
      return showResetAlert('Please enter your registered work email.');
    }

    setResetLoading(true);

    API.passwordResetRequest(email)
      .then(function (r) {
        setResetLoading(false);
        showResetSuccess((r && r.message) || 'If an account matches, a recovery link has been dispatched to your email.');
      })
      .catch(function (err) {
        setResetLoading(false);
        var msg = 'Unable to dispatch recovery link. Please try again.';
        if (err && err.message) msg = err.message;
        showResetAlert(msg);
      });
  }

  if (formResetRequest) {
    formResetRequest.addEventListener('submit', function (ev) {
      ev.preventDefault();
      handleResetRequest();
    });
  }

  // =========================================================================
  // Step 4: Password Reset Confirm (?reset=TOKEN)
  // =========================================================================
  function handleResetConfirm() {
    hideResetConfirmAlert();
    hideResetConfirmSuccess();

    var newPw = resetNewPw ? resetNewPw.value : '';
    var confirmPw = resetConfirmPw ? resetConfirmPw.value : '';

    if (!newPw || newPw.length < 8) {
      if (resetNewPw) resetNewPw.focus();
      return showResetConfirmAlert('Password must be at least 8 characters long.');
    }
    if (newPw !== confirmPw) {
      if (resetConfirmPw) resetConfirmPw.focus();
      return showResetConfirmAlert('Passwords do not match. Please verify.');
    }
    if (!currentResetToken) {
      return showResetConfirmAlert('Reset token is missing or invalid. Please request a new recovery link.');
    }

    setConfirmLoading(true);

    API.passwordResetConfirm(currentResetToken, newPw)
      .then(function () {
        setConfirmLoading(false);
        showResetConfirmSuccess('Password updated successfully! Redirecting to sign in...');
        setTimeout(function () {
          showStep('credentials');
          if (pwInput) pwInput.focus();
        }, 1800);
      })
      .catch(function (err) {
        setConfirmLoading(false);
        var msg = 'Failed to reset password. The link may have expired or is invalid.';
        if (err && err.message) msg = err.message;
        showResetConfirmAlert(msg);
      });
  }

  if (formResetConfirm) {
    formResetConfirm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      handleResetConfirm();
    });
  }

  // =========================================================================
  // Complete Login & Role Routing
  // =========================================================================
  function completeLogin() {
    return API.me().then(function (me) {
      if (!me || !me.user) {
        location.href = 'admin.html';
        return;
      }
      if (me.user.role === 'partner') {
        location.href = 'invoices.html';
      } else {
        location.href = 'admin.html';
      }
    });
  }

  // =========================================================================
  // Initialization & URL Inspection
  // =========================================================================
  initEnvironment();

  // Inspect query params for reset token or prefilled email
  var searchParams = new URLSearchParams(window.location.search);
  var tokenParam = searchParams.get('reset') || searchParams.get('token');
  var emailParam = searchParams.get('email');

  if (emailParam) {
    if (emInput) emInput.value = emailParam;
    if (resetEmailInput) resetEmailInput.value = emailParam;
  }

  if (tokenParam) {
    currentResetToken = tokenParam;
    showStep('reset-confirm');
    if (resetNewPw) resetNewPw.focus();
  } else {
    // Check if session is already active via silent /api/auth/session check
    if (typeof API !== 'undefined' && API.session) {
      API.session().then(function (res) {
        if (res && res.authenticated && res.user) {
          location.href = (res.user.role === 'partner') ? 'invoices.html' : 'admin.html';
        }
      }).catch(function () {
        // Silently remain on sign-in screen
      });
    }
  }

})();
