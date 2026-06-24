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

    function updateIndicator(index) {
      const activeThumb = thumbs[index];
      if (!activeThumb) return;

      const containerRect = thumbsContainer.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();

      indicator.style.width = `${thumbRect.width}px`;
      indicator.style.height = `${thumbRect.height}px`;
      indicator.style.top = `${thumbRect.top - containerRect.top + thumbsContainer.scrollTop}px`;
      indicator.style.left = `${thumbRect.left - containerRect.left + thumbsContainer.scrollLeft}px`;
      indicator.style.opacity = '1';
    }

    window.addEventListener('load', () => setTimeout(() => updateIndicator(0), 100));
    window.addEventListener('resize', () => {
      const activeIndex = Array.from(thumbs).findIndex(t => t.classList.contains('is-active'));
      updateIndicator(activeIndex !== -1 ? activeIndex : 0);
    });

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        const stageWidth = stage.offsetWidth;
        stage.scrollTo({
          left: index * stageWidth,
          behavior: 'smooth'
        });
        updateActiveThumb(index);
      });
    });

    const stageImages = stage.querySelectorAll('img');
    const observerOptions = {
      root: stage,
      threshold: 0.6
    };

    const observer = new IntersectionObserver((entries) => {
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
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          thumb.classList.remove('is-active');
        }
      });
      updateIndicator(index);
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
