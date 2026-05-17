/**
 * AUTH.JS — Logique login & register
 * Connecté à l'API réelle via ApiClient
 */

const AuthModule = {

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION LOGIN
  // ═══════════════════════════════════════════════════════════
  initLogin() {
    // Rediriger si déjà connecté
    if (Auth.redirectIfAuth()) return;

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const alert = document.getElementById('loginAlert');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');

    if (!form) return;

    // Toggle afficher/masquer le mot de passe
    togglePassword?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePassword.setAttribute('aria-label', isPassword ? 'Masquer' : 'Afficher');
    });

    // Effacer les erreurs au focus
    emailInput?.addEventListener('input', () => UI.clearError(emailInput, emailError));
    passwordInput?.addEventListener('input', () => UI.clearError(passwordInput, passwordError));

    // Soumission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      UI.hideAlert(alert);

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      let hasError = false;

      // Validation frontend
      if (!email) {
        UI.showError(emailInput, emailError, "L'email est obligatoire");
        hasError = true;
      } else if (!Validator.email(email)) {
        UI.showError(emailInput, emailError, 'Email invalide');
        hasError = true;
      }

      if (!password) {
        UI.showError(passwordInput, passwordError, 'Le mot de passe est obligatoire');
        hasError = true;
      }

      if (hasError) return;

      // Appel API
      UI.setLoading(loginBtn, true, 'Connexion...');

      try {
        const data = await ApiClient.post('/auth/login', { email, password });

        // Stocker les tokens et l'utilisateur
        TokenManager.set(data.accessToken, data.refreshToken);
        TokenManager.setUser(data.user);

        Toast.success('Connexion réussie ! Redirection...');

        // Redirection selon le rôle
        setTimeout(() => {
          if (data.user.role === 'admin' || data.user.role === 'superadmin') {
            window.location.href = '/pages/admin.html';
          } else {
            window.location.href = '/pages/dashboard.html';
          }
        }, 800);

      } catch (error) {
        UI.setLoading(loginBtn, false);

        if (error.status === 423) {
          UI.showAlert(alert, error.message, 'warning');
        } else if (error.status === 401) {
          UI.showAlert(alert, 'Email ou mot de passe incorrect.', 'error');
          passwordInput.value = '';
          passwordInput.focus();
        } else if (error.status === 0) {
          UI.showAlert(alert, 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.', 'error');
        } else {
          UI.showAlert(alert, error.message || 'Une erreur est survenue.', 'error');
        }
      }
    });
  },

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION REGISTER
  // ═══════════════════════════════════════════════════════════
  initRegister() {
    if (Auth.redirectIfAuth()) return;

    const form = document.getElementById('registerForm');
    if (!form) return;

    let currentStep = 1;

    // ─── Navigation étapes ──────────────────────────────────

    const goToStep = (step) => {
      // Masquer toutes les étapes
      document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
      document.getElementById(`formStep${step}`).classList.remove('hidden');

      // Mettre à jour les indicateurs
      document.querySelectorAll('.panel-step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < step) el.classList.add('completed');
        if (i + 1 === step) el.classList.add('active');
      });

      // Barre de progression
      const progress = { 1: 33, 2: 66, 3: 100 };
      const bar = document.getElementById('progressBar');
      if (bar) bar.style.width = `${progress[step]}%`;

      currentStep = step;
    };

    // ─── Bouton Étape 1 → 2 ─────────────────────────────────
    document.getElementById('nextStep1')?.addEventListener('click', () => {
      if (this._validateStep1()) goToStep(2);
    });

    // ─── Bouton retour 2 → 1 ────────────────────────────────
    document.getElementById('prevStep2')?.addEventListener('click', () => goToStep(1));

    // ─── Indicateur de force du mot de passe ────────────────
    const regPassword = document.getElementById('regPassword');
    regPassword?.addEventListener('input', () => {
      this._updatePasswordStrength(regPassword.value);
    });

    // ─── Toggle mot de passe ────────────────────────────────
    document.getElementById('toggleRegPassword')?.addEventListener('click', () => {
      const isPassword = regPassword.type === 'password';
      regPassword.type = isPassword ? 'text' : 'password';
    });

    // ─── Soumission formulaire ───────────────────────────────
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this._validateStep2()) return;

      const registerBtn = document.getElementById('registerBtn');
      const alert = document.getElementById('registerAlert');

      UI.setLoading(registerBtn, true, 'Création du compte...');
      UI.hideAlert(alert);

      const payload = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('phone').value.trim() || undefined
      };

      try {
        const data = await ApiClient.post('/auth/register', payload);

        // Stocker les tokens
        TokenManager.set(data.accessToken, data.refreshToken);
        TokenManager.setUser(data.user);

        // Afficher l'étape de succès
        goToStep(3);

      } catch (error) {
        UI.setLoading(registerBtn, false);

        if (error.status === 409) {
          UI.showAlert(alert, 'Cet email est déjà utilisé. Essayez de vous connecter.', 'error');
          goToStep(1);
        } else if (error.status === 400) {
          UI.showAlert(alert, error.message, 'error');
        } else if (error.status === 0) {
          UI.showAlert(alert, 'Impossible de contacter le serveur.', 'error');
        } else {
          UI.showAlert(alert, error.message || 'Erreur lors de la création du compte.', 'error');
        }
      }
    });

    // Vider les erreurs sur input
    ['firstName', 'lastName', 'regEmail', 'phone'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', (e) => {
        UI.clearError(e.target, document.getElementById(`${id}Error`));
      });
    });
  },

  // ─── Validation étape 1 ────────────────────────────────────
  _validateStep1() {
    let valid = true;

    const fields = [
      { id: 'firstName', errId: 'firstNameError', label: 'prénom', minLen: 2 },
      { id: 'lastName', errId: 'lastNameError', label: 'nom', minLen: 2 }
    ];

    fields.forEach(({ id, errId, label, minLen }) => {
      const input = document.getElementById(id);
      const err = document.getElementById(errId);
      const val = input?.value.trim();

      if (!val) {
        UI.showError(input, err, `Le ${label} est obligatoire`);
        valid = false;
      } else if (val.length < minLen) {
        UI.showError(input, err, `${label.charAt(0).toUpperCase() + label.slice(1)}: minimum ${minLen} caractères`);
        valid = false;
      } else {
        UI.clearError(input, err);
      }
    });

    const email = document.getElementById('regEmail');
    const emailErr = document.getElementById('regEmailError');
    if (!email.value.trim()) {
      UI.showError(email, emailErr, "L'email est obligatoire");
      valid = false;
    } else if (!Validator.email(email.value.trim())) {
      UI.showError(email, emailErr, 'Adresse email invalide');
      valid = false;
    } else {
      UI.clearError(email, emailErr);
    }

    return valid;
  },

  // ─── Validation étape 2 ────────────────────────────────────
  _validateStep2() {
    let valid = true;

    const password = document.getElementById('regPassword');
    const pwdErr = document.getElementById('regPasswordError');
    const confirm = document.getElementById('confirmPassword');
    const confErr = document.getElementById('confirmPasswordError');
    const terms = document.getElementById('acceptTerms');
    const termsErr = document.getElementById('termsError');

    const pwdCheck = Validator.password(password.value);
    if (!pwdCheck.isValid()) {
      UI.showError(password, pwdErr, 'Le mot de passe ne répond pas aux exigences');
      valid = false;
    } else {
      UI.clearError(password, pwdErr);
    }

    if (password.value !== confirm.value) {
      UI.showError(confirm, confErr, 'Les mots de passe ne correspondent pas');
      valid = false;
    } else {
      UI.clearError(confirm, confErr);
    }

    if (!terms.checked) {
      termsErr.textContent = 'Veuillez accepter les conditions';
      termsErr.classList.add('visible');
      valid = false;
    } else {
      termsErr.classList.remove('visible');
    }

    return valid;
  },

  // ─── Indicateur force mot de passe ────────────────────────
  _updatePasswordStrength(password) {
    const check = Validator.password(password);
    const bars = ['sBar1', 'sBar2', 'sBar3', 'sBar4'];
    const label = document.getElementById('strengthLabel');

    // Compter les critères remplis
    const score = [
      check.minLength, check.hasUpper, check.hasLower,
      check.hasNumber, check.hasSpecial
    ].filter(Boolean).length;

    const levels = [
      { score: 0, bars: 0, text: 'Saisissez un mot de passe', class: '' },
      { score: 1, bars: 1, text: 'Très faible', class: 'weak' },
      { score: 2, bars: 2, text: 'Faible', class: 'weak' },
      { score: 3, bars: 3, text: 'Moyen', class: 'fair' },
      { score: 4, bars: 4, text: 'Bon', class: 'good' },
      { score: 5, bars: 4, text: 'Fort ✓', class: 'strong' }
    ];

    const level = levels[Math.min(score, 5)];
    if (label) label.textContent = level.text;

    bars.forEach((barId, i) => {
      const bar = document.getElementById(barId);
      if (bar) {
        bar.className = 'strength-bar';
        if (i < level.bars && level.class) bar.classList.add(level.class);
      }
    });

    // Mettre à jour les règles visuelles
    const rules = {
      'rule-length': check.minLength,
      'rule-upper': check.hasUpper,
      'rule-lower': check.hasLower,
      'rule-number': check.hasNumber,
      'rule-special': check.hasSpecial
    };

    Object.entries(rules).forEach(([id, ok]) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('rule-ok', ok);
        el.classList.toggle('rule-pending', !ok);
      }
    });
  }
};

window.AuthModule = AuthModule;
