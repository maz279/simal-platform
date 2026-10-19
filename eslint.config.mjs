export default [
  { ignores: ['tools/', 'scratch/', 'remotes/', 'apps/site/dist*/', 'apps/site/deploy-docroot/', 'apps/portal/data/',
    // unify(2026-10-19): imported workspace corpora — evidence/docs, not lintable source
    'audit/', 'project-doc/', 'primary-doc/', 'implementation/', 'prototype/', 'ux/', 'content/',
    'artifacts-cms-audit/', 'fixture-backups/', 'legacy/', '.agents/'] },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // node
        process: 'readonly', Buffer: 'readonly', require: 'readonly', console: 'readonly',
        setTimeout: 'readonly', setInterval: 'readonly', clearTimeout: 'readonly', clearInterval: 'readonly',
        // browser (portal/site scripts are tag-loaded, no bundler)
        window: 'readonly', document: 'readonly', fetch: 'readonly', location: 'readonly',
        localStorage: 'readonly', sessionStorage: 'readonly', navigator: 'readonly',
        API: 'readonly', UI: 'readonly', requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        confirm: 'readonly', alert: 'readonly', XMLHttpRequest: 'readonly', FormData: 'readonly',
        URLSearchParams: 'readonly', MutationObserver: 'readonly', ResizeObserver: 'readonly',
        customElements: 'readonly', FileReader: 'readonly', AbortSignal: 'readonly', Event: 'readonly',
        Blob: 'readonly', btoa: 'readonly', atob: 'readonly', WebSocket: 'readonly',
        Response: 'readonly', Headers: 'readonly', Request: 'readonly', URL: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'warn',
      'no-fallthrough': 'error',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['test/**/*.js', 'test/**/*.mjs', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        assert: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        before: 'readonly',
        after: 'readonly',
      },
    },
  },
];
