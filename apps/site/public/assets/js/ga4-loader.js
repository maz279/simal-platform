/* ga4-loader.js — rm(8.4-1): consent-gated GA4 loader.
 * External file (same pattern as consent-defaults.js in rm(3.3-1)): a small
 * processed <script> in BaseLayout would be inlined by Astro under
 * assetsInlineLimit and then blocked by script-src 'self'. Deferred classic
 * scripts run in document order, so consent-defaults.js has already set
 * window.__simalConsentGrants when this runs.
 * Loads gtag.js ONLY when analytics consent is granted — either already
 * stored (returning visitor) or granted later via the banner event. */
(function () {
  var id = document.querySelector('meta[name="ga4-id"]')?.getAttribute('content');
  function loadGa4() {
    if (!id || document.getElementById('ga4-src')) return;
    if (window['ga-disable-' + id]) return;
    var s = document.createElement('script');
    s.id = 'ga4-src';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', id);
  }
  if (window.__simalConsentGrants?.analytics_storage === 'granted') loadGa4();
  window.addEventListener('simal:consent-accepted', function (e) {
    if (e.detail?.analytics_storage === 'granted') loadGa4();
  });
})();
