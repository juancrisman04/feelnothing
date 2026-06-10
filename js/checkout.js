document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'feelnothing-cart';
  const CHECKOUT_STORAGE_KEY = 'feelnothing-checkout';
  const ORDER_STORAGE_KEY = 'feelnothing-orders';
  const WHATSAPP_NUMBER = '5493413045521';
  const NOTIFY_EMAIL = 'juancrisman04@gmail.com';
  const FUNES_POSTAL_CODES = new Set(['2132']);

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const readCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item) => {
        if (item.image && (item.image.includes('imgremeras/') || item.image.includes('imgpantalones/'))) {
          item.image = item.image.replace(/ /g, '-');
        }
        return item;
      });
    } catch (error) {
      return [];
    }
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatPrice = (value) => currencyFormatter.format(value || 0);
  const getSubtotal = (cart) => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getCount = (cart) => cart.reduce((total, item) => total + item.quantity, 0);
  const normalizePostalCode = (value) => String(value || '').trim().replace(/\D/g, '');
  const getShippingCost = (postalCode) => (FUNES_POSTAL_CODES.has(normalizePostalCode(postalCode)) ? 2000 : 5000);

  const cart = readCart();
  const readCheckout = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  };

  const writeCheckout = (data) => {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  };

  const savedCheckout = readCheckout();
  const state = {
    step: 'info',
    shippingCost: savedCheckout.shippingCost ?? null,
    postalCode: savedCheckout.postalCode || savedCheckout.customer?.postalCode || '',
    customer: savedCheckout.customer || null
  };

  const itemsNode = document.querySelector('[data-checkout-items]');
  const countNode = document.querySelector('[data-checkout-count]');
  const subtotalNode = document.querySelector('[data-checkout-subtotal]');
  const shippingNode = document.querySelector('[data-checkout-shipping]');
  const totalNode = document.querySelector('[data-checkout-total]');
  const grandTotalNode = document.querySelector('[data-checkout-grand-total]');
  const checkoutForm = document.querySelector('[data-checkout-form]');
  const shippingForm = document.querySelector('[data-shipping-form]');
  const shippingInput = shippingForm?.querySelector('input[name="postalCode"]');
  const formPostalInput = checkoutForm?.querySelector('input[name="postalCode"]');
  const shippingMessage = document.querySelector('[data-shipping-message]');
  const summaryToggle = document.querySelector('[data-summary-toggle]');
  const summaryContent = document.querySelector('[data-summary-content]');
  const reviewNode = document.querySelector('[data-checkout-review]');
  const primaryButton = document.querySelector('[data-checkout-primary]');

  if (!cart.length) {
    document.querySelector('[data-checkout-root]').innerHTML = `
      <div class="checkout-empty">
        <img src="img/logo.png" alt="Feel Nothing">
        <h1>Tu carrito esta vacio</h1>
        <a href="index.html#products">Ver productos</a>
      </div>
    `;
    return;
  }

  const prefillCheckoutForm = () => {
    if (!state.customer || !checkoutForm) {
      return;
    }

    Object.entries(state.customer).forEach(([key, value]) => {
      const field = checkoutForm.elements[key];
      if (!field || typeof value === 'boolean') {
        return;
      }
      field.value = value || '';
    });

    if (checkoutForm.elements.newsletter) {
      checkoutForm.elements.newsletter.checked = Boolean(state.customer.newsletter);
    }

    if (state.postalCode) {
      updateShippingFromPostal(state.postalCode);
    }
  };

  const renderItems = () => {
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
    const subtotal = getSubtotal(cart);
    const total = subtotal + (state.shippingCost || 0);
    countNode.textContent = `${getCount(cart)} articulos`;
    subtotalNode.textContent = formatPrice(subtotal);
    shippingNode.textContent = state.shippingCost === null ? 'Calculado en el siguiente paso' : formatPrice(state.shippingCost);
    totalNode.textContent = formatPrice(total);
    grandTotalNode.textContent = formatPrice(total);
  };

  const setStep = (step) => {
    state.step = step;
    document.querySelectorAll('[data-step-label]').forEach((label) => {
      const isInfoStep = step === 'info' || step === 'shipping';
      const isActive = label.dataset.stepLabel === step || (label.dataset.stepLabel === 'info' && isInfoStep);
      label.classList.toggle('is-active', isActive);
    });
  };

  const updateShippingFromPostal = (postalCode) => {
    const normalized = normalizePostalCode(postalCode);
    if (!normalized) {
      state.shippingCost = null;
      state.postalCode = '';
      shippingMessage.textContent = 'Ingresa tu codigo postal para calcular el envio.';
      renderTotals();
      return;
    }

    state.postalCode = normalized;
    state.shippingCost = getShippingCost(normalized);
    shippingInput.value = normalized;
    if (formPostalInput && formPostalInput.value !== normalized) {
      formPostalInput.value = normalized;
    }
    shippingMessage.textContent = FUNES_POSTAL_CODES.has(normalized)
      ? 'Envio a Funes: $2.000'
      : 'Envio a Rosario u otra zona: $5.000';
    renderTotals();
  };

  const validateForm = () => {
    let isValid = true;
    const inputs = checkoutForm.querySelectorAll('input[required]');
    
    // Clear previous errors
    checkoutForm.querySelectorAll('.checkout-field-error').forEach(el => el.remove());
    checkoutForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    inputs.forEach(input => {
      const value = input.value.trim();
      let fieldValid = true;

      if (!value) {
        fieldValid = false;
      } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldValid = false;
      } else if (input.name === 'document' && !/^\d{8}$/.test(value)) {
        fieldValid = false;
      } else if (input.name === 'phone' && !/^\d{10}$/.test(value)) {
        fieldValid = false;
      }

      if (!fieldValid) {
        isValid = false;
        const error = document.createElement('div');
        error.className = 'checkout-field-error';
        error.textContent = 'Ingrese este dato para continuar';
        
        const container = input.closest('.checkout-full__phone-group') || input;
        container.classList.add('is-invalid');
        container.after(error);
      }
    });

    return isValid;
  };

  const collectCustomer = () => {
    if (!validateForm()) {
      return false;
    }

    const formData = new FormData(checkoutForm);
    const phoneValue = formData.get('phone')?.trim();
    state.customer = {
      email: formData.get('email')?.trim(),
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      document: formData.get('document')?.trim(),
      address: formData.get('address')?.trim(),
      postalCode: formData.get('postalCode')?.trim(),
      city: formData.get('city')?.trim(),
      phone: phoneValue
    };

    updateShippingFromPostal(state.customer.postalCode);
    writeCheckout({
      customer: state.customer,
      postalCode: state.postalCode || state.customer.postalCode,
      shippingCost: state.shippingCost ?? getShippingCost(state.customer.postalCode)
    });
    return true;
  };

  const renderReview = () => {
    const customer = state.customer;
    checkoutForm.hidden = true;
    reviewNode.hidden = false;
    reviewNode.innerHTML = `
      <div class="checkout-review-row">
        <span>Contacto</span>
        <strong>${escapeHtml(customer.email)}</strong>
        <button type="button" data-edit-checkout>Cambiar</button>
      </div>
      <div class="checkout-review-row">
        <span>Enviar a</span>
        <strong>${escapeHtml(customer.address)}, ${escapeHtml(customer.postalCode)} ${escapeHtml(customer.city)}</strong>
        <button type="button" data-edit-checkout>Cambiar</button>
      </div>
    `;

    reviewNode.querySelectorAll('[data-edit-checkout]').forEach((button) => {
      button.addEventListener('click', () => {
        checkoutForm.hidden = false;
        reviewNode.hidden = true;
        primaryButton.textContent = 'Continuar con el pago';
        setStep('info');
      });
    });

    primaryButton.textContent = 'Pagar';
    setStep('shipping');
  };

  const getOrderLines = () =>
    cart.map((item) => `- ${item.title} | Talle ${item.size} x${item.quantity} (${formatPrice(item.price * item.quantity)})`);

  const saveOrderLocally = (order) => {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || '[]');
      const safeOrders = Array.isArray(orders) ? orders : [];
      safeOrders.unshift(order);
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(safeOrders.slice(0, 20)));
    } catch (error) {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([order]));
    }
  };

  const notifyOrderByEmail = async (order) => {
    const body = new FormData();
    body.append('_subject', `Nueva compra Feel Nothing - ${order.id}`);
    body.append('pedido', order.id);
    body.append('cliente', `${order.customer.firstName} ${order.customer.lastName}`);
    body.append('email', order.customer.email);
    body.append('telefono', order.customer.phone);
    body.append('direccion', order.customer.address);
    body.append('codigo_postal', order.customer.postalCode);
    body.append('envio', formatPrice(order.shipping));
    body.append('total', formatPrice(order.total));
    body.append('productos', getOrderLines().join('\n'));

    try {
      await fetch(`https://formsubmit.co/ajax/${NOTIFY_EMAIL}`, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' }
      });
    } catch (error) {
      // WhatsApp remains the final handoff if email delivery is unavailable.
    }
  };

  const finishOrder = () => {
    if (!state.customer) {
      return;
    }

    const shipping = state.shippingCost ?? getShippingCost(state.customer.postalCode);
    const total = getSubtotal(cart) + shipping;
    const order = {
      id: `FN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer: state.customer,
      items: cart,
      shipping,
      total
    };
    const customerLines = [
      `Contacto: ${state.customer.email}`,
      `Nombre: ${state.customer.firstName} ${state.customer.lastName}`,
      `DNI: ${state.customer.document}`,
      `Direccion: ${state.customer.address}`,
      `CP/Ciudad: ${state.customer.postalCode} - ${state.customer.city}`,
      `Telefono: ${state.customer.phone}`
    ];
    const message = `Hola! Quiero finalizar esta compra:\n${getOrderLines().join('\n')}\n\n${customerLines.join('\n')}\n\nEnvio: ${formatPrice(shipping)}\nTotal: ${formatPrice(total)}`;

    saveOrderLocally(order);
    notifyOrderByEmail(order);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  renderItems();
  renderTotals();
  prefillCheckoutForm();

  summaryToggle?.addEventListener('click', () => {
    summaryContent.classList.toggle('is-open');
    const isOpen = summaryContent.classList.contains('is-open');
    summaryToggle.setAttribute('aria-expanded', isOpen);
  });


  shippingForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    updateShippingFromPostal(shippingInput.value);
  });

  formPostalInput?.addEventListener('change', (event) => {
    updateShippingFromPostal(event.target.value);
  });

  document.querySelectorAll('[data-checkout-login]').forEach((button) => {
    button.addEventListener('click', () => {
      const email = window.prompt(`Ingresa tu correo para continuar con ${button.dataset.checkoutLogin}:`, '');
      if (email) {
        checkoutForm.querySelector('input[name="email"]').value = email.trim();
      }
    });
  });

  primaryButton?.addEventListener('click', () => {
    if (state.step === 'info') {
      if (collectCustomer()) {
        window.location.href = 'payment.html';
      }
      return;
    }

    finishOrder();
  });
});
