const http = require('http');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');

const loadEnv = () => {
  try {
    const rawEnv = fsSync.readFileSync(path.join(__dirname, '.env'), 'utf8');
    rawEnv.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    // .env is optional; production hosts usually inject environment variables.
  }
};

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'juancrisman04@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Feel Nothing <onboarding@resend.dev>';
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ORDERS_TABLE = process.env.SUPABASE_ORDERS_TABLE || 'orders';
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4'
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const formatPrice = (value) => currencyFormatter.format(value || 0);

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const sendJson = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const ensureDatabase = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch (error) {
    await fs.writeFile(ORDERS_FILE, '[]\n', 'utf8');
  }
};

const readOrders = async () => {
  await ensureDatabase();
  try {
    const raw = await fs.readFile(ORDERS_FILE, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeOrder = async (order) => {
  const orders = await readOrders();
  orders.unshift(order);
  await fs.writeFile(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`, 'utf8');
};

const insertOrderInSupabase = async (order) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { skipped: true, reason: 'Missing Supabase credentials' };
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_ORDERS_TABLE}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      order_id: order.id,
      created_at: order.createdAt,
      customer: order.customer,
      items: order.items,
      shipping: order.shipping,
      total: order.total,
      source: order.source
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase failed: ${response.status} ${text}`);
  }

  return response.json();
};

const getOrderLines = (order) =>
  order.items.map((item) => `${item.quantity} x ${item.title} | Talle ${item.size} | ${formatPrice(item.price * item.quantity)}`);

const orderEmailHtml = (order) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.45">
    <h2>Nueva compra Feel Nothing</h2>
    <p><strong>Pedido:</strong> ${escapeHtml(order.id)}</p>
    <p><strong>Total:</strong> ${formatPrice(order.total)} | <strong>Envio:</strong> ${formatPrice(order.shipping)}</p>
    <h3>Cliente</h3>
    <p>
      ${escapeHtml(order.customer.firstName)} ${escapeHtml(order.customer.lastName)}<br>
      ${escapeHtml(order.customer.email)}<br>
      ${escapeHtml(order.customer.phone)}<br>
      DNI/Pasaporte: ${escapeHtml(order.customer.document)}
    </p>
    <h3>Direccion</h3>
    <p>
      ${escapeHtml(order.customer.address)}${order.customer.apartment ? `, ${escapeHtml(order.customer.apartment)}` : ''}<br>
      ${escapeHtml(order.customer.postalCode)} ${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.province)}, ${escapeHtml(order.customer.country)}
    </p>
    <h3>Productos</h3>
    <ul>
      ${order.items
        .map((item) => `<li>${escapeHtml(item.quantity)} x ${escapeHtml(item.title)} - Talle ${escapeHtml(item.size)} - ${formatPrice(item.price * item.quantity)}</li>`)
        .join('')}
    </ul>
  </div>
`;

const customerEmailHtml = (order) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.45">
    <h2>Gracias por tu compra en Feel Nothing</h2>
    <p>Hola ${escapeHtml(order.customer.firstName)}, recibimos tu pedido y ya quedo listo para coordinar por WhatsApp.</p>
    <p><strong>Pedido:</strong> ${escapeHtml(order.id)}</p>
    <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
    <p>Gracias por confiar en nosotros.</p>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  if (!RESEND_API_KEY) {
    return { skipped: true, reason: 'Missing RESEND_API_KEY' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed: ${response.status} ${text}`);
  }

  return response.json();
};

const validateOrder = (order) => {
  if (!order || typeof order !== 'object') {
    return 'Pedido invalido.';
  }

  const customer = order.customer || {};
  const requiredCustomerFields = ['email', 'firstName', 'lastName', 'document', 'address', 'postalCode', 'city', 'phone'];
  const hasMissingCustomerField = requiredCustomerFields.some((field) => !String(customer[field] || '').trim());

  if (hasMissingCustomerField) {
    return 'Faltan datos obligatorios del cliente.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return 'El correo del cliente no es valido.';
  }

  if (!/^[A-Za-zÀ-ÿÑñ\s']{2,}$/.test(customer.firstName) || !/^[A-Za-zÀ-ÿÑñ\s']{2,}$/.test(customer.lastName)) {
    return 'Nombre y apellido solo pueden contener letras.';
  }

  if (!/^\d{7,8}$/.test(String(customer.document))) {
    return 'El DNI debe tener 7 u 8 numeros.';
  }

  if (!/^\d{4,8}$/.test(String(customer.postalCode))) {
    return 'El codigo postal no es valido.';
  }

  if (!/^[A-Za-zÀ-ÿÑñ\s']{2,}$/.test(customer.city)) {
    return 'La ciudad solo puede contener letras.';
  }

  if (!/^\d{10}$/.test(String(customer.phone))) {
    return 'El telefono debe tener 10 numeros.';
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return 'El pedido no tiene productos.';
  }

  const hasInvalidItems = order.items.some((item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    return !item.title || !item.size || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0;
  });

  if (hasInvalidItems) {
    return 'Hay productos invalidos en el pedido.';
  }

  return '';
};

const handleOrder = async (req, res) => {
  try {
    const body = await readBody(req);
    const incomingOrder = JSON.parse(body || '{}');
    const validationError = validateOrder(incomingOrder);

    if (validationError) {
      sendJson(res, 400, { ok: false, error: validationError });
      return;
    }

    const order = {
      ...incomingOrder,
      id: incomingOrder.id || `FN-${Date.now()}`,
      createdAt: incomingOrder.createdAt || new Date().toISOString(),
      source: 'web-checkout'
    };

    await writeOrder(order);

    const supabaseResult = await Promise.allSettled([insertOrderInSupabase(order)]);
    const emailResults = await Promise.allSettled([
      sendEmail({
        to: OWNER_EMAIL,
        subject: `Nueva compra Feel Nothing - ${order.id}`,
        html: orderEmailHtml(order)
      }),
      sendEmail({
        to: order.customer.email,
        subject: `Gracias por tu compra - ${order.id}`,
        html: customerEmailHtml(order)
      })
    ]);

    sendJson(res, 201, {
      ok: true,
      orderId: order.id,
      supabase: {
        ok: supabaseResult[0].status === 'fulfilled',
        detail: supabaseResult[0].status === 'fulfilled' ? supabaseResult[0].value : supabaseResult[0].reason.message
      },
      emails: emailResults.map((result) => ({
        ok: result.status === 'fulfilled',
        detail: result.status === 'fulfilled' ? result.value : result.reason.message
      }))
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || 'No se pudo guardar el pedido.' });
  }
};

const serveStatic = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));

  if (!filePath.startsWith(PUBLIC_DIR) || filePath.includes(`${path.sep}.git${path.sep}`) || filePath.includes(`${path.sep}data${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    });
    res.end(file);
  } catch (error) {
    res.writeHead(404);
    res.end('Not found');
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/orders') {
    await handleOrder(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Feel Nothing running at http://localhost:${PORT}`);
});
