// ============================================
// TELEGANT — Order Tracking
// ============================================

const ORDER_STAGES = [
  {
    key: 'confirmed',
    icon: '✦',
    label: 'Order\nConfirmed',
    description: 'Your order has been received and confirmed.'
  },
  {
    key: 'fabric_sourced',
    icon: '🧵',
    label: 'Fabric\nSourced',
    description: 'Premium fabric has been selected and sent to our tailors.'
  },
  {
    key: 'tailoring',
    icon: '✂️',
    label: 'Being\nTailored',
    description: 'Your garment is being crafted to your exact specifications.'
  },
  {
    key: 'ready',
    icon: '📦',
    label: 'Ready for\nPickup',
    description: 'Your order is complete and ready for courier pickup.'
  },
  {
    key: 'on_the_way',
    icon: '🚚',
    label: 'On the\nWay',
    description: 'Your order is with the courier and on its way to you.'
  },
  {
    key: 'delivered',
    icon: '🏠',
    label: 'Delivered',
    description: 'Your order has been delivered. Enjoy!'
  }
];

function trackOrder() {
  const input = document.getElementById('order-input').value.trim().toUpperCase();
  if (!input) { showToast('Please enter an order number', 'error'); return; }

  // First: try localStorage (demo orders)
  const orders = JSON.parse(localStorage.getItem('telegant_orders') || '[]');
  const order = orders.find(o => o.orderNumber.toUpperCase() === input);

  document.getElementById('tracking-result').classList.add('hidden');
  document.getElementById('not-found').classList.add('hidden');

  if (order) {
    displayTracking(order);
  } else {
    // ── TODO: Query your backend API ──
    // fetch(`https://your-api.com/api/orders/${input}`)
    //   .then(r => r.json())
    //   .then(data => { if (data.order) displayTracking(data.order); else showNotFound(); })
    //   .catch(() => showNotFound());
    showNotFound();
  }
}

function showNotFound() {
  document.getElementById('not-found').classList.remove('hidden');
}

function displayTracking(order) {
  // Order Info
  document.getElementById('tr-order-number').textContent = order.orderNumber;
  document.getElementById('tr-name').textContent = order.name;
  document.getElementById('tr-date').textContent = formatDate(order.createdAt);
  document.getElementById('tr-payment').textContent = order.payment === 'instapay' ? 'Instapay' : 'Cash on Delivery';
  document.getElementById('tr-total').textContent = order.total.toLocaleString() + ' EGP';
  document.getElementById('tr-status-badge').textContent = getStatusLabel(order.status);

  // Render journey
  renderJourney(order);

  // Render items
  const itemsEl = document.getElementById('tr-items');
  itemsEl.innerHTML = (order.items || []).map(item => `
    <div class="track-item">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='../images/placeholder.png'">
      <div class="track-item-info">
        <h4>${item.name}</h4>
        <p>Size: ${item.size} · Chest: ${item.chest} · Sleeve: ${item.sleeve} · Qty: ${item.qty}</p>
      </div>
      <span class="track-item-price">${item.total.toLocaleString()} EGP</span>
    </div>
  `).join('');

  document.getElementById('tracking-result').classList.remove('hidden');

  // Animate in
  setTimeout(() => animateJourney(order.status), 100);
}

function renderJourney(order) {
  const stepsEl = document.getElementById('journey-steps');
  const history = order.statusHistory || [];

  stepsEl.innerHTML = ORDER_STAGES.map(stage => {
    const histEntry = history.find(h => h.stage === stage.key);
    return `
      <div class="journey-step" id="step-${stage.key}">
        <div class="step-node">${stage.icon}</div>
        <span class="step-label">${stage.label.replace('\n', '<br>')}</span>
        <span class="step-time">${histEntry ? formatDateTime(histEntry.timestamp) : ''}</span>
      </div>
    `;
  }).join('');
}

function animateJourney(currentStatus) {
  const currentIdx = ORDER_STAGES.findIndex(s => s.key === currentStatus);
  if (currentIdx === -1) return;

  // Fill line
  const fillPct = currentIdx === 0 ? 0
    : Math.round((currentIdx / (ORDER_STAGES.length - 1)) * 100);
  document.getElementById('journey-line-fill').style.width = fillPct + '%';

  // Animate steps one by one
  ORDER_STAGES.forEach((stage, i) => {
    const stepEl = document.getElementById(`step-${stage.key}`);
    if (!stepEl) return;
    setTimeout(() => {
      if (i < currentIdx) stepEl.classList.add('completed');
      else if (i === currentIdx) stepEl.classList.add('active');
    }, i * 200);
  });
}

function getStatusLabel(status) {
  const s = ORDER_STAGES.find(st => st.key === status);
  return s ? s.label.replace('\n', ' ') : status;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Auto-load from URL param
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const orderNum = params.get('order');
  if (orderNum) {
    document.getElementById('order-input').value = orderNum;
    trackOrder();
  }
  updateCartCount();
});