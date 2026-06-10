document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-product-gallery]');

  galleries.forEach((gallery) => {
    const stage = gallery.querySelector('[data-product-stage]');
    const thumbsContainer = gallery.querySelector('.product-detail-thumbs');
    const thumbs = gallery.querySelectorAll('[data-product-thumb]');
    
    if (!stage || !thumbsContainer || thumbs.length === 0) return;

    // Crear e inyectar el indicador deslizante
    let indicator = thumbsContainer.querySelector('.product-detail-thumb-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'product-detail-thumb-indicator';
      thumbsContainer.appendChild(indicator);
    }

    // Función para posicionar el indicador
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

    // Inicializar indicador
    window.addEventListener('load', () => setTimeout(() => updateIndicator(0), 100));
    window.addEventListener('resize', () => {
      const activeIndex = Array.from(thumbs).findIndex(t => t.classList.contains('is-active'));
      updateIndicator(activeIndex !== -1 ? activeIndex : 0);
    });

    // Sincronizar clicks en miniaturas -> Scroll del stage
    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        const stageWidth = stage.offsetWidth;
        stage.scrollTo({
          left: index * stageWidth,
          behavior: 'smooth'
        });
        // Actualizamos inmediatamente el indicador para respuesta visual rápida
        updateActiveThumb(index);
      });
    });

    // Sincronizar scroll del stage -> Clase activa en miniaturas
    const stageImages = stage.querySelectorAll('img');
    const observerOptions = {
      root: stage,
      threshold: 0.6 // Aumentado para mayor precisión
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
          // Asegurarse de que la miniatura sea visible
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          thumb.classList.remove('is-active');
        }
      });
      updateIndicator(index);
    }
  });

  // Acordeones de detalle de producto
  const accordions = document.querySelectorAll('.product-detail-accordion');
  accordions.forEach((accordion) => {
    const summary = accordion.querySelector('summary');
    const content = accordion.querySelector('.product-detail-accordion__content');

    summary.addEventListener('click', (e) => {
      // No hacemos preventDefault para que el <details> se abra/cierre
      // Pero calculamos la altura para la animación
      if (!accordion.hasAttribute('open')) {
        // Se va a abrir
        accordion.classList.add('is-open');
      } else {
        // Se va a cerrar
        accordion.classList.remove('is-open');
      }
    });

    // Manejar la transición de altura (si se implementó con wrapper)
    accordion.addEventListener('toggle', () => {
       // Opcional: lógica extra al terminar el toggle
    });
  });
});
