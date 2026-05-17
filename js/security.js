/**
 * SÉCURITÉ FRONTEND — NeoBank
 * Gestion CSRF, détection environnement, protection formulaires
 */

const Security = {
  csrfToken: null,

  // ─── Initialisation ────────────────────────────────────────
  async init() {
    await this.fetchCsrfToken();
    this.enforceHttps();
    this.detectDevTools();
    this.protectForms();
    this.monitorActivity();
  },

  // ─── Récupérer le token CSRF via un GET ───────────────────
  async fetchCsrfToken() {
    try {
      const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api/v1'
        : 'https://neobank-backend-n749.onrender.com/api/v1';
      const res = await fetch(`${baseUrl}/health`);
      const token = res.headers.get('X-CSRF-Token');
      if (token) {
        this.csrfToken = token;
        // L'injecter automatiquement dans tous les appels API
        if (window.API) {
          const origRequest = window.API.request.bind(window.API);
          window.API.request = async function(method, endpoint, body, auth) {
            const headers = {};
            if (!['GET','HEAD','OPTIONS'].includes(method) && Security.csrfToken) {
              headers['X-CSRF-Token'] = Security.csrfToken;
            }
            return origRequest(method, endpoint, body, auth);
          };
        }
      }
    } catch { /* silencieux */ }
  },

  // ─── Forcer HTTPS en production ───────────────────────────
  enforceHttps() {
    if (location.protocol === 'http:' && !location.hostname.includes('localhost') &&
        !location.hostname.includes('127.0.0.1')) {
      location.replace(location.href.replace('http:', 'https:'));
    }
  },

  // ─── Détection DevTools (avertissement) ───────────────────
  detectDevTools() {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProduction) return;
    const threshold = 160;
    const check = () => {
      if (window.outerWidth - window.innerWidth > threshold ||
          window.outerHeight - window.innerHeight > threshold) {
        console.warn('%c⚠ NeoBank Security', 'color:red;font-size:20px;font-weight:bold');
        console.warn('%cN\'entrez jamais de code dans cette console. Les attaques XSS peuvent voler vos données.', 'font-size:14px');
      }
    };
    window.addEventListener('resize', check);
  },

  // ─── Protéger les formulaires contre la soumission multiple ─
  protectForms() {
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const btn  = form.querySelector('[type="submit"]');
      if (!btn || btn.dataset.submitting === 'true') return;
      btn.dataset.submitting = 'true';
      // Réactiver après 5 secondes (failsafe)
      setTimeout(() => { btn.dataset.submitting = 'false'; }, 5000);
    });
  },

  // ─── Déconnexion automatique après inactivité ─────────────
  monitorActivity() {
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let timer = null;

    const reset = () => {
      clearTimeout(timer);
      if (!localStorage.getItem('accessToken')) return;
      timer = setTimeout(() => {
        if (window.showToast) showToast('Session expirée pour inactivité.', 'warning', 6000);
        setTimeout(() => {
          if (window.API) API.redirectToLogin();
          else { localStorage.clear(); location.href = 'login.html'; }
        }, 2000);
      }, TIMEOUT_MS);
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      .forEach(evt => document.addEventListener(evt, reset, { passive: true }));

    reset(); // Démarrer le timer
  },

  // ─── Valider la force du mot de passe (identique au backend) ─
  validatePassword(password) {
    const errors = [];
    if (!password || password.length < 8) errors.push('Minimum 8 caractères');
    if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
    if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
    if (!/\d/.test(password)) errors.push('Au moins un chiffre');
    if (!/[@$!%*?&#\-_]/.test(password)) errors.push('Au moins un caractère spécial');
    if (/(.)\1{3,}/.test(password)) errors.push('Pas de répétition excessive');
    ['password','neobank','123456','azerty','qwerty'].forEach(w => {
      if (password.toLowerCase().includes(w)) errors.push(`Ne doit pas contenir "${w}"`);
    });

    let strength = 0;
    if (password.length >= 12) strength += 2; else if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&#\-_]/.test(password)) strength++;
    if (password.length >= 16) strength++;

    const levels = ['', 'faible', 'moyen', 'moyen', 'fort', 'fort', 'très fort', 'très fort'];
    return {
      valid:    errors.length === 0,
      errors,
      strength: levels[Math.min(strength, 7)] || 'faible',
      score:    strength
    };
  },

  // ─── Masquer les données sensibles dans les logs ──────────
  sanitizeForLog(obj) {
    const sensitive = ['password', 'token', 'secret', 'card', 'cvv', 'pin'];
    const clean = { ...obj };
    sensitive.forEach(k => { if (clean[k]) clean[k] = '***'; });
    return clean;
  }
};

// ─── Initialisation automatique ───────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Security.init());
} else {
  Security.init();
}

window.Security = Security;
