document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-product-gallery]');

  galleries.forEach((gallery) => {
    const stage = gallery.querySelector('[data-product-stage]');
    const thumbsContainer = gallery.querySelector('.product-detail-thumbs');
    const thumbs = gallery.querySelectorAll('[data-product-thumb]');
    
    if (!stage || !thumbsContainer || thumbs.length === 0) return;

    let indicator = thumbsContainer.querySelector('.product-detail-thumb-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'product-detail-thumb-indicator';
      thumbsContainer.appendChild(indicator);
    }

    let clickedThumbIndex = null;
    let clickedThumbTimer = null;

    function updateIndicator(index) {
      const activeThumb = thumbs[index];
      if (!activeThumb) return;

      indicator.style.width = `${activeThumb.offsetWidth}px`;
      indicator.style.height = `${activeThumb.offsetHeight}px`;
      indicator.style.transform = `translate3d(${activeThumb.offsetLeft}px, ${activeThumb.offsetTop}px, 0)`;
      indicator.style.opacity = '1';
    }

    function getActiveIndex() {
      const activeIndex = Array.from(thumbs).findIndex(t => t.classList.contains('is-active'));
      return activeIndex !== -1 ? activeIndex : 0;
    }

    function syncIndicator() {
      window.requestAnimationFrame(() => updateIndicator(getActiveIndex()));
    }

    function releaseClickedThumb() {
      clearTimeout(clickedThumbTimer);
      clickedThumbTimer = setTimeout(() => {
        clickedThumbIndex = null;
      }, 140);
    }

    window.addEventListener('load', () => setTimeout(() => updateIndicator(0), 100));
    window.addEventListener('resize', syncIndicator);
    stage.addEventListener('scroll', () => {
      if (clickedThumbIndex !== null) releaseClickedThumb();
    }, { passive: true });

    const stageImages = stage.querySelectorAll('img');

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        const stageWidth = stage.offsetWidth;
        const stageGap = parseFloat(window.getComputedStyle(stage).columnGap) || 0;

        clickedThumbIndex = index;
        releaseClickedThumb();

        stage.scrollTo({
          left: index * (stageWidth + stageGap),
          behavior: 'smooth'
        });
        updateActiveThumb(index);
      });
    });

    const observerOptions = {
      root: stage,
      threshold: 0.6
    };

    const observer = new IntersectionObserver((entries) => {
      if (clickedThumbIndex !== null) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Array.from(stageImages).indexOf(entry.target);
          if (index !== -1) {
            updateActiveThumb(index);
          }
        }
      });
    }, observerOptions);

    stageImages.forEach(img => observer.observe(img));

    function updateActiveThumb(index) {
      thumbs.forEach((thumb, i) => {
        if (i === index) {
          thumb.classList.add('is-active');
          thumb.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
        } else {
          thumb.classList.remove('is-active');
        }
      });

      window.requestAnimationFrame(() => updateIndicator(index));
    }
  });

  const accordions = document.querySelectorAll('.product-detail-accordion');
  const accordionCloseTimers = new WeakMap();
  const accordionCloseDuration = 320;
  const accordionHeightBuffer = 18;

  const ensureAccordionContent = (accordion) => {
    const summary = accordion.querySelector('summary');
    if (!summary || accordion.querySelector('.product-detail-accordion__content')) return;

    const content = document.createElement('div');
    const inner = document.createElement('div');
    content.className = 'product-detail-accordion__content';
    inner.className = 'product-detail-accordion__inner';

    Array.from(accordion.childNodes).forEach((node) => {
      if (node !== summary) inner.appendChild(node);
    });

    content.appendChild(inner);
    accordion.appendChild(content);
  };

  const setAccordionHeight = (accordion) => {
    const inner = accordion.querySelector('.product-detail-accordion__inner');
    if (!inner) return;

    accordion.style.setProperty('--product-detail-accordion-height', `${inner.scrollHeight + accordionHeightBuffer}px`);
  };

  const closeAccordion = (accordion) => {
    const summary = accordion.querySelector('summary');
    window.clearTimeout(accordionCloseTimers.get(accordion));
    setAccordionHeight(accordion);
    accordion.classList.remove('is-open');
    summary?.setAttribute('aria-expanded', 'false');

    const timer = window.setTimeout(() => {
      accordion.open = false;
      accordionCloseTimers.delete(accordion);
    }, accordionCloseDuration);

    accordionCloseTimers.set(accordion, timer);
  };

  accordions.forEach((accordion) => {
    const summary = accordion.querySelector('summary');
    if (!summary) return;

    ensureAccordionContent(accordion);
    accordion.classList.add('is-enhanced');
    setAccordionHeight(accordion);
    accordion.classList.toggle('is-open', accordion.open);
    summary.setAttribute('aria-expanded', accordion.open ? 'true' : 'false');

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      if (accordion.classList.contains('is-open')) {
        closeAccordion(accordion);
        return;
      }

      window.clearTimeout(accordionCloseTimers.get(accordion));
      accordion.open = true;
      setAccordionHeight(accordion);
      summary.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(() => {
        accordion.classList.add('is-open');
      });
    });
  });

  window.addEventListener('resize', () => {
    accordions.forEach((accordion) => {
      if (accordion.open || accordion.classList.contains('is-open')) setAccordionHeight(accordion);
    });
  });

  // ── Size selection logic ──
  const sizeButtons = document.querySelectorAll('.product-detail-size');
  const addToCartBtn = document.querySelector('.product-detail-btn--primary');

  if (sizeButtons.length && addToCartBtn) {
    // Store original label
    addToCartBtn.dataset.defaultLabel = addToCartBtn.textContent.trim();

    sizeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Toggle active state on size buttons
        sizeButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        // Store the selected size on the add-to-cart button
        addToCartBtn.dataset.selectedSize = btn.dataset.size;

        // If button was showing "SELECCIONA UN TALLE", restore it
        if (addToCartBtn.classList.contains('is-prompt')) {
          addToCartBtn.textContent = addToCartBtn.dataset.defaultLabel;
          addToCartBtn.classList.remove('is-prompt');
        }
      });
    });
  }
});
