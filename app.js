/* ═══════════════════════════════════════════════════
   APP.JS — Shared Logic
   ═══════════════════════════════════════════════════ */

/* ── THEME ── */
const THEME_KEY = 'collection_theme';
const DEFAULT_THEME = 'dressup';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    applyTheme(saved);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
}

/* ── MODAL ── */
let currentModal = null;

function openModal(data) {
    const backdrop = document.getElementById('detailModal');
    if (!backdrop) return;

    document.getElementById('modalTag').textContent   = data.category || '';
    document.getElementById('modalTitle').textContent = data.title    || '';
    document.getElementById('modalGenre').textContent = data.genre    || '—';
    document.getElementById('modalRating').textContent = (data.rating || '—') + (data.rating ? ' / 10' : '');
    document.getElementById('modalEpisodes').textContent = data.episodes || '—';

    const statusEl = document.getElementById('modalStatus');
    statusEl.textContent = data.status || '—';
    statusEl.className = 'stat-val';
    if (data.status?.toLowerCase() === 'watching')  statusEl.classList.add('watching-text');
    if (data.status?.toLowerCase() === 'completed') statusEl.style.color = 'var(--status-done)';
    if (data.status?.toLowerCase() === 'wishlist')  statusEl.style.color = 'var(--status-wish)';
    if (data.status?.toLowerCase() === 'watching')  statusEl.style.color = 'var(--status-watch)';

    // Actions
    const actionsEl = document.getElementById('modalActions');
    actionsEl.innerHTML = '';

    if (data.watch) {
        actionsEl.innerHTML += `<a href="${data.watch}" target="_blank" rel="noopener" class="btn btn-primary btn-sm"><span>▶ Watch</span></a>`;
    }
    if (data.read) {
        actionsEl.innerHTML += `<a href="${data.read}" target="_blank" rel="noopener" class="btn btn-sm"><span>◈ Read</span></a>`;
    }
    if (!data.watch && !data.read) {
        actionsEl.innerHTML = `<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:0.2em;">— Add links in HTML —</span>`;
    }

    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    currentModal = backdrop;
}

function closeModal() {
    if (currentModal) {
        currentModal.classList.remove('open');
        document.body.style.overflow = '';
        currentModal = null;
    }
}

function initModal() {
    const backdrop = document.getElementById('detailModal');
    if (!backdrop) return;
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ── CARD CLICK → MODAL ── */
function initCards() {
    document.querySelectorAll('[data-title]').forEach(card => {
        card.addEventListener('click', () => {
            openModal({
                category: card.dataset.category || card.dataset.media || '',
                title:    card.dataset.title,
                genre:    card.dataset.genre,
                rating:   card.dataset.rating,
                episodes: card.dataset.episodes,
                status:   card.dataset.status,
                watch:    card.dataset.watch,
                read:     card.dataset.read,
            });
        });

        // Ripple
        card.addEventListener('click', function(e) {
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top  - size / 2;
            const ripple = document.createElement('span');
            ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:var(--accent-glow);border-radius:50%;transform:scale(0);animation:ripple 0.5s ease-out forwards;pointer-events:none;z-index:0;`;
            card.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/* ── SORT & FILTER (list pages) ── */
function initSortFilter() {
    // Tab filter
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            document.querySelectorAll('.full-card').forEach(card => {
                const show = filter === 'all' || card.dataset.status?.toLowerCase() === filter;
                card.style.display = show ? '' : 'none';
            });
            updateVisible();
        });
    });

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sortCards(btn.dataset.sort);
        });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            document.querySelectorAll('.full-card').forEach(card => {
                const title  = (card.dataset.title  || '').toLowerCase();
                const genre  = (card.dataset.genre  || '').toLowerCase();
                const status = (card.dataset.status || '').toLowerCase();
                const match  = title.includes(q) || genre.includes(q) || status.includes(q);
                card.style.display = match ? '' : 'none';
            });
            updateVisible();
        });
    }
}

function sortCards(sortBy) {
    const container = document.getElementById('cardList');
    if (!container) return;
    const cards = [...container.querySelectorAll('.full-card')];

    cards.sort((a, b) => {
        switch (sortBy) {
            case 'rating':
                return parseFloat(b.dataset.rating || 0) - parseFloat(a.dataset.rating || 0);
            case 'alpha':
                return (a.dataset.title || '').localeCompare(b.dataset.title || '');
            case 'genre':
                return (a.dataset.genre || '').localeCompare(b.dataset.genre || '');
            case 'status':
                const order = { watching: 0, wishlist: 1, completed: 2 };
                return (order[a.dataset.status?.toLowerCase()] ?? 9) - (order[b.dataset.status?.toLowerCase()] ?? 9);
            case 'episodes':
                return parseInt(b.dataset.episodeCount || 0) - parseInt(a.dataset.episodeCount || 0);
            default:
                return parseInt(a.dataset.rank || 0) - parseInt(b.dataset.rank || 0);
        }
    });

    cards.forEach((card, i) => {
        container.appendChild(card);
        const rankEl = card.querySelector('.full-card-rank');
        if (rankEl && sortBy === 'rating') rankEl.textContent = String(i + 1).padStart(2, '0');
    });
}

function updateVisible() {
    const container = document.getElementById('cardList');
    if (!container) return;
    const visible = [...container.querySelectorAll('.full-card')].filter(c => c.style.display !== 'none');
    const countEl = document.getElementById('itemCount');
    if (countEl) countEl.textContent = visible.length;
}

/* ── STAGGER ENTRANCE ── */
function staggerEntrance(selector, delay = 50) {
    document.querySelectorAll(selector).forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + i * delay);
    });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initModal();
    initCards();
    initSortFilter();
    staggerEntrance('.media-card', 60);
    staggerEntrance('.full-card', 40);
    staggerEntrance('.section-block', 80);
});
