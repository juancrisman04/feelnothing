document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-product-gallery]');

  galleries.forEach((gallery) => {
    const mainImage = gallery.querySelector('[data-product-main]');
    const thumbs = gallery.querySelectorAll('[data-product-thumb]');

    if (!mainImage || !thumbs.length) {
      return;
    }

    const setActiveImage = (thumb) => {
      const nextSrc = thumb.dataset.image;
      const nextAlt = thumb.dataset.alt || mainImage.alt;

      if (!nextSrc) {
        return;
      }

      mainImage.src = nextSrc;
      mainImage.alt = nextAlt;

      thumbs.forEach((item) => item.classList.remove('is-active'));
      thumb.classList.add('is-active');
    };

    // When the product page opens, show the first carousel image as the main image.
    setActiveImage(thumbs[0]);

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        setActiveImage(thumb);
      });
    });
  });

  const sizeButtons = document.querySelectorAll('.product-detail-size');
  const addButton = document.querySelector('.product-detail-btn--primary');

  if (sizeButtons.length && addButton) {
    addButton.dataset.defaultLabel = addButton.textContent.trim();
    addButton.dataset.selectedSize = '';

    sizeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        sizeButtons.forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        addButton.dataset.selectedSize = button.dataset.size || button.textContent.trim();
        addButton.textContent = addButton.dataset.defaultLabel;
        addButton.classList.remove('is-prompt');
      });
    });
  }

  const accordions = document.querySelectorAll('.product-detail-accordion');

  accordions.forEach((accordion) => {
    const summary = accordion.querySelector('summary');

    if (!summary) {
      return;
    }

    let content = accordion.querySelector('.product-detail-accordion__content');

    if (!content) {
      content = document.createElement('div');
      content.className = 'product-detail-accordion__content';

      const inner = document.createElement('div');
      inner.className = 'product-detail-accordion__inner';

      while (summary.nextSibling) {
        inner.appendChild(summary.nextSibling);
      }

      content.appendChild(inner);
      accordion.appendChild(content);
    }

    accordion.removeAttribute('open');
    accordion.classList.remove('is-open');
    content.style.height = '0px';

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      const isOpen = accordion.classList.contains('is-open');
      const inner = content.firstElementChild;

      if (!inner) {
        return;
      }

      if (isOpen) {
        content.style.height = `${content.scrollHeight}px`;

        requestAnimationFrame(() => {
          accordion.classList.remove('is-open');
          content.style.height = '0px';
        });

        return;
      }

      accordion.setAttribute('open', '');
      accordion.classList.add('is-open');
      content.style.height = `${inner.scrollHeight}px`;
    });

    content.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'height') {
        return;
      }

      if (accordion.classList.contains('is-open')) {
        content.style.height = 'auto';
      } else {
        accordion.removeAttribute('open');
      }
    });
  });
});
