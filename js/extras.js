/**
 * NEOBANK EXTRAS — Loader, Logo SVG, Hero Animation, Features link
 * S'injecte proprement sans toucher au code existant
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     1. LOADER CIRCULAIRE
  ══════════════════════════════════════════════════ */
  const loaderHTML = `
    <div id="nb-loader">
      <div class="nb-loader-ring">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,212,255,0.1)" stroke-width="4"/>
          <circle cx="40" cy="40" r="34" fill="none"
            stroke="url(#loaderGrad)" stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="60 154"
            class="nb-loader-arc"/>
          <defs>
            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="nb-loader-logo">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00d4ff"/>
                <stop offset="100%" stop-color="#7c3aed"/>
              </linearGradient>
            </defs>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10"
              fill="url(#logoGrad)" opacity="0.15"/>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10"
              fill="none" stroke="url(#logoGrad)" stroke-width="1.5"/>
            <text x="16" y="21" text-anchor="middle"
              font-family="'Space Grotesk',sans-serif"
              font-weight="800" font-size="13"
              fill="url(#logoGrad)">N</text>
          </svg>
        </div>
      </div>
    </div>
  `;

  const loaderCSS = `
    #nb-loader {
      position: fixed; inset: 0; z-index: 99999;
      background: #080c14;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.45s ease, visibility 0.45s ease;
    }
    #nb-loader.nb-loader-hide { opacity: 0; visibility: hidden; }
    .nb-loader-ring { position: relative; display: flex; align-items: center; justify-content: center; }
    .nb-loader-logo { position: absolute; }
    .nb-loader-arc {
      transform-origin: 40px 40px;
      animation: nb-spin 1s linear infinite;
    }
    @keyframes nb-spin { to { transform: rotate(360deg); } }
  `;

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = loaderCSS;
  document.head.appendChild(style);

  // Inject loader HTML
  const loaderEl = document.createElement('div');
  loaderEl.innerHTML = loaderHTML;
  document.body.insertBefore(loaderEl.firstElementChild, document.body.firstChild);

  // Hide loader when page is ready
  function hideLoader() {
    const l = document.getElementById('nb-loader');
    if (l) {
      l.classList.add('nb-loader-hide');
      setTimeout(() => l.remove(), 500);
    }
  }
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 200);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 200));
  }

  /* ══════════════════════════════════════════════════
     2. LOGO SVG — remplace ◆ dans toutes les pages
  ══════════════════════════════════════════════════ */
  const logoSVG = `
    <svg viewBox="0 0 36 36" width="30" height="30" style="display:block;flex-shrink:0" aria-hidden="true">
      <defs>
        <linearGradient id="nbLg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00d4ff"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <polygon points="18,1 34,10 34,26 18,35 2,26 2,10"
        fill="url(#nbLg)" opacity="0.12"/>
      <polygon points="18,1 34,10 34,26 18,35 2,26 2,10"
        fill="none" stroke="url(#nbLg)" stroke-width="2"/>
      <polygon points="18,8 27,13 27,23 18,28 9,23 9,13"
        fill="url(#nbLg)" opacity="0.25"/>
      <text x="18" y="23" text-anchor="middle"
        font-family="'Space Grotesk',sans-serif"
        font-weight="800" font-size="13"
        fill="url(#nbLg)">N</text>
    </svg>
  `;

  document.querySelectorAll('.logo-icon').forEach(el => {
    el.innerHTML = logoSVG;
    el.style.cssText = 'display:flex;align-items:center;';
  });

  /* ══════════════════════════════════════════════════
     3. HERO ANIMATION (index.html uniquement)
  ══════════════════════════════════════════════════ */
  const isHomePage = window.location.pathname === '/' ||
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname.endsWith('/');

  if (isHomePage) {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      // Animation banking scene
      const animCSS = `
        .nb-hero-anim {
          position:absolute; right:0; top:50%; transform:translateY(-50%);
          width:min(480px, 45vw); height:480px;
          pointer-events:none; z-index:1;
          opacity:0; animation: nbFadeIn 1s ease 0.3s forwards;
        }
        @media(max-width:900px){ .nb-hero-anim{ display:none; } }
        @keyframes nbFadeIn { to { opacity: 1; } }

        /* Orbite centrale */
        .nba-orbit {
          transform-origin: 240px 240px;
          animation: nbOrbit 18s linear infinite;
        }
        .nba-orbit-r {
          transform-origin: 240px 240px;
          animation: nbOrbit 14s linear infinite reverse;
        }
        @keyframes nbOrbit { to { transform: rotate(360deg); } }

        /* Pulse nodes */
        .nba-pulse { animation: nbPulse 2.5s ease-in-out infinite; }
        .nba-pulse-d1 { animation-delay: 0.5s; }
        .nba-pulse-d2 { animation-delay: 1s; }
        .nba-pulse-d3 { animation-delay: 1.5s; }
        @keyframes nbPulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.18); }
        }

        /* Float cards */
        .nba-card-float { animation: nbFloat 4s ease-in-out infinite; }
        .nba-card-float-r { animation: nbFloatR 5s ease-in-out infinite; }
        @keyframes nbFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes nbFloatR {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        /* Data flow dots */
        .nba-dot { animation: nbDotFlow 3s ease-in-out infinite; opacity:0; }
        .nba-dot:nth-child(1){ animation-delay:0s; }
        .nba-dot:nth-child(2){ animation-delay:0.6s; }
        .nba-dot:nth-child(3){ animation-delay:1.2s; }
        .nba-dot:nth-child(4){ animation-delay:1.8s; }
        .nba-dot:nth-child(5){ animation-delay:2.4s; }
        @keyframes nbDotFlow {
          0%   { opacity:0; offset-distance:0%; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { opacity:0; offset-distance:100%; }
        }

        /* Bars chart animation */
        .nba-bar { transform-origin: bottom; animation: nbBarGrow 2s ease-out forwards; }
        .nba-bar:nth-child(1){ animation-delay:0.8s; transform: scaleY(0); }
        .nba-bar:nth-child(2){ animation-delay:1.0s; transform: scaleY(0); }
        .nba-bar:nth-child(3){ animation-delay:1.2s; transform: scaleY(0); }
        .nba-bar:nth-child(4){ animation-delay:1.4s; transform: scaleY(0); }
        .nba-bar:nth-child(5){ animation-delay:1.6s; transform: scaleY(0); }
        @keyframes nbBarGrow { to { transform: scaleY(1); } }

        /* Number counter */
        .nba-counter { animation: nbCounter 0.8s ease-out forwards; }
        @keyframes nbCounter {
          from { opacity:0; transform:translateY(6px); }
          to { opacity:1; transform:translateY(0); }
        }
      `;
      const s = document.createElement('style');
      s.textContent = animCSS;
      document.head.appendChild(s);

      const animEl = document.createElement('div');
      animEl.className = 'nb-hero-anim';
      animEl.innerHTML = `
        <svg viewBox="0 0 480 480" width="480" height="480"
          xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
          <defs>
            <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
            <linearGradient id="ag2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#7c3aed"/>
              <stop offset="100%" stop-color="#00d4ff"/>
            </linearGradient>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f1729"/>
              <stop offset="100%" stop-color="#1a2540"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Glow central -->
          <circle cx="240" cy="240" r="160" fill="url(#centerGlow)"/>

          <!-- Cercles orbite -->
          <circle cx="240" cy="240" r="150" fill="none"
            stroke="rgba(0,212,255,0.06)" stroke-width="1" stroke-dasharray="4 8"/>
          <circle cx="240" cy="240" r="110" fill="none"
            stroke="rgba(124,58,237,0.07)" stroke-width="1" stroke-dasharray="3 6"/>

          <!-- Nœuds sur orbite externe -->
          <g class="nba-orbit">
            <circle cx="240" cy="90" r="7" fill="#00d4ff" opacity="0.8" filter="url(#glow)" class="nba-pulse"/>
            <circle cx="390" cy="240" r="5" fill="#7c3aed" opacity="0.7" class="nba-pulse nba-pulse-d1"/>
            <circle cx="240" cy="390" r="6" fill="#00d4ff" opacity="0.6" class="nba-pulse nba-pulse-d2"/>
            <circle cx="90" cy="240" r="5" fill="#7c3aed" opacity="0.8" class="nba-pulse nba-pulse-d3"/>
          </g>

          <!-- Nœuds orbite interne -->
          <g class="nba-orbit-r">
            <circle cx="240" cy="130" r="4" fill="#00d4ff" opacity="0.5"/>
            <circle cx="350" cy="240" r="4" fill="#7c3aed" opacity="0.5"/>
            <circle cx="240" cy="350" r="4" fill="#00d4ff" opacity="0.5"/>
            <circle cx="130" cy="240" r="4" fill="#7c3aed" opacity="0.5"/>
          </g>

          <!-- Lignes rayonnantes -->
          <line x1="240" y1="240" x2="240" y2="90" stroke="rgba(0,212,255,0.12)" stroke-width="1"/>
          <line x1="240" y1="240" x2="390" y2="240" stroke="rgba(124,58,237,0.12)" stroke-width="1"/>
          <line x1="240" y1="240" x2="240" y2="390" stroke="rgba(0,212,255,0.12)" stroke-width="1"/>
          <line x1="240" y1="240" x2="90" y2="240" stroke="rgba(124,58,237,0.12)" stroke-width="1"/>

          <!-- CARTE PRINCIPALE (centre) -->
          <g class="nba-card-float" style="filter:drop-shadow(0 8px 32px rgba(0,212,255,0.2))">
            <rect x="148" y="178" width="184" height="108" rx="14"
              fill="url(#cardGrad)" stroke="rgba(0,212,255,0.25)" stroke-width="1"/>
            <!-- Chip -->
            <rect x="164" y="196" width="22" height="16" rx="4"
              fill="none" stroke="#00d4ff" stroke-width="1" opacity="0.6"/>
            <rect x="167" y="198" width="16" height="12" rx="2"
              fill="rgba(0,212,255,0.15)"/>
            <!-- Numéro carte -->
            <text x="165" y="228" font-family="monospace" font-size="10.5"
              fill="rgba(255,255,255,0.7)" letter-spacing="2">•••• •••• •••• 4291</text>
            <!-- Logo carte -->
            <text x="312" y="196" text-anchor="end" font-family="'Space Grotesk',sans-serif"
              font-size="8" font-weight="700" fill="url(#ag1)">NEOBANK</text>
            <!-- Nom + date -->
            <text x="165" y="272" font-family="sans-serif" font-size="9"
              fill="rgba(255,255,255,0.5)">PIERRE FRIANT</text>
            <text x="312" y="272" text-anchor="end" font-family="sans-serif" font-size="9"
              fill="rgba(255,255,255,0.5)">12/27</text>
            <!-- Wave déco -->
            <path d="M148,262 Q192,252 240,262 Q288,272 332,262 L332,286 Q288,286 240,286 Q192,286 148,286Z"
              fill="url(#ag1)" opacity="0.06"/>
          </g>

          <!-- CARTE SECONDAIRE (haut-droite) -->
          <g class="nba-card-float-r" style="filter:drop-shadow(0 4px 20px rgba(124,58,237,0.2))">
            <rect x="295" y="100" width="130" height="76" rx="10"
              fill="url(#cardGrad)" stroke="rgba(124,58,237,0.3)" stroke-width="1"/>
            <rect x="308" y="114" width="16" height="12" rx="3"
              fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.5"/>
            <text x="310" y="146" font-family="monospace" font-size="8"
              fill="rgba(255,255,255,0.5)" letter-spacing="1.5">•••• 8842</text>
            <text x="310" y="164" font-family="sans-serif" font-size="7"
              fill="rgba(255,255,255,0.4)">PREMIUM</text>
          </g>

          <!-- MINI DASHBOARD (bas-gauche) -->
          <g class="nba-card-float" style="animation-delay:1s">
            <rect x="60" y="290" width="138" height="110" rx="12"
              fill="url(#cardGrad)" stroke="rgba(0,212,255,0.18)" stroke-width="1"/>
            <text x="76" y="313" font-family="sans-serif" font-size="8.5"
              font-weight="600" fill="rgba(255,255,255,0.5)">Solde total</text>
            <text x="76" y="334" font-family="'Space Grotesk',sans-serif" font-size="15"
              font-weight="800" fill="url(#ag1)" class="nba-counter">€ 24 850</text>
            <!-- Barres mini -->
            <g>
              <rect x="76" y="378" width="16" height="14" rx="2" fill="url(#ag1)" opacity="0.6" class="nba-bar" style="transform-origin:76px 392px"/>
              <rect x="98" y="366" width="16" height="26" rx="2" fill="url(#ag1)" opacity="0.75" class="nba-bar" style="transform-origin:98px 392px"/>
              <rect x="120" y="358" width="16" height="34" rx="2" fill="url(#ag1)" opacity="0.9" class="nba-bar" style="transform-origin:120px 392px"/>
              <rect x="142" y="370" width="16" height="22" rx="2" fill="url(#ag1)" opacity="0.7" class="nba-bar" style="transform-origin:142px 392px"/>
              <rect x="164" y="362" width="16" height="30" rx="2" fill="url(#ag1)" class="nba-bar" style="transform-origin:164px 392px"/>
            </g>
          </g>

          <!-- TRANSACTION PILL (droite) -->
          <g class="nba-card-float-r" style="animation-delay:0.7s">
            <rect x="325" y="295" width="128" height="50" rx="25"
              fill="url(#cardGrad)" stroke="rgba(0,212,255,0.2)" stroke-width="1"/>
            <circle cx="351" cy="320" r="13" fill="rgba(0,212,255,0.1)"
              stroke="rgba(0,212,255,0.3)" stroke-width="1"/>
            <text x="351" y="325" text-anchor="middle" font-size="11">💸</text>
            <text x="370" y="315" font-family="sans-serif" font-size="8"
              fill="rgba(255,255,255,0.45)">Virement reçu</text>
            <text x="370" y="330" font-family="'Space Grotesk',sans-serif" font-size="11"
              font-weight="700" fill="#00d4ff">+ €2 500</text>
          </g>

          <!-- SÉCURITÉ PILL (bas-droite) -->
          <g class="nba-card-float" style="animation-delay:1.5s">
            <rect x="310" y="365" width="128" height="46" rx="23"
              fill="url(#cardGrad)" stroke="rgba(16,185,129,0.25)" stroke-width="1"/>
            <circle cx="334" cy="388" r="12" fill="rgba(16,185,129,0.1)"
              stroke="rgba(16,185,129,0.3)" stroke-width="1"/>
            <text x="334" y="393" text-anchor="middle" font-size="11">🔒</text>
            <text x="352" y="383" font-family="sans-serif" font-size="8"
              fill="rgba(255,255,255,0.45)">Sécurisé</text>
            <text x="352" y="398" font-family="sans-serif" font-size="8.5"
              font-weight="600" fill="rgba(16,185,129,0.9)">256-bit SSL</text>
          </g>

          <!-- NŒUD CENTRAL -->
          <circle cx="240" cy="240" r="28" fill="rgba(0,212,255,0.06)"
            stroke="rgba(0,212,255,0.2)" stroke-width="1.5"/>
          <circle cx="240" cy="240" r="18" fill="rgba(0,212,255,0.08)"
            stroke="rgba(0,212,255,0.3)" stroke-width="1"/>
          <polygon points="240,228 252,235 252,249 240,256 228,249 228,235"
            fill="url(#ag1)" opacity="0.25"/>
          <polygon points="240,228 252,235 252,249 240,256 228,249 228,235"
            fill="none" stroke="url(#ag1)" stroke-width="1.5"/>
          <text x="240" y="246" text-anchor="middle"
            font-family="'Space Grotesk',sans-serif"
            font-weight="800" font-size="11" fill="url(#ag1)">N</text>
        </svg>
      `;

      heroSection.style.position = 'relative';
      heroSection.appendChild(animEl);
    }
  }

  /* ══════════════════════════════════════════════════
     4. METTRE À JOUR LIEN "FONCTIONNALITÉS" → features.html
  ══════════════════════════════════════════════════ */
  document.querySelectorAll('a[href="#features"]').forEach(a => {
    a.setAttribute('href', 'features.html');
  });

})();
