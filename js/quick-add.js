document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyectar el modal de talles al body si no existe
    if (!document.querySelector('.quick-add-modal')) {
        const modalHtml = `
            <div class="quick-add-backdrop" data-quick-add-close></div>
            <div class="quick-add-modal">
                <div class="quick-add-modal__header">
                    <h3 class="quick-add-modal__title">Seleccionar talle</h3>
                    <button type="button" class="quick-add-modal__close" data-quick-add-close>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </button>
                </div>
                <div class="quick-add-modal__body">
                    <div class="quick-add-modal__product-info">
                        <img src="" alt="" class="quick-add-modal__image">
                        <div>
                            <p class="quick-add-modal__name"></p>
                            <p class="quick-add-modal__price"></p>
                        </div>
                    </div>
                    <div class="quick-add-modal__sizes">
                        <!-- Talles se inyectan dinámicamente -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = document.querySelector('.quick-add-modal');
    const backdrop = document.querySelector('.quick-add-backdrop');
    const sizeContainer = modal.querySelector('.quick-add-modal__sizes');
    const modalImage = modal.querySelector('.quick-add-modal__image');
    const modalName = modal.querySelector('.quick-add-modal__name');
    const modalPrice = modal.querySelector('.quick-add-modal__price');

    let currentProduct = null;

    const openModal = (product) => {
        currentProduct = product;
        modalImage.src = product.image;
        modalName.textContent = product.title;
        modalPrice.textContent = product.priceText;

        // Determinar talles según el tipo de producto o URL
        let sizes = ['S', 'M', 'L', 'XL']; // Default para remeras/buzos
        if (product.url.includes('pantalon') || product.url.includes('bermuda')) {
            sizes = ['38', '40', '42', '44'];
        }

        sizeContainer.innerHTML = sizes.map(size => `
            <button type="button" class="quick-add-size-btn" data-size="${size}">${size}</button>
        `).join('');

        modal.classList.add('is-open');
        backdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        // Bind size buttons
        sizeContainer.querySelectorAll('.quick-add-size-btn').forEach(btn => {
            btn.onclick = () => {
                const selectedSize = btn.dataset.size;
                addToCartFromQuickAdd(selectedSize);
            };
        });
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-quick-add-close]').forEach(el => {
        el.onclick = closeModal;
    });

    const addToCartFromQuickAdd = (size) => {
        if (!currentProduct) return;

        // window.addToCart is not global, but we can trigger a click on the actual detail button 
        // OR better, we know js/cart.js is loaded and we can try to find the function or dispatch an event.
        // Actually, js/cart.js defines addToCart inside a DOMContentLoaded listener, so it's not global.
        
        // Let's look at how cart.js handles events. It doesn't seem to export addToCart.
        // I will dispatch a custom event that cart.js could listen to, but cart.js is already written.
        
        // Wait, I can see cart.js implementation. I'll modify cart.js to export addToCart or handle a custom event.
        
        // Alternatively, I can just copy the addToCart logic or expose it.
        // The most robust way is to make addToCart global in cart.js.
        
        const cartEvent = new CustomEvent('cart:add', {
            detail: {
                product: {
                    id: `${slugify(currentProduct.url || currentProduct.title)}-${slugify(size)}`,
                    title: currentProduct.title,
                    price: parsePrice(currentProduct.priceText),
                    image: currentProduct.image,
                    size: size,
                    url: currentProduct.url
                }
            }
        });
        document.dispatchEvent(cartEvent);
        closeModal();
    };

    // Helper functions (copied from cart.js or common utils)
    const slugify = (value) =>
        String(value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const parsePrice = (value) => {
        if (!value) return 0;
        const normalized = value.toString().replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(normalized);
        return isFinite(amount) ? amount : 0;
    };

    // Delegación de eventos para los botones de "más"
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-add-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();

            const card = btn.closest('.catalog-card') || btn.closest('.catalog-editorial-card');
            if (!card) return;

            const isEditorial = card.classList.contains('catalog-editorial-card');

            const product = {
                title: btn.dataset.productTitle || (isEditorial ? card.querySelector('.catalog-editorial-card__title') : card.querySelector('h3'))?.textContent?.trim(),
                priceText: btn.dataset.productPrice || (isEditorial ? card.querySelector('.catalog-editorial-card__price') : card.querySelector('.catalog-card__body p'))?.textContent?.trim(),
                image: (btn.dataset.productImage || card.querySelector('img[data-product-main]')?.getAttribute('src') || card.querySelector('img')?.getAttribute('src') || '').replace(/ /g, '-'),
                url: btn.dataset.productUrl || card.getAttribute('href')
            };

            openModal(product);
        }
    });
});
