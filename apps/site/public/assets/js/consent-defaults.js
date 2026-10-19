/* consent-defaults.js — rm(3.3): Google Consent Mode v2 defaults (UAE PDPL strictly opt-in).
 * Externalized from the BaseLayout inline block so the CSP can drop 'unsafe-inline'
 * from script-src. Must load BEFORE any analytics/consent island (order by script tag). */
(function () {
  var dataLayer = window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });
  /* rm(8.4-1): expose the stored grants synchronously so the GA4 loader can
   * decide at parse time — returning visitors would otherwise never load GA4,
   * because the consent island (a deferred module) runs after the check. */
  window.__simalConsentGrants = {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  };
  try {
    var match = document.cookie.match(/(?:^|; )simal_consent=([^;]*)/);
    if (match) {
      var consent = JSON.parse(decodeURIComponent(match[1]));
      if (consent && consent.categories) {
        var grants = {
          'analytics_storage': consent.categories.analytics ? 'granted' : 'denied',
          'ad_storage': consent.categories.marketing ? 'granted' : 'denied',
          'ad_user_data': consent.categories.marketing ? 'granted' : 'denied',
          'ad_personalization': consent.categories.marketing ? 'granted' : 'denied'
        };
        window.__simalConsentGrants = grants;
        gtag('consent', 'update', grants);
      }
    }
  } catch (e) { /* corrupt cookie — defaults stand */ }
})();
