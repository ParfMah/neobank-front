/**
 * MAIN.JS — Utilitaires globaux NeoBank
 * Toast, navbar scroll, animations, PWA
 */

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="font-size:16px">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── NAVBAR SCROLL ────────────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar-scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ─── MENU MOBILE ──────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    const isOpen = navLinks?.classList.toggle('nav-links-open');
    navToggle.classList.toggle('active', isOpen);
  });

  // Fermer le menu quand on clique sur un lien
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelector('.nav-links')?.classList.remove('nav-links-open');
      navToggle.classList.remove('active');
    });
  });
}

// ─── FORMATER LES MONTANTS ────────────────────────────────────
function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

function formatDateTime(dateStr) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

// ─── BADGE STATUT ─────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    pending:   { class: 'badge-warning', label: 'En attente' },
    approved:  { class: 'badge-info',    label: 'Approuvé' },
    active:    { class: 'badge-success', label: 'Actif' },
    paid:      { class: 'badge-success', label: 'Remboursé' },
    rejected:  { class: 'badge-danger',  label: 'Rejeté' },
    defaulted: { class: 'badge-danger',  label: 'En défaut' },
    completed: { class: 'badge-success', label: 'Complété' },
    failed:    { class: 'badge-danger',  label: 'Échoué' },
    cancelled: { class: 'badge-neutral', label: 'Annulé' },
    suspended: { class: 'badge-danger',  label: 'Suspendu' },
    frozen:    { class: 'badge-warning', label: 'Gelé' },
    closed:    { class: 'badge-neutral', label: 'Fermé' }
  };
  const s = map[status] || { class: 'badge-neutral', label: status };
  return `<span class="badge ${s.class}">${s.label}</span>`;
}

// ─── ICÔNE TYPE TRANSACTION ───────────────────────────────────
function txIcon(type) {
  const icons = {
    deposit: '↓', withdrawal: '↑', transfer_in: '←', transfer_out: '→',
    loan_disbursement: '💰', loan_repayment: '📅', fee: '⚡',
    interest: '📈', refund: '↩', admin_credit: '✚', admin_debit: '✖',
    card_payment: '💳', card_refund: '↩'
  };
  return icons[type] || '•';
}

// ─── DEBOUNCE ─────────────────────────────────────────────────
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ─── PWA INSTALL ──────────────────────────────────────────────
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('pwaInstall');
  if (btn) {
    btn.style.fontWeight = '600';
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') showToast('Application installée !', 'success');
        deferredPrompt = null;
      }
    });
  }
});

// Store buttons → message informatif
['appStoreBtn', 'googlePlayBtn'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Application mobile bientôt disponible ! Utilisez la PWA en attendant.', 'info', 5000);
  });
});

// Exporter en global
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.statusBadge = statusBadge;
window.txIcon = txIcon;
window.debounce = debounce;

// ─── ENREGISTREMENT SERVICE WORKER (PWA) ─────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../sw.js')
      .then(reg => console.log('SW enregistré:', reg.scope))
      .catch(err => console.warn('SW non enregistré:', err));
  });
}
