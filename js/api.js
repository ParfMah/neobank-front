/**
 * CLIENT API — NeoBank
 * Toutes les communications frontend ↔ backend
 * Gestion automatique du token JWT et des erreurs
 */

// En développement local → localhost:5000
// En production (Render) → URL complète du backend
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api/v1'
  : 'https://neobank-backend-n749.onrender.com/api/v1';

const API = {
  // ─── Requête de base ──────────────────────────────────────
  async request(method, endpoint, body = null, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (requiresAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    } catch (networkErr) {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }

    // Token expiré → tentative de refresh
    if (response.status === 401 && requiresAuth) {
      const refreshed = await API.tryRefreshToken();
      if (refreshed) {
        // Relancer la requête avec le nouveau token
        headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
        try {
          response = await fetch(`${API_BASE_URL}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
        } catch {
          throw new Error('Erreur réseau après rafraîchissement du token.');
        }
      } else {
        API.redirectToLogin();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.message || data.errors?.[0]?.message || `Erreur ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  // ─── Méthodes HTTP ────────────────────────────────────────
  get:    (endpoint, auth = true)        => API.request('GET',    endpoint, null, auth),
  post:   (endpoint, body, auth = true)  => API.request('POST',   endpoint, body, auth),
  put:    (endpoint, body, auth = true)  => API.request('PUT',    endpoint, body, auth),
  patch:  (endpoint, body, auth = true)  => API.request('PATCH',  endpoint, body, auth),
  delete: (endpoint, auth = true)        => API.request('DELETE',  endpoint, null, auth),

  // ─── Rafraîchissement du token ────────────────────────────
  async tryRefreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // ─── Déconnexion et redirection ───────────────────────────
  redirectToLogin() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
  },

  // ─── Récupérer l'utilisateur local ───────────────────────
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch { return null; }
  },

  // ─── Vérifier si connecté ─────────────────────────────────
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  // ─── Endpoints Auth ───────────────────────────────────────
  auth: {
    login:          (body) => API.post('/auth/login', body, false),
    register:       (body) => API.post('/auth/register', body, false),
    logout:         ()     => API.post('/auth/logout', {}),
    me:             ()     => API.get('/auth/me'),
    changePassword: (body) => API.put('/auth/change-password', body),
    refresh:        (body) => API.post('/auth/refresh', body, false)
  },

  // ─── Endpoints Compte ─────────────────────────────────────
  account: {
    get:          ()     => API.get('/accounts/me'),
    getBalance:   ()     => API.get('/accounts/me/balance'),
    getStats:     ()     => API.get('/accounts/me/stats')
  },

  // ─── Endpoints Transactions ───────────────────────────────
  transactions: {
    list:     (params = '') => API.get(`/transactions?${params}`),
    get:      (id)          => API.get(`/transactions/${id}`),
    transfer: (body)        => API.post('/transactions/transfer', body),
    deposit:  (body)        => API.post('/transactions/deposit', body)
  },

  // ─── Endpoints Prêts ──────────────────────────────────────
  loans: {
    list:     ()     => API.get('/loans'),
    get:      (id)   => API.get(`/loans/${id}`),
    apply:    (body) => API.post('/loans/apply', body),
    simulate: (body) => API.post('/loans/simulate', body, false),
    repay:    (id)   => API.post(`/loans/${id}/repay`)
  },

  // ─── Endpoints Admin ──────────────────────────────────────
  admin: {
    getStats:       ()           => API.get('/admin/stats'),
    getUsers:       (params='') => API.get(`/admin/users?${params}`),
    getUser:        (id)         => API.get(`/admin/users/${id}`),
    creditAccount:  (body)       => API.post('/admin/credit', body),
    updateUserRole: (id, body)   => API.patch(`/admin/users/${id}/role`, body),
    suspendUser:    (id, body)   => API.patch(`/admin/users/${id}/suspend`, body),
    getLoans:       (params='') => API.get(`/admin/loans?${params}`),
    approveLoan:    (id, body)   => API.patch(`/admin/loans/${id}/approve`, body),
    rejectLoan:     (id, body)   => API.patch(`/admin/loans/${id}/reject`, body),
    getLogs:        (params='') => API.get(`/admin/logs?${params}`)
  }
};

// ─── Protection des pages privées ─────────────────────────────
function requireAuth() {
  if (!API.isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!API.isAuthenticated()) { window.location.href = 'login.html'; return false; }
  const user = API.getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// Exporter en global pour usage dans les pages HTML
window.API = API;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
