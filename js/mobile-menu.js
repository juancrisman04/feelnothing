document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('nav').forEach((nav) => {
    const toggle = nav.querySelector('[data-mobile-toggle]');
    const menu = nav.querySelector('[data-mobile-menu]');
    const backdrop = nav.querySelector('[data-mobile-backdrop]');

    if (!toggle || !menu || !backdrop || nav.dataset.mobileMenuReady === 'true') {
      return;
    }

    nav.dataset.mobileMenuReady = 'true';

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
