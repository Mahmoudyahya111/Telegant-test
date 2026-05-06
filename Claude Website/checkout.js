// ============================================
// TELEGANT — Checkout JS
// ============================================

let currentOrderNum = null;
let screenshotFile = null;

// ── RENDER ORDER SUMMARY ──
function renderSummary() {
  const cart = getCart();
  const container = document.getElementById('summary-items');
  if (!cart.length) {
    container.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center;padding:20px">Your cart is empty</p>';
    return;
  }
  container.innerHTML = cart.map(item => `
    <div class="summary-item">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='../images/placeholder.png'">
      <div class="summary-item-info">
        <h4>${item.name}</h4>
        <p>Size: ${item.size} · Qty: ${item.qty}</p>
        <p>Chest: ${item.chest} · Sleeve: ${item.sleeve}</p>
      </div>
      <span class="summary-item-price">${item.total.toLocaleString()} EGP</span>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  document.getElementById('summary-subtotal').textContent = subtotal.toLocaleString() + ' EGP';
  document.getElementById('summary-total').textContent = subtotal.toLocaleString() + ' EGP';
}

// ── PRE-FILL USER DATA ──
function prefillUser() {
  const user = getUser();
  if (user) {
    if (user.email) document.getElementById('co-email').value = user.email;
    if (user.name) document.getElementById('co-name').value = user.name;
  }
}

// ── PAYMENT TOGGLE ──
function handlePaymentChange() {
  const instapay = document.getElementById('pay-instapay').checked;
  document.getElementById('instapay-section').classList.toggle('hidden', !instapay);
}

// ── SCREENSHOT UPLOAD ──
function handleScreenshot(input) {
  if (!input.files[0]) return;
  screenshotFile = input.files[0];
  if (screenshotFile.size > 5 * 1024 * 1024) {
    showToast('File too large. Max 5MB.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('screenshot-preview');
    preview.innerHTML = `<img src="${e.target.result}" alt="Transfer Screenshot">`;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(screenshotFile);
}

// ── GENERATE ORDER NUMBER ──
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `TLG-${year}${month}-${rand}`;
}

// ── PLACE ORDER ──
async function placeOrder() {
  // Validate fields
  const name    = document.getElementById('co-name').value.trim();
  const email   = document.getElementById('co-email').value.trim();
  const phone   = document.getElementById('co-phone').value.trim();
  const address = document.getElementById('co-address').value.trim();
  const city    = document.getElementById('co-city').value.trim();
  const notes   = document.getElementById('co-notes').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;

  if (!name || !email || !phone || !address || !city) {
    showToast('Please fill in all required fields', 'error'); return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast('Please enter a valid email', 'error'); return;
  }
  if (payment === 'instapay' && !screenshotFile) {
    showToast('Please upload your Instapay transfer screenshot', 'error'); return;
  }

  const cart = getCart();
  if (!cart.length) {
    showToast('Your cart is empty', 'error'); return;
  }

  const btn = document.getElementById('place-order-btn');
  btn.textContent = 'PLACING ORDER...';
  btn.disabled = true;

  try {
    const orderNum = generateOrderNumber();
    currentOrderNum = orderNum;

    const formData = new FormData();
    formData.append('orderNumber', orderNum);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('address', `${address}, ${city}`);
    formData.append('notes', notes);
    formData.append('payment', payment);
    formData.append('items', JSON.stringify(cart));
    formData.append('total', cart.reduce((s, i) => s + i.total, 0));
    if (screenshotFile) formData.append('screenshot', screenshotFile);

    // ── TODO: Replace with your backend API URL ──
    // const res = await fetch('https://your-api.com/api/orders', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${getToken()}` },
    //   body: formData
    // });
    // const data = await res.json();
    // if (!res.ok) throw new Error(data.message);
    // currentOrderNum = data.orderNumber;

    // Simulated success — store order locally for tracking demo
    const order = {
      orderNumber: orderNum, name, email, phone,
      address: `${address}, ${city}`, notes, payment,
      items: cart, total: cart.reduce((s, i) => s + i.total, 0),
      status: 'confirmed',
      statusHistory: [
        { stage: 'confirmed', label: 'Order Confirmed', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    };
    // Save to localStorage for demo tracking
    const orders = JSON.parse(localStorage.getItem('telegant_orders') || '[]');
    orders.push(order);
    localStorage.setItem('telegant_orders', JSON.stringify(orders));

    // Clear cart
    saveCart([]);
    updateCartCount();

    // Show success
    document.getElementById('success-order-number').textContent = currentOrderNum;
    if (payment === 'instapay') {
      document.getElementById('instapay-note').style.display = 'block';
    }
    openModal('success-modal');

  } catch (err) {
    showToast(err.message || 'Failed to place order. Please try again.', 'error');
    btn.textContent = 'PLACE ORDER';
    btn.disabled = false;
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  prefillUser();
  updateCartCount();
});