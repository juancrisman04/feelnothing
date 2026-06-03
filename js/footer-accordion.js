(() => {
  const panels = document.querySelectorAll('.brand-footer__panel');
  const closeTimers = new WeakMap();

  const closePanel = (panel) => {
    const trigger = panel.querySelector('.brand-footer__panel-trigger');
    window.clearTimeout(closeTimers.get(panel));
    panel.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');

    const timer = window.setTimeout(() => {
      panel.open = false;
      closeTimers.delete(panel);
    }, 250);

    closeTimers.set(panel, timer);
  };

  panels.forEach((panel) => {
    const trigger = panel.querySelector('.brand-footer__panel-trigger');

    if (!trigger) return;

    panel.classList.add('is-enhanced');
    panel.classList.toggle('is-open', panel.open);
    trigger.setAttribute('aria-expanded', panel.open ? 'true' : 'false');

    trigger.addEventListener('click', (event) => {
      event.preventDefault();

      if (panel.classList.contains('is-open')) {
        closePanel(panel);
        return;
      }

      panels.forEach((otherPanel) => {
        if (otherPanel !== panel && otherPanel.classList.contains('is-open')) {
          closePanel(otherPanel);
        }
      });

      window.clearTimeout(closeTimers.get(panel));
      panel.open = true;
      trigger.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(() => {
        panel.classList.add('is-open');
      });
    });
  });
})();
