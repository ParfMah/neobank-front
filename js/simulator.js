/**
 * SIMULATEUR DE CRÉDIT — NeoBank
 * Taux TAEG fixes par type : personnel 3%, auto 3.5%, immo 2.1%, étudiant 1.9%
 * Fonctionne sur la homepage ET la page simulator.html
 */

const FIXED_RATES = {
  personnel : 3.0,
  auto      : 3.5,
  immo      : 2.1,
  etude     : 1.9
};

const TYPE_LABELS = {
  personnel : 'crédit personnel',
  auto      : 'crédit auto',
  immo      : 'crédit immobilier',
  etude     : 'prêt étudiant'
};

let currentLoanType = 'personnel';

// ─── CALCUL PMT ───────────────────────────────────────────────
function calculateMonthlyPayment(principal, annualRate, months) {
  if (annualRate === 0) return parseFloat((principal / months).toFixed(2));
  const r = annualRate / 100 / 12;
  const pmt = principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return parseFloat(pmt.toFixed(2));
}

// ─── MISE À JOUR COMPLÈTE ─────────────────────────────────────
function updateSimulator() {
  const get   = id => document.getElementById(id);
  const fmt   = n  => '€' + n.toLocaleString('fr-FR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const fmtRd = n  => '€' + Math.round(n).toLocaleString('fr-FR');

  const amount    = parseFloat(get('simAmount')?.value   || 15000);
  const duration  = parseInt(get('simDuration')?.value   || 36);
  const apport    = parseFloat(get('simApport')?.value   || 0);
  const rate      = FIXED_RATES[currentLoanType];
  const principal = Math.max(0, amount - apport);

  // — Affichages labels —
  if (get('simAmountDisplay'))   get('simAmountDisplay').textContent   = '€' + amount.toLocaleString('fr-FR');
  if (get('simDurationDisplay')) get('simDurationDisplay').textContent = duration + ' mois';
  if (get('simRateDisplay'))     get('simRateDisplay').textContent     = rate.toFixed(1) + '%';
  if (get('simRate'))            get('simRate').value                  = rate;
  if (get('rateNote'))           get('rateNote').textContent           = '— ' + TYPE_LABELS[currentLoanType] + ' fixé';

  // Sync champ numérique montant (ne pas perturber si l'utilisateur est en train d'écrire)
  if (get('simAmountNum') && document.activeElement !== get('simAmountNum')) {
    get('simAmountNum').value = amount;
  }

  // — Calculs —
  const monthly  = calculateMonthlyPayment(principal, rate, duration);
  const total    = parseFloat((monthly * duration).toFixed(2));
  const interest = parseFloat((total - principal).toFixed(2));

  // — Résultats homepage —
  if (get('simMonthly'))     get('simMonthly').textContent     = fmt(monthly);
  if (get('simTotal'))       get('simTotal').textContent       = fmt(total);
  if (get('simInterest'))    get('simInterest').textContent    = fmt(interest);
  if (get('simTEG'))         get('simTEG').textContent         = rate.toFixed(1) + '%';
  if (get('simResMonths'))   get('simResMonths').textContent   = duration + ' mois';
  if (get('simResMontant'))  get('simResMontant').textContent  = fmtRd(principal);
  if (get('simResApport'))   get('simResApport').textContent   = fmtRd(apport);
}

// ─── CHANGEMENT DE TYPE DE PRÊT ──────────────────────────────
function setLoanType(type) {
  if (!FIXED_RATES[type]) return;
  currentLoanType = type;

  // Mise à jour visuelle — fonctionne avec les classes CSS .nb-active ET .active
  document.querySelectorAll('[data-loan-type]').forEach(btn => {
    const isActive = btn.dataset.loanType === type;

    // Pour les boutons homepage (classe nb-loan-btn / nb-active)
    btn.classList.toggle('nb-active', isActive);

    // Pour les onglets simulator.html (classe sim-tab / active)
    btn.classList.toggle('active', isActive);
  });

  updateSimulator();
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const get = id => document.getElementById(id);

  // Slider montant ↔ champ numérique
  get('simAmount')?.addEventListener('input', function () {
    if (get('simAmountNum')) get('simAmountNum').value = this.value;
    updateSimulator();
  });
  get('simAmountNum')?.addEventListener('input', function () {
    const v = parseFloat(this.value) || 0;
    if (get('simAmount')) get('simAmount').value = v;
    updateSimulator();
  });

  // Slider durée
  get('simDuration')?.addEventListener('input', updateSimulator);

  // Apport
  get('simApport')?.addEventListener('input', updateSimulator);

  // Boutons type de prêt (homepage + simulator page)
  document.querySelectorAll('[data-loan-type]').forEach(btn => {
    btn.addEventListener('click', () => setLoanType(btn.dataset.loanType));
  });

  // Premier calcul au chargement
  updateSimulator();
});
