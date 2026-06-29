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
  accordions.forEach((accordion) => {
    accordion.querySelector('summary')?.addEventListener('click', () => {
      if (!accordion.hasAttribute('open')) {
        accordion.classList.add('is-open');
      } else {
        accordion.classList.remove('is-open');
      }
    });
  });
});
