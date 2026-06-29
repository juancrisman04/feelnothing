document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('nav').forEach((nav) => {
    const toggle = nav.querySelector('[data-mobile-toggle]');
    const menu = nav.querySelector('[data-mobile-menu]');
    const backdrop = nav.querySelector('[data-mobile-backdrop]');

    if (!toggle || !menu || !backdrop || nav.dataset.mobileMenuReady === 'true') {
      return;
    }

    nav.dataset.mobileMenuReady = 'true';

    menu.querySelectorAll('.mobile-menu-panel__group').forEach((group) => {
      const summary = group.querySelector('.mobile-menu-panel__summary');
      const subnav = group.querySelector('.mobile-menu-panel__subnav');

      if (!summary || !subnav) return;

      const setSubnavHeight = (height) => {
        subnav.style.height = `${height}px`;
      };

      if (group.open) {
        group.classList.add('is-open');
        summary.setAttribute('aria-expanded', 'true');
        subnav.style.height = 'auto';
      } else {
        summary.setAttribute('aria-expanded', 'false');
        setSubnavHeight(0);
      }

      summary.addEventListener('click', (event) => {
        event.preventDefault();

        const isOpen = group.classList.contains('is-open');
        subnav.style.transition = '';

        if (isOpen) {
          setSubnavHeight(subnav.scrollHeight);
          subnav.offsetHeight;
          group.classList.remove('is-open');
          summary.setAttribute('aria-expanded', 'false');
          setSubnavHeight(0);

          const finishClose = (transitionEvent) => {
            if (transitionEvent.propertyName !== 'height') return;
            group.open = false;
            subnav.removeEventListener('transitionend', finishClose);
          };

          subnav.addEventListener('transitionend', finishClose);
          return;
        }

        group.open = true;
        group.classList.add('is-open');
        summary.setAttribute('aria-expanded', 'true');
        setSubnavHeight(0);
        subnav.offsetHeight;
        setSubnavHeight(subnav.scrollHeight);

        const finishOpen = (transitionEvent) => {
          if (transitionEvent.propertyName !== 'height') return;
          subnav.style.height = 'auto';
          subnav.removeEventListener('transitionend', finishOpen);
        };

        subnav.addEventListener('transitionend', finishOpen);
      });
    });

    const openMenu = () => {
      menu.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggle.classList.add('is-open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    };

    const closeMenu = () => {
      menu.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggle.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    };

    toggle.addEventListener('click', () => {
      if (menu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  });
});
