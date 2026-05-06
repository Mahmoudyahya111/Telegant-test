// ============================================
// TELEGANT BACKEND — server.js
// Node.js + Express
//
// SETUP INSTRUCTIONS:
//   1. npm install
//   2. Copy .env.example to .env and fill in values
//   3. node server.js  (or: npm start)
//
// ============================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const nodemailer = require('nodemailer');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── FILE UPLOAD (Instapay Screenshots) ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'screenshots');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2,9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ── SIMPLE IN-MEMORY DB (Replace with MongoDB/PostgreSQL) ──
// TODO: Replace this with a real database
// Recommended: MongoDB with Mongoose, or PostgreSQL with pg/Prisma
const db = {
  users: [],
  orders: []
};

// ── EMAIL TRANSPORTER ──
// TODO: Fill in your email credentials in .env
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'outlook', etc.
  auth: {
    user: process.env.EMAIL_USER,   // your-email@gmail.com
    pass: process.env.EMAIL_PASS    // App password (not your regular password)
  }
});

// ── ORDER NUMBER GENERATOR ──
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `TLG-${year}${month}-${rand}`;
}

// ── SEND ORDER CONFIRMATION EMAIL ──
async function sendOrderConfirmationEmail(order) {
  const itemsList = order.items.map(item =>
    `• ${item.name} — Size: ${item.size} — Qty: ${item.qty} — ${item.total.toLocaleString()} EGP`
  ).join('\n');

  const isInstapay = order.payment === 'instapay';

  const mailOptions = {
    from: `TELEGANT <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: `TELEGANT — Order Confirmed: ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="background:#0d0d0d;color:#ffffff;font-family:'Times New Roman',serif;margin:0;padding:0;">
        <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
          
          <div style="text-align:center;border-bottom:1px solid rgba(200,168,106,0.3);padding-bottom:28px;margin-bottom:32px;">
            <h1 style="color:#c8a86a;font-size:1.8rem;font-weight:400;letter-spacing:0.15em;margin:0">TELEGANT</h1>
            <p style="color:rgba(255,255,255,0.4);font-size:0.7rem;letter-spacing:0.2em;margin:4px 0 0">DEFINED BY ELEGANCE</p>
          </div>

          <h2 style="color:#ffffff;font-weight:400;font-size:1.3rem;margin-bottom:8px">Thank you for your order, ${order.name}!</h2>
          <p style="color:rgba(255,255,255,0.5);font-size:0.9rem;margin-bottom:28px">Your order has been received and is being processed.</p>

          <div style="background:rgba(200,168,106,0.08);border:1px solid rgba(200,168,106,0.3);border-radius:12px;padding:24px;margin-bottom:24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:0.7rem;letter-spacing:0.15em;margin:0 0 6px">ORDER NUMBER</p>
            <h3 style="color:#c8a86a;font-size:1.6rem;font-weight:400;letter-spacing:0.1em;margin:0">${order.orderNumber}</h3>
          </div>

          <div style="margin-bottom:24px;">
            <h4 style="color:#c8a86a;font-size:0.7rem;letter-spacing:0.15em;font-weight:400;margin-bottom:12px">ORDER ITEMS</h4>
            <pre style="color:rgba(255,255,255,0.7);font-size:0.85rem;font-family:'Times New Roman',serif;line-height:1.8;margin:0;white-space:pre-wrap">${itemsList}</pre>
          </div>

          <div style="border-top:1px solid rgba(200,168,106,0.2);padding-top:16px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="color:rgba(255,255,255,0.5);font-size:0.85rem">Payment</span>
              <span style="color:#ffffff;font-size:0.85rem">${isInstapay ? 'Instapay Transfer' : 'Cash on Delivery'}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:#c8a86a;font-size:0.9rem;letter-spacing:0.1em">TOTAL</span>
              <span style="color:#c8a86a;font-size:0.9rem;font-weight:600">${order.total.toLocaleString()} EGP</span>
            </div>
          </div>

          ${isInstapay ? `
          <div style="background:rgba(200,168,106,0.05);border:1px solid rgba(200,168,106,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
            <p style="color:rgba(200,168,106,0.8);font-size:0.8rem;margin:0">⏳ Your Instapay transfer is being verified. This may take a few minutes. We'll notify you once confirmed.</p>
          </div>
          ` : ''}

          <div style="text-align:center;margin-bottom:28px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost'}/pages/track.html?order=${order.orderNumber}" 
               style="background:#c8a86a;color:#0d0d0d;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:0.82rem;letter-spacing:0.12em;display:inline-block;">
              TRACK MY ORDER
            </a>
          </div>

          <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;text-align:center;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
            Delivery Address: ${order.address}<br>
            Questions? mahmoudyahya66@gmail.com · +20 110 163 2040
          </p>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${order.email}`);
  } catch (err) {
    console.error('Failed to send email:', err.message);
    // Don't throw — order still placed even if email fails
  }
}

// ══════════════════════════════════════
//  AUTH ROUTES
// ══════════════════════════════════════

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be 8+ characters' });

    const exists = db.users.find(u => u.email === email.toLowerCase());
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      name, email: email.toLowerCase(),
      password: hashed,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'telegant_secret', { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'telegant_secret', { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── AUTH MIDDLEWARE ──
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Unauthorized' });
  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'telegant_secret');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ══════════════════════════════════════
//  ORDER ROUTES
// ══════════════════════════════════════

// POST /api/orders — Place an order
app.post('/api/orders', upload.single('screenshot'), async (req, res) => {
  try {
    const { name, email, phone, address, notes, payment, items, total } = req.body;

    // Validate
    if (!name || !email || !phone || !address || !items) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (payment === 'instapay' && !req.file) {
      return res.status(400).json({ message: 'Instapay screenshot required' });
    }

    const parsedItems = JSON.parse(items);
    const orderNumber = generateOrderNumber();

    const order = {
      orderNumber,
      name, email, phone, address, notes,
      payment,
      items: parsedItems,
      total: parseFloat(total),
      screenshotPath: req.file ? req.file.path : null,
      status: 'confirmed',
      statusHistory: [
        { stage: 'confirmed', label: 'Order Confirmed', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    };

    db.orders.push(order);

    // Send confirmation email
    await sendOrderConfirmationEmail(order);

    res.json({ orderNumber, message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to place order' });
  }
});

// GET /api/orders/:orderNumber — Get order status (public)
app.get('/api/orders/:orderNumber', (req, res) => {
  const order = db.orders.find(o => o.orderNumber === req.params.orderNumber.toUpperCase());
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Return order without sensitive data
  const { screenshotPath, ...safeOrder } = order;
  res.json({ order: safeOrder });
});

// PATCH /api/orders/:orderNumber/status — Update order status (admin)
// TODO: Add proper admin authentication
app.patch('/api/orders/:orderNumber/status', (req, res) => {
  const { status, adminKey } = req.body;
  
  // TODO: Replace this with proper admin auth middleware
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const validStatuses = ['confirmed','fabric_sourced','tailoring','ready','on_the_way','delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const order = db.orders.find(o => o.orderNumber === req.params.orderNumber.toUpperCase());
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status;
  order.statusHistory.push({
    stage: status,
    label: status.replace(/_/g, ' '),
    timestamp: new Date().toISOString()
  });

  // Send status update email
  // TODO: Create a status update email template similar to sendOrderConfirmationEmail

  res.json({ message: 'Status updated', order });
});

// GET /api/orders — List all orders (admin)
app.get('/api/orders', (req, res) => {
  const { adminKey } = req.query;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ orders: db.orders });
});

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── START ──
app.listen(PORT, () => {
  console.log(`\n✦ TELEGANT API running on http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;