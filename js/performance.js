/**
 * PERFORMANCE MODULE — NeoBank
 * Lazy loading, cache mémoire, pagination infinie,
 * debounce/throttle, skeleton screens, virtualisation
 */

// ─── 1. CACHE MÉMOIRE (TTL configurable) ─────────────────────
const MemCache = (() => {
  const store = new Map();

  return {
    set(key, value, ttlMs = 30000) {
      store.set(key, { value, expires: Date.now() + ttlMs });
    },
    get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) { store.delete(key); return null; }
      return entry.value;
    },
    del(key)   { store.delete(key); },
    clear()    { store.clear(); },
    // Invalider par préfixe (ex: 'transactions' invalide tout ce qui commence par transactions)
    invalidate(prefix) {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    },
    size() { return store.size; }
  };
})();

// ─── 2. API AVEC CACHE ────────────────────────────────────────
const CachedAPI = {
  async get(endpoint, ttlMs = 30000, forceRefresh = false) {
    const cacheKey = `api:${endpoint}`;
    if (!forceRefresh) {
      const cached = MemCache.get(cacheKey);
      if (cached) return cached;
    }
    const data = await window.API.get(endpoint);
    MemCache.set(cacheKey, data, ttlMs);
    return data;
  },

  // Invalider le cache après une mutation
  invalidate(prefix) {
    MemCache.invalidate(`api:${prefix}`);
  }
};

// ─── 3. SKELETON SCREEN ───────────────────────────────────────
const Skeleton = {
  // Générer N lignes de skeleton pour une table
  tableRows(n = 5, cols = 5) {
    return Array(n).fill(0).map(() => `
      <tr>
        ${Array(cols).fill(0).map((_, i) => `
          <td><div class="skeleton" style="height:14px;width:${60 + Math.random()*35}%;border-radius:4px;"></div></td>
        `).join('')}
      </tr>`).join('');
  },

  // Skeleton pour une card
  card(lines = 3) {
    return `
      <div class="card card-sm" style="display:flex;flex-direction:column;gap:12px;">
        <div class="skeleton" style="height:18px;width:60%;border-radius:4px;"></div>
        ${Array(lines).fill(0).map(() =>
          `<div class="skeleton" style="height:13px;width:${40+Math.random()*50}%;border-radius:4px;"></div>`
        ).join('')}
      </div>`;
  },

  // Skeleton pour une liste de transactions
  txList(n = 6) {
    return Array(n).fill(0).map(() => `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--color-border);">
        <div class="skeleton" style="width:40px;height:40px;border-radius:10px;flex-shrink:0;"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
          <div class="skeleton" style="height:13px;width:${40+Math.random()*40}%;border-radius:4px;"></div>
          <div class="skeleton" style="height:11px;width:${20+Math.random()*20}%;border-radius:4px;"></div>
        </div>
        <div class="skeleton" style="height:15px;width:70px;border-radius:4px;"></div>
      </div>`).join('');
  }
};

// ─── 4. PAGINATION INFINIE ────────────────────────────────────
class InfiniteScroll {
  constructor({
    container,       // Élément DOM qui contient les items
    loadMore,        // async function(page) → { items, hasMore }
    renderItem,      // function(item) → HTML string
    threshold = 200, // px avant le bas pour déclencher le chargement
    emptyMessage = 'Aucun élément',
    errorMessage  = 'Erreur de chargement'
  }) {
    this.container    = typeof container === 'string' ? document.querySelector(container) : container;
    this.loadMore     = loadMore;
    this.renderItem   = renderItem;
    this.threshold    = threshold;
    this.emptyMessage = emptyMessage;
    this.errorMessage = errorMessage;

    this.page       = 0;
    this.loading    = false;
    this.hasMore    = true;
    this.items      = [];

    this._sentinel  = null;
    this._observer  = null;

    this._init();
  }

  _init() {
    // Sentinel element (déclencheur d'intersection)
    this._sentinel = document.createElement('div');
    this._sentinel.className = 'infinite-sentinel';
    this._sentinel.style.cssText = 'height:1px;width:100%;';
    this.container.after(this._sentinel);

    // IntersectionObserver (plus performant que scroll listener)
    this._observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !this.loading && this.hasMore) {
        this._fetchNext();
      }
    }, { rootMargin: `${this.threshold}px` });

    this._observer.observe(this._sentinel);
    this._fetchNext(); // Chargement initial
  }

  async _fetchNext() {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    this.page++;

    // Afficher loader
    const loader = document.createElement('div');
    loader.className = 'infinite-loader';
    loader.innerHTML = `<div style="text-align:center;padding:16px;color:var(--color-text-3);font-size:0.82rem;">
      <div class="loader-spinner" style="width:24px;height:24px;margin:0 auto 8px;"></div>
      Chargement...
    </div>`;
    this._sentinel.before(loader);

    try {
      const result = await this.loadMore(this.page);
      loader.remove();

      if (!result.items || result.items.length === 0) {
        if (this.page === 1) {
          this.container.innerHTML = `<div class="tx-empty">${this.emptyMessage}</div>`;
        }
        this.hasMore = false;
        this._observer.disconnect();
        return;
      }

      this.items.push(...result.items);
      this.hasMore = result.hasMore !== false;

      // Render items
      const fragment = document.createDocumentFragment();
      result.items.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = this.renderItem(item);
        fragment.appendChild(div.firstElementChild || div);
      });
      this._sentinel.before(fragment);

      if (!this.hasMore) {
        this._observer.disconnect();
        const endMsg = document.createElement('div');
        endMsg.style.cssText = 'text-align:center;padding:12px;color:var(--color-text-3);font-size:0.78rem;';
        endMsg.textContent   = `${this.items.length} élément(s) — fin de liste`;
        this._sentinel.before(endMsg);
      }
    } catch (err) {
      loader.remove();
      const errDiv = document.createElement('div');
      errDiv.className = 'alert alert-error';
      errDiv.style.margin = '12px 0';
      errDiv.textContent  = this.errorMessage + ': ' + err.message;
      this._sentinel.before(errDiv);
      this.hasMore = false;
    } finally {
      this.loading = false;
    }
  }

  reset() {
    this.page    = 0;
    this.loading = false;
    this.hasMore = true;
    this.items   = [];
    this.container.innerHTML = '';
    if (this._observer) this._observer.observe(this._sentinel);
    this._fetchNext();
  }

  destroy() {
    if (this._observer)  this._observer.disconnect();
    if (this._sentinel)  this._sentinel.remove();
  }
}

// ─── 5. LAZY LOADING DES IMAGES ───────────────────────────────
const LazyImages = {
  init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback : charger toutes les images immédiatement
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      img.classList.add('lazy');
      observer.observe(img);
    });
  }
};

// ─── 6. VIRTUALISATION LISTE (grandes listes) ─────────────────
class VirtualList {
  constructor({ container, items, renderItem, itemHeight = 72, bufferSize = 5 }) {
    this.container  = typeof container === 'string' ? document.querySelector(container) : container;
    this.items      = items;
    this.renderItem = renderItem;
    this.itemHeight = itemHeight;
    this.bufferSize = bufferSize;

    this.container.style.cssText += `;position:relative;overflow-y:auto;`;
    this._phantom   = document.createElement('div');
    this._phantom.style.height = `${items.length * itemHeight}px`;
    this.container.appendChild(this._phantom);

    this._viewport  = document.createElement('div');
    this._viewport.style.cssText = 'position:absolute;top:0;left:0;right:0;';
    this.container.appendChild(this._viewport);

    this._render();
    this.container.addEventListener('scroll', () => this._render(), { passive: true });
  }

  _render() {
    const scrollTop  = this.container.scrollTop;
    const viewHeight = this.container.clientHeight;

    const startIdx = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
    const endIdx   = Math.min(
      this.items.length - 1,
      Math.ceil((scrollTop + viewHeight) / this.itemHeight) + this.bufferSize
    );

    this._viewport.style.transform = `translateY(${startIdx * this.itemHeight}px)`;
    this._viewport.innerHTML = this.items
      .slice(startIdx, endIdx + 1)
      .map(item => this.renderItem(item))
      .join('');
  }

  update(items) {
    this.items = items;
    this._phantom.style.height = `${items.length * this.itemHeight}px`;
    this._render();
  }
}

// ─── 7. PREFETCH DES PAGES ────────────────────────────────────
const Prefetch = {
  prefetched: new Set(),

  // Précharger une page HTML en arrière-plan
  page(href) {
    if (this.prefetched.has(href)) return;
    this.prefetched.add(href);
    const link = document.createElement('link');
    link.rel   = 'prefetch';
    link.href  = href;
    document.head.appendChild(link);
  },

  // Précharger les pages liées à la navigation
  initNavPrefetch() {
    document.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
          this.page(href);
        }
      }, { once: true });
    });
  }
};

// ─── 8. DEBOUNCE & THROTTLE ───────────────────────────────────
function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ─── 9. MESURES DE PERFORMANCE ────────────────────────────────
const Perf = {
  marks: {},

  start(label) {
    this.marks[label] = performance.now();
  },

  end(label) {
    if (!this.marks[label]) return null;
    const duration = performance.now() - this.marks[label];
    delete this.marks[label];
    if (duration > 1000) {
      console.warn(`[Perf] ${label}: ${duration.toFixed(0)}ms (lent)`);
    }
    return duration;
  },

  // Mesurer une fonction async
  async measure(label, fn) {
    this.start(label);
    try { return await fn(); }
    finally { this.end(label); }
  },

  // Web Vitals basiques
  reportWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    // LCP — Largest Contentful Paint
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last    = entries[entries.length - 1];
      if (last.startTime > 2500) {
        console.warn(`[Perf] LCP lent: ${last.startTime.toFixed(0)}ms (cible: <2500ms)`);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID — First Input Delay
    new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.processingStart - entry.startTime > 100) {
          console.warn(`[Perf] FID élevé: ${(entry.processingStart - entry.startTime).toFixed(0)}ms`);
        }
      });
    }).observe({ entryTypes: ['first-input'] });
  }
};

// ─── 10. OPTIMISATION DES REQUÊTES ───────────────────────────
// Grouper plusieurs requêtes en une seule via requestAnimationFrame
const BatchRequests = (() => {
  const queue   = [];
  let scheduled = false;

  function flush() {
    const current = [...queue];
    queue.length  = 0;
    scheduled     = false;
    current.forEach(fn => fn());
  }

  return {
    add(fn) {
      queue.push(fn);
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    }
  };
})();

// ─── INITIALISATION AUTOMATIQUE ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  LazyImages.init();
  Prefetch.initNavPrefetch();
  Perf.reportWebVitals();
});

// ─── EXPORTS GLOBAUX ─────────────────────────────────────────
window.MemCache       = MemCache;
window.CachedAPI      = CachedAPI;
window.Skeleton       = Skeleton;
window.InfiniteScroll = InfiniteScroll;
window.VirtualList    = VirtualList;
window.LazyImages     = LazyImages;
window.Prefetch       = Prefetch;
window.Perf           = Perf;
window.BatchRequests  = BatchRequests;
window.debounce       = debounce;
window.throttle       = throttle;
