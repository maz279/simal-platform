/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

    document.getElementById('arContactForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = new FormData(form);
      const name = data.get('name');
      const email = data.get('email');
      const topic = data.get('topic');
      const message = data.get('message');

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, topic, message })
        });
        if (res.ok) {
          (window).showToast?.('تم إرسال رسالتك بنجاح. سنرد عليك في أقرب وقت ✓', 'ok');
          form.reset();
        } else {
          (window).showToast?.('تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى أو مراسلتنا على info@simalme.com', 'err');
        }
      } catch {
        (window).showToast?.('خطأ في الاتصال بالشبكة', 'err');
      }
    });
  
})();