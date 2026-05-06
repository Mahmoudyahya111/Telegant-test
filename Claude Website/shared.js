// ============================================
// TELEGANT — Shared JavaScript
// ============================================

// ── NAVBAR HAMBURGER ──
window.addEventListener('load', () => {
  const menuBtn = document.getElementById('menu-btn');
  const navMenu = document.getElementById('nav-menu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('show');
      }
    });
  }
});

// ── MODAL HELPERS ──
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── CART STORAGE ──
function getCart() {
  try { return JSON.parse(localStorage.getItem('telegant_cart') || '[]'); } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('telegant_cart', JSON.stringify(cart));
}
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ── USER STORAGE ──
function getUser() {
  try { return JSON.parse(localStorage.getItem('telegant_user')); } catch { return null; }
}
function getToken() {
  return localStorage.getItem('telegant_token');
}
function logout() {
  localStorage.removeItem('telegant_user');
  localStorage.removeItem('telegant_token');
  window.location.reload();
}