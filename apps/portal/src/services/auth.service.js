/* ==========================================================================
 * auth.service.js — login (scrypt) → per-account TOTP (when a secret is stored)
 * → idle-expiring sessions. Admin bootstrap ONLY from environment variables
 * (no credential literals); ADMIN_MFA_REQUIRED=false provisions a password-only admin.
 * ========================================================================== */
import { config } from '../config.js';
import { hashPassword, verifyPassword, verifyTotp } from '../lib/security.js';
import { HttpError } from '../lib/http.js';
import { can } from '../domain/rules.js';

/* rm(10.3-1 pen ENUM-02): verifying only existing users made "known email, wrong
 * password" ~20x slower than "unknown email". A dummy scrypt verify for absent
 * accounts equalises the work. */
const DUMMY_HASH = hashPassword('never-a-real-password-' + Date.now().toString(36));

export function createAuth(repos) {
  /** first-run bootstrap from env; idempotent (async for PG compatibility) */
  async function bootstrap() {
    const b = config.bootstrap;
    /* deploy-audit H1: env credentials CREATE missing staff accounts; they no longer overwrite
     * existing ones on every boot. That reverted any password changed or TOTP enrolled in the
     * console (rm 10.4-1 self-service) at the next restart, and nulled TOTP whenever
     * ADMIN_MFA_REQUIRED=false. Re-applying env credentials is now an explicit, audited
     * break-glass step: start once with BOOTSTRAP_RESET_CREDENTIALS=true, then remove it. */
    const resetFromEnv = String(process.env.BOOTSTRAP_RESET_CREDENTIALS || '').toLowerCase() === 'true';
    if (b.adminEmail && b.adminPassword && (!b.adminMfaRequired || b.adminTotpSecret)) {
      const existing = await repos.users.findByEmail(b.adminEmail);
      if (!existing) {
        await repos.users.create({
          email: b.adminEmail, name: b.adminName || 'Administrator', role: 'super_admin',
          passwordHash: hashPassword(b.adminPassword),
          totpSecret: b.adminMfaRequired ? b.adminTotpSecret : null,
        });
        await repos.audit('system', 'user_bootstrapped', b.adminEmail,
          'super_admin (from environment' + (b.adminMfaRequired ? '' : ', MFA disabled by config') + ')');
      } else if (resetFromEnv) {
        existing.passwordHash = hashPassword(b.adminPassword);
        if (b.adminName) existing.name = b.adminName;
        existing.totpSecret = b.adminMfaRequired ? b.adminTotpSecret : null;
        await repos.users.save(existing);
        await repos.audit('system', 'user_credentials_reset_from_env', b.adminEmail, 'BOOTSTRAP_RESET_CREDENTIALS=true');
      }
    }
    for (const [u, role] of [[b.reviewer, 'reviewer'], [b.viewer, 'viewer']]) {
      if (u && u.email && u.password) {
        const exists = await repos.users.findByEmail(u.email);
        if (!exists) {
          await repos.users.create({
            email: u.email, name: role === 'reviewer' ? 'Review Staff' : 'Read-only Staff', role,
            passwordHash: hashPassword(u.password),
            totpSecret: null,
          });
        } else if (resetFromEnv) {
          exists.passwordHash = hashPassword(u.password);
          await repos.users.save(exists);
          await repos.audit('system', 'user_credentials_reset_from_env', u.email, 'BOOTSTRAP_RESET_CREDENTIALS=true');
        }
      }
    }

    // Purge legacy development seed accounts if present in persistent store
    // rm(3.2 fix / L49): 'admin@simalme.com' is the CANONICAL admin address as of rm(2.4-1) —
    // it must NEVER appear on a purge list, even guarded (the guard intermittently failed on
    // rapid double-restarts and deleted the freshly-bootstrapped admin: LEARNINGS L49, twice).
    const legacyDevEmails = [
      'reviewer@simalme.com',
      'mfa.demo@simalme.com',
      'partner@simalme.com',
    ];
    for (const em of legacyDevEmails) {
      if (em === b.adminEmail?.toLowerCase().trim() ||
          em === b.reviewer?.email?.toLowerCase().trim() ||
          em === b.viewer?.email?.toLowerCase().trim()) {
        continue;
      }
      if (typeof repos.users.remove === 'function') {
        await repos.users.remove(em);
      }
      if (repos.client) {
        await repos.client.query('DELETE FROM users WHERE lower(email) = lower($1)', [em]);
      }
    }

    return true;
  }

  /** step 1: password → mfa challenge (never a session) — async for PG */
  async function login(email, password) {
    const user = await repos.users.findByEmail(email || '');
    if (!user || !user.active) {
      verifyPassword(password || '', DUMMY_HASH); /* burn the same scrypt cost */
      throw new HttpError(401, 'Invalid credentials');
    }
    if (!verifyPassword(password || '', user.passwordHash)) {
      await repos.audit(user.email, 'login_failed', 'auth', 'bad password');
      throw new HttpError(401, 'Invalid credentials');
    }
    if (user.totpSecret) {
      const ch = await repos.mfaChallenges.issue(user.id);
      return { mfaRequired: true, mfaChallengeId: ch.id };
    }
    const session = await repos.sessions.insert(await repos.sessions.create(user.id, config.session));
    await repos.audit(user.email, 'login', 'auth', 'role=' + user.role);
    return { mfaRequired: false, session, user: publicUser(user) };
  }

  /** step 2: TOTP → session — async for PG */
  async function verifyMfa(challengeId, code) {
    const ch = await repos.mfaChallenges.consume(challengeId);
    if (!ch) throw new HttpError(401, 'MFA challenge expired or unknown');
    const user = await repos.users.get(ch.userId);
    if (!user) throw new HttpError(401, 'Unknown user');
    const cleanCode = String(code || '').replace(/\D/g, '');
    if (!verifyTotp(user.totpSecret, cleanCode)) {
      /* rm(10.3-1 pen MFA-02): mfaChallenges.fail() never existed — a wrong code
       * threw a TypeError and surfaced as 500. The challenge is already consumed
       * by this point, so audit the failure and return the controlled 401. */
      await repos.audit(user.email, 'mfa_failed', 'auth', '');
      throw new HttpError(401, 'Invalid MFA code');
    }
    /* rm(10.3-1 pen MFA-06): RFC 6238 §5.2 — a TOTP value may be used once. The
     * accepted step is persisted so a code that just completed one challenge
     * cannot open another within the same 30 s window (or later). */
    const step = Math.floor(Date.now() / 30000);
    /* One-time-code enforcement defaults ON (production/dev); the automated
     * suites log in repeatedly inside one 30 s step, so the test licence disables
     * it unless MFA_TOTP_ONE_TIME=1 is set explicitly (the pen retest does). */
    const oneTime = process.env.MFA_TOTP_ONE_TIME === '1' ||
      (process.env.MFA_TOTP_ONE_TIME !== 'false' && process.env.NODE_KYC_TEST !== '1');
    if (oneTime && user.lastTotpStep != null && Number(user.lastTotpStep) >= step) {
      await repos.audit(user.email, 'mfa_replay_rejected', 'auth', 'step=' + step);
      throw new HttpError(401, 'MFA code already used — wait for the next code');
    }
    user.lastTotpStep = step;
    await repos.users.save(user);
    const session = await repos.sessions.insert(await repos.sessions.create(user.id, config.session));
    await repos.audit(user.email, 'login', 'auth', 'role=' + user.role + ' +mfa');
    return { session, user: publicUser(user) };
  }

  async function sessionFromCookie(req) {
    const raw = req.headers.cookie || '';
    const m = /(?:^|;\s*)(?:__Host-)?kyc_sid=([a-f0-9]{64})/.exec(raw);
    if (!m) return null;
    const s = await repos.sessions.find(m[1]);
    const live = s ? await repos.sessions.isLive(s) : false;
    if (!s || !live) {
      if (s) await repos.sessions.destroy(s.sid);
      return null;
    }
    await repos.sessions.touch(s);
    return s;
  }

  async function userForSession(session) {
    if (!session) return null;
    return repos.users.get(session.userId);
  }

  async function logout(session) {
    if (session) {
      const u = await userForSession(session);
      await repos.sessions.destroy(session.sid);
      if (u) await repos.audit(u.email, 'logout', 'auth', '');
    }
  }

  async function register({ email, name, password }) {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim())) {
      throw new HttpError(422, 'Valid email address is required');
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name || '').trim();
    if (cleanName.length < 2) {
      throw new HttpError(422, 'Name must be at least 2 characters');
    }
    const pass = String(password || '');
    if (pass.length < 8) {
      throw new HttpError(422, 'Password must be at least 8 characters');
    }

    const existing = await repos.users.findByEmail(cleanEmail);
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const created = await repos.users.create({
      email: cleanEmail,
      name: cleanName,
      role: 'partner',
      passwordHash: hashPassword(pass),
      totpSecret: null,
      active: true,
    });

    const session = await repos.sessions.insert(await repos.sessions.create(created.id, config.session));
    await repos.audit(cleanEmail, 'user_registered', 'auth', 'self_registered_partner');
    return { session, user: publicUser(created) };
  }

  function publicUser(u) {
    /* rm(10.4-1/PEN-2026-05): the console needs to know whether THIS account has
     * enrolled MFA (boolean only — never the secret). */
    return { id: u.id, email: u.email, name: u.name, role: u.role, hasTotp: Boolean(u.totpSecret) };
  }

  /** rm(10.3-1 pen MFA-08)/GOV a16: every active ADMINISTRATIVE account must have
   *  a TOTP secret before a production boot. Partners are excluded (password-only
   *  is explicitly allowed for external commercial accounts). Returns the list of
   *  staff accounts still missing MFA. */
  async function staffMissingMfa() {
    const users = await repos.users.all();
    return users
      .filter((u) => u.active && ['super_admin', 'reviewer', 'viewer'].includes(u.role) && !u.totpSecret)
      .map((u) => ({ id: u.id, email: u.email, role: u.role }));
  }

  return { bootstrap, login, verifyMfa, register, sessionFromCookie, userForSession, logout, publicUser, staffMissingMfa };
}

/* ---------- middleware ---------- */
export function requireAuth(auth) {
  return async (req, _res, next) => {
    const session = await auth.sessionFromCookie(req);
    if (!session) throw new HttpError(401, 'Authentication required');
    const user = await auth.userForSession(session);
    if (!user || !user.active) throw new HttpError(401, 'Account disabled');
    const pubUser = auth.publicUser(user);
    session.user = pubUser;
    req.session = {
      sid: session.sid,
      role: user.role,
      userId: user.id,
      email: pubUser.email,
      name: pubUser.name,
      user: pubUser
    };
    req.user = pubUser;
    next();
  };
}
export function requirePerm(perm) {
  return (req, _res, next) => {
    if (!can({ role: req.session?.role }, perm)) throw new HttpError(403, 'Insufficient permissions for this action');
    next();
  };
}
/* deploy-audit: the production boot refuses staff accounts without TOTP (MFA-08), but an
 * account created, promoted or with MFA disabled AFTER boot could still use every staff route
 * password-only. The same rule now holds per request; STAFF_MFA_ENFORCED=false is the same
 * deliberate opt-out the boot check honours. */
export function staffMfaEnforced() {
  return config.env === 'production' && process.env.STAFF_MFA_ENFORCED !== 'false';
}
export function requireStaff() {
  const STAFF_ROLES = new Set(['super_admin', 'reviewer', 'viewer']);
  return (req, _res, next) => {
    if (!req.session?.role || !STAFF_ROLES.has(req.session.role)) {
      throw new HttpError(403, 'Staff access required');
    }
    if (staffMfaEnforced() && !req.session.user?.hasTotp) {
      throw new HttpError(403, 'Two-factor authentication is required for staff accounts — enrol it in the admin console (/admin.html) first');
    }
    next();
  };
}
