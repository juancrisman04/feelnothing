document.addEventListener('DOMContentLoaded', () => {
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
                    <div class="quick-add-modal__sizes"></div>
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
        return Number.isFinite(amount) ? amount : 0;
    };

    const normalizeCartImage = (image) => {
        const value = String(image || '');
        return value.includes('imgremeras/') ? value.replace(/ /g, '-') : value;
    };

    const isPhotoOne = (src) => /(?:^|[ -])1\.[a-z0-9]+(?:$|\?)/i.test(String(src || ''));

    const getCardFirstImage = (card) => {
        const images = Array.from(card.querySelectorAll('img'));
        const photoOne = images.find((img) => isPhotoOne(img.getAttribute('src')));
        const productMain = card.querySelector('img[data-product-main]');

        return normalizeCartImage(
            photoOne?.getAttribute('src') ||
            productMain?.dataset.imgLifestyle ||
            productMain?.dataset.imgProduct ||
            productMain?.getAttribute('src') ||
            images[0]?.getAttribute('src') ||
            ''
        );
    };

    const getProductSizes = (product) => {
        if (product.url.includes('pantalon') || product.url.includes('bermuda')) {
            return ['38', '40', '42', '44'];
        }

        return ['S', 'M', 'L', 'XL'];
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    const addToCartFromQuickAdd = (size) => {
        if (!currentProduct) return;

        document.dispatchEvent(new CustomEvent('cart:add', {
            detail: {
                product: {
                    id: `${slugify(currentProduct.url || currentProduct.title)}-${slugify(size)}`,
                    title: currentProduct.title,
                    price: parsePrice(currentProduct.priceText),
                    image: currentProduct.image,
                    size,
                    url: currentProduct.url
                }
            }
        }));

        closeModal();
    };

    const openModal = (product) => {
        currentProduct = product;
        modalImage.src = product.image;
        modalName.textContent = product.title;
        modalPrice.textContent = product.priceText;

        sizeContainer.innerHTML = getProductSizes(product).map(size => `
            <button type="button" class="quick-add-size-btn" data-size="${size}">${size}</button>
        `).join('');

        sizeContainer.querySelectorAll('.quick-add-size-btn').forEach(btn => {
            btn.addEventListener('click', () => addToCartFromQuickAdd(btn.dataset.size), { once: true });
        });

        modal.classList.add('is-open');
        backdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };

    document.querySelectorAll('[data-quick-add-close]').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.quick-add-btn');
        if (!btn) return;

        event.preventDefault();
        event.stopPropagation();

        const card = btn.closest('.catalog-card');
        if (!card) return;

        openModal({
            title: btn.dataset.productTitle || card.querySelector('h3')?.textContent?.trim(),
            priceText: btn.dataset.productPrice || card.querySelector('.catalog-card__body p')?.textContent?.trim(),
            image: normalizeCartImage(btn.dataset.productImage) || getCardFirstImage(card),
            url: btn.dataset.productUrl || card.getAttribute('href') || ''
        });
    });
});
