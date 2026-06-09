document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-product-gallery]');

  galleries.forEach((gallery) => {
    const stage = gallery.querySelector('[data-product-stage]');
    const thumbs = gallery.querySelectorAll('[data-product-thumb]');
    
    if (!stage || thumbs.length === 0) return;

    // Sincronizar clicks en miniaturas -> Scroll del stage
    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        const stageWidth = stage.offsetWidth;
        stage.scrollTo({
          left: index * stageWidth,
          behavior: 'smooth'
        });
        
        // La actualización de clase se maneja en el IntersectionObserver para que sea consistente
      });
    });

    // Sincronizar scroll del stage -> Clase activa en miniaturas
    // Usamos IntersectionObserver para detectar qué imagen está visible al 50% o más
    const stageImages = stage.querySelectorAll('img');
    const observerOptions = {
      root: stage,
      threshold: 0.5
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
          // Asegurarse de que la miniatura sea visible en su propio contenedor scrollable
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          thumb.classList.remove('is-active');
        }
      });
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
