/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

    document.getElementById('arDemoForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = new FormData(form);
      const name = data.get('name');
      const email = data.get('email');
      const phone = data.get('phone');
      const company = data.get('company');

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            topic: 'ERP Demo (Arabic)',
            message: `طلب عرض تجريبي من الموقع العربي. الشركة: ${company} · الهاتف: ${phone}`
          })
        });
        if (res.ok) {
          (window).showToast?.('تم استلام طلب العرض بنجاح. سيتواصل معك مستشار الحلول قريباً ✓', 'ok');
          form.reset();
        } else {
          (window).showToast?.('تعذر إرسال الطلب. يرجى المحاولة أو مراسلتنا مباشرة على info@simalme.com', 'err');
        }
      } catch {
        (window).showToast?.('خطأ في الاتصال بالشبكة', 'err');
      }
    });
  
})();