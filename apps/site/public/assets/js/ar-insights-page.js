/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

    document.querySelectorAll('.fchip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fchip').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        const f = btn.getAttribute('data-f');
        const items = document.querySelectorAll('.art-item');
        const featured = document.getElementById('featured');
        if (featured) featured.style.display = (f === 'ALL' || featured.getAttribute('data-cat') === f) ? '' : 'none';
        items.forEach(it => {
          if (f === 'ALL' || it.getAttribute('data-cat') === f) {
            it.style.display = 'flex';
          } else {
            it.style.display = 'none';
          }
        });
      });
    });

    document.getElementById('i-go')?.addEventListener('click', async () => {
      const email = (document.getElementById('i-mail'))?.value.trim();
      const msgEl = document.getElementById('i-msg');
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        if (msgEl) { msgEl.textContent = 'يرجى إدخال بريد إلكتروني صحيح.'; msgEl.style.display = 'block'; }
        return;
      }
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'مشترك النشرة الشهرية (عربي)', email, topic: 'Newsletter Arabic', message: 'طلب اشتراك في النشرة الشهرية من النسخة العربية' })
        });
        if (res.ok) {
          (window).showToast?.('تم الاشتراك في النشرة بنجاح ✓', 'ok');
          (document.getElementById('i-mail')).value = '';
          if (msgEl) { msgEl.textContent = 'تم الاشتراك بنجاح!'; msgEl.style.display = 'block'; }
        }
      } catch {
        (window).showToast?.('خطأ في الاتصال بالشبكة', 'err');
      }
    });
  
})();