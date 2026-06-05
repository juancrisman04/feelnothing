document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'feelnothing-cart';
  const ORDER_STORAGE_KEY = 'feelnothing-orders';
  const WHATSAPP_NUMBER = '5493413045521';
  const NOTIFY_EMAIL = 'juancrisman04@gmail.com';
  const FREE_SHIPPING_THRESHOLD = 100000;
  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const readCart = () => {
    try {
      const rawCart = localStorage.getItem(STORAGE_KEY);
      const parsedCart = rawCart ? JSON.parse(rawCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      return [];
    }
  };

  const writeCart = (cart) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  };

  const parsePrice = (value) => {
    if (!value) {
      return 0;
    }

    const normalized = value.toString().replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
    const amount = Number.parseFloat(normalized);
    return Number.isFinite(amount) ? amount : 0;
  };

  const formatPrice = (value) => currencyFormatter.format(value || 0);

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const slugify = (value) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const ensureDrawer = () => {
    if (document.querySelector('[data-cart-drawer]')) {
      return;
    }

    document.body.insertAdjacentHTML(
      'beforeend',
      `
        <div class="cart-drawer-backdrop" data-cart-backdrop></div>
        <aside class="cart-drawer" data-cart-drawer aria-hidden="true" aria-labelledby="cart-drawer-title">
          <div class="cart-drawer__header">
            <div>
              <p class="cart-drawer__eyebrow">Tu compra</p>
              <h2 id="cart-drawer-title" class="cart-drawer__title">Carrito</h2>
            </div>
            <button type="button" class="cart-drawer__close" aria-label="Cerrar carrito" data-cart-close>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
          <div class="cart-drawer__body" data-cart-body></div>
          <div class="cart-drawer__footer">
            <div class="cart-drawer__summary">
              <span>Subtotal</span>
              <strong data-cart-subtotal>$0</strong>
            </div>
            <button type="button" class="cart-drawer__checkout" data-cart-checkout disabled>Pagar</button>
            <p class="cart-drawer__hint" data-cart-hint>Sumá tus prendas favoritas para cerrar el pedido por WhatsApp.</p>
          </div>
        </aside>
      `
    );
  };

  ensureDrawer();

  const ensureCartPromo = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    const header = drawer?.querySelector('.cart-drawer__header');

    if (!drawer || !header || drawer.querySelector('.cart-drawer__shipping')) {
      return;
    }

    header.insertAdjacentHTML(
      'afterend',
      `
        <div class="cart-drawer__shipping" aria-label="Progreso de envio gratis">
          <p class="cart-drawer__shipping-title" data-cart-shipping-title></p>
          <div class="cart-drawer__shipping-track">
            <span data-cart-shipping-progress></span>
          </div>
        </div>
      `
    );
  };

  ensureCartPromo();

  const cartToggle = document.querySelector('[data-cart-toggle]');
  const cartDrawer = document.querySelector('[data-cart-drawer]');
  const cartBackdrop = document.querySelector('[data-cart-backdrop]');
  const cartBody = cartDrawer?.querySelector('[data-cart-body]') || cartDrawer?.querySelector('.cart-drawer__body');
  const cartSubtotal = cartDrawer?.querySelector('[data-cart-subtotal]') || cartDrawer?.querySelector('.cart-drawer__summary strong');
  const cartCheckout = cartDrawer?.querySelector('[data-cart-checkout]') || cartDrawer?.querySelector('.cart-drawer__checkout');
  const cartHint = cartDrawer?.querySelector('[data-cart-hint]') || cartDrawer?.querySelector('.cart-drawer__hint');
  const cartShipping = cartDrawer?.querySelector('.cart-drawer__shipping');
  const cartShippingTitle = cartDrawer?.querySelector('[data-cart-shipping-title]') || cartDrawer?.querySelector('.cart-drawer__shipping-title');
  const cartShippingProgress = cartDrawer?.querySelector('[data-cart-shipping-progress]') || cartDrawer?.querySelector('.cart-drawer__shipping-track span');
  const badgeNodes = document.querySelectorAll('.site-header-action__badge');
  let checkoutStep = 'cart';
  let checkoutData = {};

  if (cartCheckout) {
    cartCheckout.textContent = 'Pagar';
  }

  const openCart = () => {
    if (!cartDrawer || !cartBackdrop || !cartToggle) {
      return;
    }

    cartDrawer.classList.add('is-open');
    cartBackdrop.classList.add('is-open');
    document.body.classList.add('cart-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartToggle.setAttribute('aria-expanded', 'true');
  };

  const closeCart = () => {
    if (!cartDrawer || !cartBackdrop || !cartToggle) {
      return;
    }

    cartDrawer.classList.remove('is-open');
    cartBackdrop.classList.remove('is-open');
    document.body.classList.remove('cart-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartToggle.setAttribute('aria-expanded', 'false');
  };

  const getCartCount = (cart) => cart.reduce((total, item) => total + item.quantity, 0);
  const getSubtotal = (cart) => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getOrderTotal = (cart) => getSubtotal(cart);

  const getStoredOrders = () => {
    try {
      const rawOrders = localStorage.getItem(ORDER_STORAGE_KEY);
      const parsedOrders = rawOrders ? JSON.parse(rawOrders) : [];
      return Array.isArray(parsedOrders) ? parsedOrders : [];
    } catch (error) {
      return [];
    }
  };

  const saveOrderLocally = (order) => {
    const orders = getStoredOrders();
    orders.unshift(order);
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders.slice(0, 20)));
  };

  const getOrderLines = (cart) =>
    cart.map((item) => `- ${item.title} | Talle ${item.size} x${item.quantity} (${formatPrice(item.price * item.quantity)})`);

  const getCustomerSummary = (data) =>
    [
      `Contacto: ${data.email}`,
      `Nombre: ${data.firstName} ${data.lastName}`,
      `DNI: ${data.document}`,
      `Direccion: ${data.address}${data.apartment ? `, ${data.apartment}` : ''}`,
      `CP/Ciudad: ${data.postalCode} - ${data.city}`,
      `Provincia: ${data.province}`,
      `Telefono: ${data.phone}`
    ].join('\n');

  const notifyOrderByEmail = async (order) => {
    const body = new FormData();
    body.append('_subject', `Nueva compra Feel Nothing - ${order.id}`);
    body.append('pedido', order.id);
    body.append('cliente', `${order.customer.firstName} ${order.customer.lastName}`);
    body.append('email', order.customer.email);
    body.append('telefono', order.customer.phone);
    body.append('direccion', `${order.customer.address}${order.customer.apartment ? `, ${order.customer.apartment}` : ''}`);
    body.append('ciudad', order.customer.city);
    body.append('provincia', order.customer.province);
    body.append('codigo_postal', order.customer.postalCode);
    body.append('total', formatPrice(order.total));
    body.append('productos', getOrderLines(order.items).join('\n'));

    try {
      await fetch(`https://formsubmit.co/ajax/${NOTIFY_EMAIL}`, {
        method: 'POST',
        body,
        headers: {
          Accept: 'application/json'
        }
      });
    } catch (error) {
      // WhatsApp remains the guaranteed handoff if the email service is unavailable.
    }
  };

  const updateShippingProgress = (subtotal) => {
    if (!cartShipping || !cartShippingTitle || !cartShippingProgress) {
      return;
    }

    const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
    const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    cartShipping.classList.toggle('is-complete', hasFreeShipping);
    cartShippingTitle.textContent = hasFreeShipping
      ? 'HAS DESBLOQUEADO ENVIO GRATIS EN TU PEDIDO!'
      : `SUMA ${formatPrice(remaining)} Y CONSIGUE ENVIO GRATIS`;
    cartShippingProgress.style.width = `${progress}%`;
  };

  const bindCloseButtons = () => {
    document.querySelectorAll('[data-cart-close]').forEach((button) => {
      button.onclick = closeCart;
    });
  };

  const setCheckoutShell = (step) => {
    checkoutStep = step;
    cartDrawer?.classList.toggle('cart-drawer--checkout', step !== 'cart');
    cartShipping?.classList.toggle('is-hidden', step !== 'cart');
  };

  const getCheckoutProgress = (activeStep) => `
    <div class="checkout-steps" aria-label="Estado del checkout">
      <span class="${activeStep === 'info' ? 'is-active' : ''}">Informacion</span>
      <span aria-hidden="true">&rsaquo;</span>
      <span class="${activeStep === 'summary' ? 'is-active' : ''}">Envio</span>
      <span aria-hidden="true">&rsaquo;</span>
      <span>Pago</span>
    </div>
  `;

  const getCheckoutHeader = (cart) => `
    <div class="checkout-panel__brand">
      <img src="img/logo.png" alt="Feel Nothing" class="checkout-panel__logo">
    </div>
    <details class="checkout-order-toggle">
      <summary>
        <span>Resumen del pedido</span>
        <strong>${formatPrice(getOrderTotal(cart))}</strong>
      </summary>
      <div class="checkout-order-mini">
        ${cart
          .map(
            (item) => `
              <div class="checkout-order-mini__item">
                <span>${escapeHtml(item.title)} x${item.quantity}</span>
                <strong>${formatPrice(item.price * item.quantity)}</strong>
              </div>
            `
          )
          .join('')}
      </div>
    </details>
  `;

  const getCountryOption = (value, label) => `
    <option value="${value}" ${checkoutData.country === value || (!checkoutData.country && value === 'Argentina') ? 'selected' : ''}>${label}</option>
  `;

  const renderCheckoutInfo = () => {
    const cart = readCart();
    setCheckoutShell('info');
    cartSubtotal.textContent = formatPrice(getOrderTotal(cart));
    cartCheckout.disabled = false;
    cartCheckout.textContent = 'Continuar con el pago';
    cartHint.textContent = 'Completa tus datos para preparar el pedido.';

    cartBody.innerHTML = `
      <section class="checkout-panel">
        ${getCheckoutHeader(cart)}
        ${getCheckoutProgress('info')}

        <div class="checkout-express" aria-label="Pago express">
          <p>Pago expres</p>
          <div class="checkout-express__grid">
            <button type="button" class="checkout-express__btn checkout-express__btn--paypal" data-checkout-login="PayPal">PayPal</button>
            <button type="button" class="checkout-express__btn checkout-express__btn--google" data-checkout-login="Google">G Pay</button>
            <button type="button" class="checkout-express__btn checkout-express__btn--apple" data-checkout-login="Apple">Apple</button>
          </div>
          <div class="checkout-divider"><span>O</span></div>
        </div>

        <form class="checkout-form" data-checkout-form>
          <div class="checkout-form__section">
            <div class="checkout-form__heading">
              <h3>Contacto</h3>
              <button type="button" data-checkout-login="Google">Iniciar sesion</button>
            </div>
            <input type="email" name="email" placeholder="Correo electronico" autocomplete="email" required value="${escapeHtml(checkoutData.email)}">
            <label class="checkout-check">
              <input type="checkbox" name="newsletter" ${checkoutData.newsletter ? 'checked' : ''}>
              <span>Enviarme novedades y ofertas por correo electronico</span>
            </label>
          </div>

          <div class="checkout-form__section">
            <h3>Direccion de envio</h3>
            <select name="country" required>
              ${getCountryOption('Argentina', 'Argentina')}
              ${getCountryOption('Uruguay', 'Uruguay')}
              ${getCountryOption('Chile', 'Chile')}
              ${getCountryOption('Espana', 'Espana')}
            </select>
            <input type="text" name="firstName" placeholder="Nombre" autocomplete="given-name" required value="${escapeHtml(checkoutData.firstName)}">
            <input type="text" name="lastName" placeholder="Apellidos" autocomplete="family-name" required value="${escapeHtml(checkoutData.lastName)}">
            <input type="text" name="document" placeholder="DNI, NIE o Pasaporte" required value="${escapeHtml(checkoutData.document)}">
            <input type="text" name="address" placeholder="Direccion" autocomplete="street-address" required value="${escapeHtml(checkoutData.address)}">
            <input type="text" name="apartment" placeholder="Casa, apartamento, etc. (opcional)" value="${escapeHtml(checkoutData.apartment)}">
            <input type="text" name="postalCode" placeholder="Codigo postal" autocomplete="postal-code" required value="${escapeHtml(checkoutData.postalCode)}">
            <input type="text" name="city" placeholder="Ciudad" autocomplete="address-level2" required value="${escapeHtml(checkoutData.city)}">
            <input type="text" name="province" placeholder="Provincia / Estado" autocomplete="address-level1" required value="${escapeHtml(checkoutData.province)}">
            <input type="tel" name="phone" placeholder="Telefono" autocomplete="tel" required value="${escapeHtml(checkoutData.phone)}">
            <label class="checkout-check">
              <input type="checkbox" name="saveInfo" ${checkoutData.saveInfo ? 'checked' : ''}>
              <span>Guardar mi informacion y consultar mas rapidamente la proxima vez</span>
            </label>
            <label class="checkout-check">
              <input type="checkbox" name="smsOffers" ${checkoutData.smsOffers ? 'checked' : ''}>
              <span>Enviarme novedades y ofertas por SMS</span>
            </label>
          </div>
        </form>
      </section>
    `;

    cartBody.querySelectorAll('[data-checkout-login]').forEach((button) => {
      button.addEventListener('click', () => {
        const email = window.prompt(`Ingresa tu correo para continuar con ${button.dataset.checkoutLogin}:`, checkoutData.email || '');
        if (!email) {
          return;
        }
        checkoutData.email = email.trim();
        renderCheckoutInfo();
      });
    });
  };

  const collectCheckoutData = () => {
    const form = cartBody.querySelector('[data-checkout-form]');
    if (!form) {
      return false;
    }

    if (!form.reportValidity()) {
      return false;
    }

    const formData = new FormData(form);
    checkoutData = {
      email: formData.get('email')?.trim(),
      newsletter: formData.has('newsletter'),
      country: formData.get('country') || 'Argentina',
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      document: formData.get('document')?.trim(),
      address: formData.get('address')?.trim(),
      apartment: formData.get('apartment')?.trim(),
      postalCode: formData.get('postalCode')?.trim(),
      city: formData.get('city')?.trim(),
      province: formData.get('province')?.trim(),
      phone: formData.get('phone')?.trim(),
      saveInfo: formData.has('saveInfo'),
      smsOffers: formData.has('smsOffers')
    };

    return true;
  };

  const renderCheckoutSummary = () => {
    const cart = readCart();
    setCheckoutShell('summary');
    cartSubtotal.textContent = formatPrice(getOrderTotal(cart));
    cartCheckout.disabled = false;
    cartCheckout.textContent = 'Pagar';
    cartHint.textContent = 'Al pagar te abrimos WhatsApp con el pedido listo.';

    cartBody.innerHTML = `
      <section class="checkout-panel checkout-panel--summary">
        ${getCheckoutHeader(cart)}
        ${getCheckoutProgress('summary')}

        <div class="checkout-summary-box">
          <div>
            <span>Contacto</span>
            <strong>${escapeHtml(checkoutData.email)}</strong>
            <button type="button" data-checkout-edit> Cambiar</button>
          </div>
          <div>
            <span>Enviar a</span>
            <strong>${escapeHtml(checkoutData.address)}, ${escapeHtml(checkoutData.postalCode)} ${escapeHtml(checkoutData.city)}, ${escapeHtml(checkoutData.province)}, ${escapeHtml(checkoutData.country)}</strong>
            <button type="button" data-checkout-edit> Cambiar</button>
          </div>
        </div>

        <div class="checkout-order-list">
          <h3>Pedido</h3>
          ${cart
            .map(
              (item) => `
                <article class="checkout-order-item">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>Talle ${escapeHtml(item.size)} | Cantidad ${item.quantity}</span>
                  </div>
                  <b>${formatPrice(item.price * item.quantity)}</b>
                </article>
              `
            )
            .join('')}
          <div class="checkout-total-row">
            <span>Total</span>
            <strong>${formatPrice(getOrderTotal(cart))}</strong>
          </div>
        </div>
      </section>
    `;

    cartBody.querySelectorAll('[data-checkout-edit]').forEach((button) => {
      button.addEventListener('click', renderCheckoutInfo);
    });
  };

  const updateQuantity = (id, nextQuantity) => {
    const cart = readCart();
    const nextCart = cart
      .map((item) => {
        if (item.id !== id) {
          return item;
        }

        return { ...item, quantity: nextQuantity };
      })
      .filter((item) => item.quantity > 0);

    writeCart(nextCart);
    renderCart();
  };

  const renderCart = () => {
    if (checkoutStep === 'info') {
      renderCheckoutInfo();
      return;
    }

    if (checkoutStep === 'summary') {
      renderCheckoutSummary();
      return;
    }

    const cart = readCart();
    const itemCount = getCartCount(cart);
    const subtotal = getSubtotal(cart);

    badgeNodes.forEach((badge) => {
      badge.textContent = String(itemCount);
      badge.classList.toggle('is-empty', itemCount === 0);
    });

    if (!cartBody || !cartSubtotal || !cartCheckout || !cartHint) {
      return;
    }

    cartSubtotal.textContent = formatPrice(subtotal);
    cartCheckout.disabled = cart.length === 0;
    cartCheckout.textContent = 'Pagar';
    setCheckoutShell('cart');
    updateShippingProgress(subtotal);

    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-drawer__empty">
          <div class="cart-drawer__empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="20" r="1.6"></circle>
              <circle cx="17" cy="20" r="1.6"></circle>
              <path d="M3 4h2.2l2.1 9.1a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8l1.5-6.1H7.1"></path>
            </svg>
          </div>
          <h3>Tu carrito esta vacio</h3>
          <p>Suma tus prendas favoritas para verlas aca antes de finalizar la compra.</p>
          <a href="index.html#products" class="cart-drawer__link" data-cart-close>Ver productos</a>
        </div>
      `;
      cartHint.textContent = 'Sumá tus prendas favoritas para cerrar el pedido por WhatsApp.';
      bindCloseButtons();
      return;
    }

    cartBody.innerHTML = `
      <div class="cart-drawer__items">
        ${cart
          .map(
            (item) => `
              <article class="cart-item">
                <a href="${escapeHtml(item.url || 'index.html')}" class="cart-item__image-link">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="cart-item__image">
                </a>
                <div class="cart-item__content">
                  <div class="cart-item__top">
                    <div class="cart-item__info">
                      <a href="${escapeHtml(item.url || 'index.html')}" class="cart-item__title-link">
                        <p class="cart-item__title">${escapeHtml(item.title)}</p>
                      </a>
                      <p class="cart-item__price">${formatPrice(item.price)}</p>
                      <p class="cart-item__meta">TALLA ${escapeHtml(item.size)}</p>
                    </div>
                    <button type="button" class="cart-item__remove" data-cart-remove="${escapeHtml(item.id)}">ELIMINAR</button>
                  </div>
                  <div class="cart-item__quantity" aria-label="Cantidad">
                    <button type="button" class="cart-item__quantity-btn" data-cart-decrease="${escapeHtml(item.id)}">-</button>
                    <span class="cart-item__quantity-value">${item.quantity}</span>
                    <button type="button" class="cart-item__quantity-btn" data-cart-increase="${escapeHtml(item.id)}">+</button>
                  </div>
                </div>
              </article>
            `
          )
          .join('')}
      </div>
    `;

    cartHint.textContent = 'Cuando quieras cerrar la compra, te armamos el mensaje con tu pedido.';

    cartBody.querySelectorAll('[data-cart-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        updateQuantity(button.dataset.cartRemove, 0);
      });
    });

    cartBody.querySelectorAll('[data-cart-decrease]').forEach((button) => {
      button.addEventListener('click', () => {
        const cart = readCart();
        const item = cart.find((entry) => entry.id === button.dataset.cartDecrease);

        if (!item) {
          return;
        }

        updateQuantity(item.id, item.quantity - 1);
      });
    });

    cartBody.querySelectorAll('[data-cart-increase]').forEach((button) => {
      button.addEventListener('click', () => {
        const cart = readCart();
        const item = cart.find((entry) => entry.id === button.dataset.cartIncrease);

        if (!item) {
          return;
        }

        updateQuantity(item.id, item.quantity + 1);
      });
    });
  };

  const addToCart = (product) => {
    const cart = readCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    writeCart(cart);
    renderCart();
    openCart();
  };

  document.addEventListener('cart:add', (event) => {
    if (event.detail && event.detail.product) {
      addToCart(event.detail.product);
    }
  });

  if (cartToggle) {
    cartToggle.addEventListener('click', () => {
      const isOpen = cartDrawer?.classList.contains('is-open');
      if (isOpen) {
        closeCart();
      } else {
        openCart();
      }
    });
  }

  cartBackdrop?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cartDrawer?.classList.contains('is-open')) {
      closeCart();
    }
  });

  bindCloseButtons();

  const detailAddButton = document.querySelector('.product-detail-btn--primary');
  if (detailAddButton) {
    detailAddButton.addEventListener('click', (event) => {
      event.preventDefault();

      const title = document.querySelector('.product-detail-title')?.textContent?.trim();
      const priceText = document.querySelector('.product-detail-price')?.textContent?.trim();
      const image = document.querySelector('[data-product-main]')?.getAttribute('src');
      const size = detailAddButton.dataset.selectedSize?.trim();

      if (!size) {
        detailAddButton.textContent = 'SELECCIONÁ UN TALLE';
        detailAddButton.classList.add('is-prompt');
        return;
      }

      if (!title || !priceText || !image) {
        return;
      }

      detailAddButton.textContent = detailAddButton.dataset.defaultLabel || 'AGREGAR AL CARRITO';
      detailAddButton.classList.remove('is-prompt');

      addToCart({
        id: `${slugify(window.location.pathname || title) || slugify(title)}-${slugify(size)}`,
        title,
        price: parsePrice(priceText),
        image,
        size,
        url: window.location.pathname.split('/').pop() || 'index.html'
      });
    });
  }

  cartCheckout?.addEventListener('click', () => {
    const cart = readCart();
    if (!cart.length) {
      return;
    }

    window.location.href = 'checkout.html?from=cart';
  });

  renderCart();
});
