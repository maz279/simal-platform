/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

    const tabs = document.querySelectorAll('.leg-tab');
    const panes = document.querySelectorAll('.leg-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const slug = tab.getAttribute('data-slug');
        tabs.forEach(t => { t.classList.remove('btn-p'); t.classList.add('btn-o'); });
        tab.classList.remove('btn-o'); tab.classList.add('btn-p');

        panes.forEach(p => {
          (p).style.display = p.id === `pane-${slug}` ? 'block' : 'none';
        });
      });
    });
  
})();