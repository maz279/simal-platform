/* ==========================================================================
 * async-wrapper.js — wraps JSON repos to return Promises uniformly.
 * This makes the service layer async-compatible with both JSON and PG stores.
 * Usage: const repos = process.env.DATABASE_URL ? createPgRepos(url) : makeAsync(createRepos(store));
 * ========================================================================== */

function makeAsyncValue(v) {
  return Promise.resolve(v);
}

/**
 * Wraps every method on the repos object to return a Promise,
 * enabling uniform `await` across JSON and PG backends.
 */
export function makeAsync(repos) {
  const wrapped = {};

  for (const key of Object.keys(repos)) {
    const val = repos[key];

    if (typeof val === 'function') {
      // Top-level functions (settings, nextRef, saveSettings, nextInvRef, persist, audit)
      wrapped[key] = function (...args) {
        return makeAsyncValue(val.apply(repos, args));
      };
    } else if (val && typeof val === 'object') {
      // Nested repo objects (users, sessions, submissions, invoices, outbox, etc.)
      wrapped[key] = {};
      for (const method of Object.keys(val)) {
        if (typeof val[method] === 'function') {
          wrapped[key][method] = function (...args) {
            return makeAsyncValue(val[method].apply(val, args));
          };
        } else {
          wrapped[key][method] = val[method];
        }
      }
    } else {
      wrapped[key] = val;
    }
  }

  return wrapped;
}
