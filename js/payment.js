document.addEventListener('DOMContentLoaded', () => {
  const CART_STORAGE_KEY = 'feelnothing-cart';
  const CHECKOUT_STORAGE_KEY = 'feelnothing-checkout';
  const ORDER_STORAGE_KEY = 'feelnothing-orders';
  const WHATSAPP_NUMBER = '5493413045521';
  const FUNES_POSTAL_CODES = new Set(['2132']);

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const formatPrice = (value) => currencyFormatter.format(value || 0);
  const normalizePostalCode = (value) => String(value || '').trim().replace(/\D/g, '');
  const getShippingCost = (postalCode) => (FUNES_POSTAL_CODES.has(normalizePostalCode(postalCode)) ? 2000 : 5000);

  const readJson = (key, fallback) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
      return parsed || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const rawCart = readJson(CART_STORAGE_KEY, []);
  const cart = (Array.isArray(rawCart) ? rawCart : []).map((item) => {
    if (item.image && (item.image.includes('imgremeras/') || item.image.includes('imgpantalones/'))) {
      item.image = item.image.replace(/ /g, '-');
    }
    return item;
  });
  const checkout = readJson(CHECKOUT_STORAGE_KEY, {});
  let customer = checkout.customer;
  const root = document.querySelector('[data-payment-root]');

  if (!cart.length || !customer) {
    root.innerHTML = `
      <div class="checkout-empty">
        <img src="img/logo.png" alt="Feel Nothing">
        <h1>Faltan datos para continuar</h1>
        <a href="${cart.length ? 'checkout.html' : 'index.html#products'}">${cart.length ? 'Completar datos' : 'Ver productos'}</a>
      </div>
    `;
    return;
  }

  const getSubtotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getCount = () => cart.reduce((total, item) => total + item.quantity, 0);
  
  let shipping = checkout.shippingCost ?? getShippingCost(customer.postalCode);
  let total = getSubtotal() + shipping;

  const renderItems = () => {
    const itemsNode = document.querySelector('[data-payment-items]');
    if (!itemsNode) return;
    itemsNode.innerHTML = cart
      .map(
        (item) => `
          <div class="checkout-full-item">
            <div class="checkout-full-item__media">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
              <span>${item.quantity}</span>
            </div>
            <div class="checkout-full-item__info">
              <strong>${escapeHtml(item.title)}</strong>
              <span>Talle: ${escapeHtml(item.size)}</span>
            </div>
            <b>${formatPrice(item.price * item.quantity)}</b>
          </div>
        `
      )
      .join('');
  };

  const renderTotals = () => {
    shipping = checkout.shippingCost ?? getShippingCost(customer.postalCode);
    total = getSubtotal() + shipping;
    
    document.querySelector('[data-payment-count]').textContent = `${getCount()} articulos`;
    document.querySelector('[data-payment-subtotal]').textContent = formatPrice(getSubtotal());
    document.querySelector('[data-payment-shipping]').textContent = formatPrice(shipping);
    document.querySelector('[data-payment-total]').textContent = formatPrice(total);
    document.querySelector('[data-payment-grand-total]').textContent = formatPrice(total);
  };

  const renderCustomer = () => {
    const contactNode = document.querySelector('[data-payment-contact]');
    const shippingFullNode = document.querySelector('[data-payment-shipping-full]');

    if (contactNode) contactNode.textContent = customer.email;
    if (shippingFullNode) {
      shippingFullNode.innerHTML = `
        ${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}<br>
        ${escapeHtml(customer.address)}, ${escapeHtml(customer.city)}<br>
        ${escapeHtml(customer.phone)}
      `;
    }
  };

  const getOrderLines = () =>
    cart.map((item) => `- ${item.title} | Talle ${item.size} x${item.quantity} (${formatPrice(item.price * item.quantity)})`);

  const saveOrderLocally = (order) => {
    const orders = readJson(ORDER_STORAGE_KEY, []);
    const safeOrders = Array.isArray(orders) ? orders : [];
    safeOrders.unshift(order);
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(safeOrders.slice(0, 20)));
  };

  const submitOrder = async (order) => {
    const submitButton = document.querySelector('[data-payment-submit]');
    if (!submitButton) return;
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando pedido...';

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      }).catch(() => {});
    } catch (error) {
      console.warn(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Pagar';
    }
  };

  const finishOrder = async () => {
    const order = {
      id: `FN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: cart,
      shipping,
      total
    };
    const customerLines = [
      `Contacto: ${customer.email}`,
      `Nombre: ${customer.firstName} ${customer.lastName}`,
      `DNI: ${customer.document}`,
      `Direccion: ${customer.address}`,
      `CP/Ciudad: ${customer.postalCode} - ${customer.city}`,
      `Telefono: ${customer.phone}`
    ];
    const message = `Hola! Quiero finalizar esta compra:\n${getOrderLines().join('\n')}\n\n${customerLines.join('\n')}\n\nEnvio: ${formatPrice(shipping)}\nTotal: ${formatPrice(total)}`;

    saveOrderLocally(order);
    await submitOrder(order);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  renderItems();
  renderTotals();
  renderCustomer();

  document.querySelector('[data-summary-toggle]')?.addEventListener('click', function() {
    const content = document.querySelector('[data-summary-content]');
    content.classList.toggle('is-open');
    const isOpen = content.classList.contains('is-open');
    this.setAttribute('aria-expanded', isOpen);
  });

  document.querySelectorAll('[data-payment-back]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  });

  document.querySelector('[data-payment-submit]')?.addEventListener('click', finishOrder);
});
