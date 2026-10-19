/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

    const tabs = document.querySelectorAll('.leg-tab');
    const panes = document.querySelectorAll('.leg-pane');

    function showTab(slug) {
      tabs.forEach(t => {
        const active = t.getAttribute('data-slug') === slug;
        t.className = `btn btn-sm ${active ? 'btn-p' : 'btn-o'} leg-tab`;
      });
      panes.forEach(p => {
        (p).style.display = p.id === `pane-${slug}` ? 'block' : 'none';
      });
    }

    tabs.forEach(t => {
      t.addEventListener('click', () => {
        const slug = t.getAttribute('data-slug') || 'privacy-policy';
        location.hash = slug;
        showTab(slug);
      });
    });

    const hash = location.hash.replace('#', '');
    if (hash) {
      showTab(hash);
    }
  
})();