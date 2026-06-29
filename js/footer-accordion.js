(() => {
  const panels = document.querySelectorAll('.brand-footer__panel');
  const closeTimers = new WeakMap();
  const closeDuration = 320;
  const panelHeightBuffer = 28;

  const setPanelHeight = (panel) => {
    const content = panel.querySelector('.brand-footer__panel-content');
    if (!content) return;

    panel.style.setProperty('--brand-footer-panel-height', `${content.scrollHeight + panelHeightBuffer}px`);
  };

  const closePanel = (panel) => {
    const trigger = panel.querySelector('.brand-footer__panel-trigger');
    window.clearTimeout(closeTimers.get(panel));
    setPanelHeight(panel);
    panel.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');

    const timer = window.setTimeout(() => {
      panel.open = false;
      closeTimers.delete(panel);
    }, closeDuration);

    closeTimers.set(panel, timer);
  };

  panels.forEach((panel) => {
    const trigger = panel.querySelector('.brand-footer__panel-trigger');

    if (!trigger) return;

    panel.classList.add('is-enhanced');
    setPanelHeight(panel);
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
      setPanelHeight(panel);
      trigger.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(() => {
        panel.classList.add('is-open');
      });
    });
  });

  window.addEventListener('resize', () => {
    panels.forEach((panel) => {
      if (panel.open || panel.classList.contains('is-open')) setPanelHeight(panel);
    });
  });
})();
