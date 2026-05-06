// ============================================
// TELEGANT SHOP — Full Buy Now Flow
// ============================================

const PRODUCTS = [
  { id: 1, name: 'Mock Neck — Navy',  price: 600, image: 'New-navy.png',  color: 'navy' },
  { id: 2, name: 'Mock Neck — White', price: 600, image: 'New-white.png', color: 'white' },
  { id: 3, name: 'Mock Neck — Grey',  price: 600, image: 'New-grey.png',  color: 'grey' },
  { id: 4, name: 'Mock Neck — Black', price: 600, image: 'New-black.png', color: 'black' },
  { id: 5, name: 'Mock Neck — Red',   price: 600, image: 'New-red.png',   color: 'red' },
];

const SIZE_MEASUREMENTS = {
  XS: { chest: '86cm', sleeve: '59cm', length: '65cm' },
  S:  { chest: '91cm', sleeve: '61cm', length: '68cm' },
  M:  { chest: '97cm', sleeve: '63cm', length: '71cm' },
  L:  { chest: '102cm',sleeve: '65cm', length: '74cm' },
  XL: { chest: '107cm',sleeve: '67cm', length: '77cm' },
};

// State
let currentProduct = null;
let currentQty = 1;
let currentSizeMode = 'standard';
let selectedSize = null;
let pendingCartItem = null;

// ── RENDER PRODUCTS ──
function renderProducts() {
  const container = document.getElementById('products-container');
  container.innerHTML = PRODUCTS.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='../images/placeholder.png'">
      <div class="product-info">
        <h3>${p.name}</h3>
        <span class="price">${p.price.toLocaleString()} EGP</span>
        <button class="btn-dark" onclick="openProductModal(${p.id})">BUY NOW</button>
      </div>
    </div>
  `).join('');
}

// ── MODAL: OPEN PRODUCT ──
function openProductModal(productId) {
  currentProduct = PRODUCTS.find(p => p.id === productId);
  currentQty = 1;
  selectedSize = null;
  currentSizeMode = 'standard';

  document.getElementById('pm-product-img').src = currentProduct.image;
  document.getElementById('pm-product-name').textContent = currentProduct.name;
  document.getElementById('pm-product-price').textContent = currentProduct.price.toLocaleString() + ' EGP';
  document.getElementById('qty-display').textContent = 1;
  document.getElementById('custom-product-img').src = currentProduct.image;

  // Reset selections
  document.querySelectorAll('.size-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('custom-chest').value = '';
  document.getElementById('custom-sleeve').value = '';
  document.getElementById('custom-length').value = '';
  switchSizeMode('standard');

  openModal('product-modal');
}

// ── QUANTITY ──
function changeQty(delta) {
  currentQty = Math.max(1, Math.min(99, currentQty + delta));
  document.getElementById('qty-display').textContent = currentQty;
}

// ── SIZE MODE ──
function switchSizeMode(mode) {
  currentSizeMode = mode;
  document.querySelectorAll('.size-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  document.getElementById('standard-sizes').classList.toggle('hidden', mode !== 'standard');
  document.getElementById('custom-size').classList.toggle('hidden', mode !== 'custom');
}

function selectSize(size) {
  selectedSize = size;
  document.querySelectorAll('.size-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.size === size);
  });
}

// ── PROCEED TO CONFIRMATION ──
function proceedToConfirm() {
  let chest, sleeve, length, sizeLabel;

  if (currentSizeMode === 'standard') {
    if (!selectedSize) { showToast('Please select a size', 'error'); return; }
    const m = SIZE_MEASUREMENTS[selectedSize];
    chest = m.chest; sleeve = m.sleeve; length = m.length;
    sizeLabel = selectedSize;
  } else {
    chest  = document.getElementById('custom-chest').value;
    sleeve = document.getElementById('custom-sleeve').value;
    length = document.getElementById('custom-length').value;
    if (!chest || !sleeve || !length) { showToast('Please fill in all measurements', 'error'); return; }
    chest += 'cm'; sleeve += 'cm'; length += 'cm';
    sizeLabel = 'Custom';
  }

  const total = currentProduct.price * currentQty;

  // Populate confirmation modal
  document.getElementById('confirm-img').src = currentProduct.image;
  document.getElementById('confirm-name').textContent = currentProduct.name;
  document.getElementById('confirm-price').textContent = currentProduct.price.toLocaleString() + ' EGP each';
  document.getElementById('confirm-size').textContent = sizeLabel;
  document.getElementById('confirm-qty').textContent = currentQty;
  document.getElementById('confirm-chest').textContent = chest;
  document.getElementById('confirm-sleeve').textContent = sleeve;
  document.getElementById('confirm-length').textContent = length;
  document.getElementById('confirm-total').textContent = total.toLocaleString() + ' EGP';

  pendingCartItem = {
    productId: currentProduct.id,
    name: currentProduct.name,
    price: currentProduct.price,
    image: currentProduct.image,
    qty: currentQty,
    size: sizeLabel,
    chest, sleeve, length,
    total
  };

  closeModal('product-modal');
  openModal('confirm-modal');
}

// ── ADD TO CART ──
function addToCart() {
  if (!pendingCartItem) return;
  const cart = getCart();
  cart.push({ ...pendingCartItem, cartId: Date.now() });
  saveCart(cart);
  updateCartCount();
  closeModal('confirm-modal');
  showToast('Added to cart!', 'success');
  pendingCartItem = null;
}

// ── CHECKOUT ──
function proceedToCheckout() {
  if (!pendingCartItem) return;
  const user = getUser();
  if (!user) {
    // Show auth modal first, then redirect to checkout after login
    sessionStorage.setItem('telegant_pending_action', 'checkout');
    closeModal('confirm-modal');
    openModal('auth-modal');
  } else {
    // Add to cart and go to checkout
    addToCart();
    window.location.href = 'checkout.html';
  }
}

function goToCheckout() {
  const user = getUser();
  closeModal('cart-modal');
  if (!user) {
    sessionStorage.setItem('telegant_pending_action', 'checkout');
    openModal('auth-modal');
  } else {
    window.location.href = 'checkout.html';
  }
}

// ── CART MODAL ──
function openCartModal() {
  const cart = getCart();
  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    list.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
    footer.style.display = 'none';
  } else {
    list.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='../images/placeholder.png'">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>Size: ${item.size} · Qty: ${item.qty}</p>
        </div>
        <span class="cart-item-price">${item.total.toLocaleString()} EGP</span>
        <button class="cart-item-remove" onclick="removeFromCart(${item.cartId})">✕</button>
      </div>
    `).join('');

    const total = cart.reduce((s, i) => s + i.total, 0);
    document.getElementById('cart-total-display').textContent = total.toLocaleString() + ' EGP';
    footer.style.display = 'block';
  }

  openModal('cart-modal');
}

function removeFromCart(cartId) {
  const cart = getCart().filter(i => i.cartId !== cartId);
  saveCart(cart);
  updateCartCount();
  openCartModal(); // refresh
}

// ── AUTH ──
function switchAuth(mode) {
  document.getElementById('signin-form').classList.toggle('hidden', mode !== 'signin');
  document.getElementById('signup-form').classList.toggle('hidden', mode !== 'signup');
  document.getElementById('signin-tab').classList.toggle('active', mode === 'signin');
  document.getElementById('signup-tab').classList.toggle('active', mode === 'signup');
}

async function signIn() {
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;
  if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }

  try {
    // ── TODO: Replace URL with your backend API ──
    // const res = await fetch('https://your-api.com/api/auth/signin', {
    //   method: 'POST', headers: {'Content-Type':'application/json'},
    //   body: JSON.stringify({ email, password })
    // });
    // const data = await res.json();
    // if (!res.ok) throw new Error(data.message);
    // localStorage.setItem('telegant_user', JSON.stringify(data.user));
    // localStorage.setItem('telegant_token', data.token);

    // Simulated login for demo
    const fakeUser = { name: 'Demo User', email };
    localStorage.setItem('telegant_user', JSON.stringify(fakeUser));

    closeModal('auth-modal');
    const action = sessionStorage.getItem('telegant_pending_action');
    if (action === 'checkout') {
      sessionStorage.removeItem('telegant_pending_action');
      if (pendingCartItem) addToCart();
      window.location.href = 'checkout.html';
    } else {
      showToast(`Welcome back!`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Sign in failed', 'error');
  }
}

async function signUp() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  if (!name || !email || !pass) { showToast('Please fill in all fields', 'error'); return; }
  if (pass.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }

  try {
    // ── TODO: Replace with your backend API ──
    // const res = await fetch('https://your-api.com/api/auth/signup', {
    //   method: 'POST', headers: {'Content-Type':'application/json'},
    //   body: JSON.stringify({ name, email, password: pass })
    // });
    // const data = await res.json();
    // if (!res.ok) throw new Error(data.message);
    // localStorage.setItem('telegant_user', JSON.stringify(data.user));
    // localStorage.setItem('telegant_token', data.token);

    const fakeUser = { name, email };
    localStorage.setItem('telegant_user', JSON.stringify(fakeUser));

    closeModal('auth-modal');
    const action = sessionStorage.getItem('telegant_pending_action');
    if (action === 'checkout') {
      sessionStorage.removeItem('telegant_pending_action');
      if (pendingCartItem) addToCart();
      window.location.href = 'checkout.html';
    } else {
      showToast(`Welcome to TELEGANT, ${name}!`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Sign up failed', 'error');
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartCount();
});