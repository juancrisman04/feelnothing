document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'feelnothing-cart';
  const CHECKOUT_STORAGE_KEY = 'feelnothing-checkout';
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
        if (item.image && item.image.includes('imgremeras/')) {
          item.image = item.image.replace(/ /g, '-');
        }
        return item;
      });
    } catch (error) {
      return [];
    }
  };

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
  const savedCheckout = readCheckout();
  const state = {
    shippingCost: savedCheckout.shippingCost ?? null,
    postalCode: savedCheckout.postalCode || savedCheckout.customer?.postalCode || '',
    customer: savedCheckout.customer || null
  };

  const root = document.querySelector('[data-checkout-root]');
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
  const primaryButton = document.querySelector('[data-checkout-primary]');

  if (!cart.length) {
    root.innerHTML = `
      <div class="checkout-empty">
        <img src="img/logo.png" alt="Feel Nothing">
        <h1>Tu carrito esta vacio</h1>
        <a href="index.html#products">Ver productos</a>
      </div>
    `;
    return;
  }

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

  const updateShippingFromPostal = (postalCode) => {
    const normalized = normalizePostalCode(postalCode);
    if (!normalized) {
      state.shippingCost = null;
      state.postalCode = '';
      if (shippingMessage) shippingMessage.textContent = 'Ingresa tu codigo postal para calcular el envio.';
      renderTotals();
      return;
    }

    state.postalCode = normalized;
    state.shippingCost = getShippingCost(normalized);
    if (shippingInput) shippingInput.value = normalized;
    if (formPostalInput && formPostalInput.value !== normalized) formPostalInput.value = normalized;
    if (shippingMessage) {
      shippingMessage.textContent = FUNES_POSTAL_CODES.has(normalized)
        ? 'Envio a Funes: $2.000'
        : 'Envio a Rosario u otra zona: $5.000';
    }
    renderTotals();
  };

  const prefillCheckoutForm = () => {
    if (!state.customer || !checkoutForm) return;

    Object.entries(state.customer).forEach(([key, value]) => {
      const field = checkoutForm.elements[key];
      if (field && typeof value !== 'boolean') field.value = value || '';
    });

    if (state.postalCode) updateShippingFromPostal(state.postalCode);
  };

  const lettersPattern = /^[A-Za-z\u00C0-\u00FF\u00D1\u00F1\s']{2,}$/;
  const fieldRules = {
    email: {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Ingresa un correo valido.'
    },
    firstName: {
      test: (value) => lettersPattern.test(value),
      message: 'El nombre solo puede tener letras.'
    },
    lastName: {
      test: (value) => lettersPattern.test(value),
      message: 'El apellido solo puede tener letras.'
    },
    document: {
      test: (value) => /^\d{7,8}$/.test(value),
      message: 'Ingresa un DNI valido, solo numeros.'
    },
    address: {
      test: (value) => value.length >= 4,
      message: 'Ingresa una direccion completa.'
    },
    postalCode: {
      test: (value) => /^\d{4,8}$/.test(value),
      message: 'El codigo postal solo puede tener numeros.'
    },
    city: {
      test: (value) => lettersPattern.test(value),
      message: 'La ciudad solo puede tener letras.'
    },
    phone: {
      test: (value) => /^\d{10}$/.test(value),
      message: 'Ingresa 10 numeros, sin 0 ni 15.'
    }
  };

  const inputSanitizers = {
    firstName: (value) => value.replace(/[^A-Za-z\u00C0-\u00FF\u00D1\u00F1\s']/g, ''),
    lastName: (value) => value.replace(/[^A-Za-z\u00C0-\u00FF\u00D1\u00F1\s']/g, ''),
    city: (value) => value.replace(/[^A-Za-z\u00C0-\u00FF\u00D1\u00F1\s']/g, ''),
    document: (value) => value.replace(/\D/g, '').slice(0, 8),
    postalCode: (value) => value.replace(/\D/g, '').slice(0, 8),
    phone: (value) => value.replace(/\D/g, '').slice(0, 10)
  };

  const clearFieldError = (input) => {
    const container = input.closest('.checkout-full__phone-group') || input;
    container.classList.remove('is-invalid');

    const errorNode = container.nextElementSibling;
    if (errorNode?.classList.contains('checkout-field-error')) errorNode.remove();
  };

  const showFieldError = (input, message) => {
    clearFieldError(input);
    const container = input.closest('.checkout-full__phone-group') || input;
    const error = document.createElement('div');

    error.className = 'checkout-field-error';
    error.textContent = message;
    container.classList.add('is-invalid');
    container.after(error);
  };

  const validateField = (input) => {
    const value = input.value.trim();
    const rule = fieldRules[input.name];

    if (!input.required && !value) {
      clearFieldError(input);
      return true;
    }

    if (!value) {
      showFieldError(input, 'Este dato es obligatorio.');
      return false;
    }

    if (rule && !rule.test(value)) {
      showFieldError(input, rule.message);
      return false;
    }

    clearFieldError(input);
    return true;
  };

  const validateForm = () => {
    let isValid = true;
    const inputs = checkoutForm.querySelectorAll('input[required]');

    checkoutForm.querySelectorAll('.checkout-field-error').forEach((el) => el.remove());
    checkoutForm.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

    inputs.forEach((input) => {
      if (!validateField(input)) isValid = false;
    });

    if (!isValid) {
      checkoutForm.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  };

  const collectCustomer = () => {
    if (!validateForm()) return false;

    const formData = new FormData(checkoutForm);
    state.customer = {
      email: formData.get('email')?.trim(),
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      document: formData.get('document')?.trim(),
      address: formData.get('address')?.trim(),
      postalCode: formData.get('postalCode')?.trim(),
      city: formData.get('city')?.trim(),
      phone: formData.get('phone')?.trim()
    };

    updateShippingFromPostal(state.customer.postalCode);
    writeCheckout({
      customer: state.customer,
      postalCode: state.postalCode || state.customer.postalCode,
      shippingCost: state.shippingCost ?? getShippingCost(state.customer.postalCode)
    });
    return true;
  };

  renderItems();
  renderTotals();
  prefillCheckoutForm();

  summaryToggle?.addEventListener('click', () => {
    summaryContent.classList.toggle('is-open');
    summaryToggle.setAttribute('aria-expanded', summaryContent.classList.contains('is-open'));
  });

  shippingForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    updateShippingFromPostal(shippingInput.value);
  });

  formPostalInput?.addEventListener('change', (event) => {
    updateShippingFromPostal(event.target.value);
  });

  checkoutForm?.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const sanitizer = inputSanitizers[input.name];
      if (sanitizer) {
        const nextValue = sanitizer(input.value);
        if (nextValue !== input.value) input.value = nextValue;
      }

      if (input.classList.contains('is-invalid') || input.closest('.checkout-full__phone-group')?.classList.contains('is-invalid')) {
        validateField(input);
      }
    });

    input.addEventListener('blur', () => {
      if (input.required || input.value.trim()) validateField(input);
    });
  });

  document.querySelectorAll('[data-checkout-login]').forEach((button) => {
    button.addEventListener('click', () => {
      const email = window.prompt(`Ingresa tu correo para continuar con ${button.dataset.checkoutLogin}:`, '');
      if (email) checkoutForm.querySelector('input[name="email"]').value = email.trim();
    });
  });

  primaryButton?.addEventListener('click', () => {
    if (collectCustomer()) window.location.href = 'payment.html';
  });
});
