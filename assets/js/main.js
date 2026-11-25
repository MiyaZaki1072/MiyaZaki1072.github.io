/* ============================================================
   Form PD-07 page controller (assets/js/main.js)
   Boot screen, navigation, project archive, skill filter, lightbox,
   contribution calendar. Loads before terminal.js, which uses showToast.
   ============================================================ */

// ── Boot Sequence (Board 4 · Once per session) ──────────────
(function initBootSequence() {
    const overlay = document.getElementById('bootOverlay');
    if (!overlay) return;

    const skipBtn = document.getElementById('bootSkipBtn');
    const bar = document.getElementById('bootBar');
    const cells = bar ? Array.from(bar.querySelectorAll('.boot-cell')) : [];
    const STORAGE_KEY = 'pd07_boot_shown';

    const reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let alreadyShown = false;
    try {
        alreadyShown = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (_) {}

    if (reducedMotion || alreadyShown) {
        overlay.classList.add('is-hidden');
        overlay.hidden = true;
        return;
    }

    let timerId = null;
    let stepTimer = null;
    let dismissed = false;

    function dismissBoot() {
        if (dismissed) return;
        dismissed = true;
        if (timerId) clearTimeout(timerId);
        if (stepTimer) clearInterval(stepTimer);
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (_) {}
        overlay.classList.add('is-hidden');
        setTimeout(() => {
            overlay.hidden = true;
        }, 300);
        window.removeEventListener('keydown', onBootKey);
    }

    function onBootKey(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            dismissBoot();
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
            // Dismiss without preventDefault so keyboard/SR navigation (e.g. skip link) still works
            dismissBoot();
        }
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dismissBoot();
        });
    }
    window.addEventListener('keydown', onBootKey);

    // Animate progress cells from 12 -> 20 over ~1.1s, then dismiss at 1.7s
    // so the filing-cabinet drawing (assets/js/iso.js) finishes opening first
    if (cells.length === 20) {
        let filled = 12;
        cells.forEach((c, idx) => c.classList.toggle('is-on', idx < filled));
        stepTimer = setInterval(() => {
            if (filled < 20) {
                cells[filled].classList.add('is-on');
                filled++;
            } else {
                clearInterval(stepTimer);
            }
        }, 130);
    }

    timerId = setTimeout(dismissBoot, 1700);
})();

// ── Mobile Menu & Mobile Exhibits Progressive Disclosure ─────
(function initMobileControls() {
    const navToggle = document.getElementById('navToggle');
    const primaryNav = document.getElementById('primaryNav');
    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = primaryNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        primaryNav.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                primaryNav.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
})();

// ── Active Nav Link on Scroll (Scroll-Spy) ──────────────────
const sections = document.querySelectorAll('main > section[id]');
const navLinks = document.querySelectorAll('.primary-nav .nav-link');

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

sections.forEach((s) => navObserver.observe(s));

// ── Toast Helper ─────────────────────────────────────────────
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Email Copy ───────────────────────────────────────────────
const emailBtn = document.getElementById('emailBtn');
if (emailBtn) {
    let copyTimer = null;
    const markCopied = () => {
        clearTimeout(copyTimer);
        emailBtn.classList.add('is-copied');
        emailBtn.textContent = 'COPIED';
        copyTimer = setTimeout(() => {
            emailBtn.classList.remove('is-copied');
            emailBtn.textContent = 'COPY';
        }, 1800);
    };

    emailBtn.addEventListener('click', () => {
        const email = emailBtn.dataset.email;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(() => {
                showToast('COPIED TO CLIPBOARD · ' + email);
                markCopied();
            }).catch(() => fallbackCopy(email, markCopied));
        } else {
            fallbackCopy(email, markCopied);
        }
    });
}

function fallbackCopy(text, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('COPIED TO CLIPBOARD · ' + text);
        if (onSuccess) onSuccess();
    } catch (_) {
        showToast(text);
    }
    document.body.removeChild(ta);
}

// ── Project Archive: index + preview stage ───────────────────
// The index on the left picks which card the stage shows. The first three
// items are the selected work; the rest scroll in a short list below them.
const archive = (() => {
    const root = document.getElementById('archiveBrowser');
    if (!root) return { filter() {} };

    const items = Array.from(root.querySelectorAll('.archive-item'));
    const featured = items.filter((b) => b.classList.contains('is-featured'));
    const labels = Array.from(root.querySelectorAll('.archive-index-label'));
    const narrow = window.matchMedia('(max-width: 860px)');
    let current = null;

    function select(id, reveal) {
        items.forEach((b) => {
            const on = b.dataset.target === id;
            b.setAttribute('aria-pressed', String(on));
            const card = document.getElementById(b.dataset.target);
            if (card) card.classList.toggle('is-current', on);
        });
        current = id;
        if (reveal && narrow.matches) {
            document.getElementById(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    function visibleItems() {
        return items.filter((b) => !b.parentElement.hidden && !b.closest('[hidden]'));
    }

    // A skill filter shows every matching project, featured or not.
    function filter(skill) {
        let first = null;
        items.forEach((b) => {
            const card = document.getElementById(b.dataset.target);
            const tags = (card?.dataset.tags || '').split(',').map((s) => s.trim());
            const match = !skill || tags.includes(skill);
            b.parentElement.hidden = !match;
            if (match && !first) first = b.dataset.target;
        });
        if (skill && first) select(first);
        labels.forEach((label) => {
            const list = label.nextElementSibling;
            label.hidden = !!list && !list.querySelector('li:not([hidden])');
        });
    }

    items.forEach((b) => {
        b.addEventListener('click', () => select(b.dataset.target, true));
    });

    root.querySelector('.archive-index')?.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const vis = visibleItems();
        const i = vis.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        const next = vis[(i + (e.key === 'ArrowDown' ? 1 : -1) + vis.length) % vis.length];
        next.focus();
        select(next.dataset.target);
    });

    root.classList.add('is-ready');
    select(featured[0].dataset.target);
    return { filter };
})();

// ── Skill Tag -> Project Filter ──────────────────────────────
const skillTags = document.querySelectorAll('.skill-tag[data-skill]');
const projectCards = document.querySelectorAll('.project-card[data-tags]');
const filterBanner = document.getElementById('filterBanner');
const filterName = document.getElementById('filterName');
const filterClear = document.getElementById('filterClear');
let activeSkill = null;

function applySkillFilter(skill) {
    activeSkill = skill;
    skillTags.forEach((t) => {
        const isActive = t.dataset.skill === skill;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-pressed', String(isActive));
    });

    if (!skill) {
        projectCards.forEach((c) => {
            c.classList.remove('dimmed', 'highlighted');
        });
        if (filterBanner) filterBanner.hidden = true;
        archive.filter(null);
        return;
    }

    archive.filter(skill);

    let matchCount = 0;
    projectCards.forEach((c) => {
        const tags = (c.dataset.tags || '').split(',').map((s) => s.trim());
        const match = tags.includes(skill);
        c.classList.toggle('highlighted', match);
        c.classList.toggle('dimmed', !match);
        if (match) matchCount++;
    });

    if (filterBanner && filterName) {
        filterName.textContent = `${skill} (${matchCount} exhibit${matchCount === 1 ? '' : 's'})`;
        filterBanner.hidden = false;
    }
}

skillTags.forEach((tag) => {
    tag.addEventListener('click', () => {
        const s = tag.dataset.skill;
        if (activeSkill === s) {
            applySkillFilter(null);
        } else {
            applySkillFilter(s);
            const projSec = document.getElementById('archives');
            if (projSec) {
                const r = projSec.getBoundingClientRect();
                if (r.top > window.innerHeight || r.bottom < 0) {
                    projSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    });
});

if (filterClear) {
    filterClear.addEventListener('click', () => applySkillFilter(null));
}

// ── Image Lightbox ───────────────────────────────────────────
(function initLightbox() {
    const imgs = document.querySelectorAll('img[data-lightbox]');
    if (!imgs.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.innerHTML =
        '<button class="lightbox-close" type="button" aria-label="Close preview">×</button>' +
        '<img class="lightbox-img" alt="">';
    document.body.appendChild(overlay);

    const lbImg = overlay.querySelector('.lightbox-img');
    const lbClose = overlay.querySelector('.lightbox-close');

    function open(src, alt) {
        lbImg.src = src;
        lbImg.alt = alt || '';
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function close() {
        if (overlay.hidden) return;
        overlay.hidden = true;
        lbImg.src = '';
        document.body.style.overflow = '';
    }

    imgs.forEach((img) => {
        const wrapper = img.closest('.exhibit-media') || img;
        // Where iso.js drew a diagram, a click explores the diagram and the
        // screenshot opens from its own button instead.
        const trigger = (wrapper.classList.contains('has-iso') && wrapper.querySelector('.exhibit-shot')) || wrapper;
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            open(img.currentSrc || img.src, img.alt);
        });
    });

    lbClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) close();
    });
})();

// ── GitHub Contribution Calendar (PD-07 Attachment C) ────────
// data/contributions.json is written at deploy time by
// scripts/fetch-contributions.mjs. Its shape:
//   { generated: 'YYYY-MM-DD', total, streak: { current, longest },
//     busiestWeekday: 'Mon', weeks: [[level|null x7], ...] }
// Each week is one Sun..Sat column of GitHub levels (0-4); null pads the
// partial first and last weeks. The last week holds `generated`, so every
// column's date can be worked back from it.
let contribCache = null;

(function initContributions() {
    const grid = document.getElementById('contribGrid');
    const monthsEl = document.getElementById('contribMonths');
    if (!grid) return;

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY_MS = 86400000;

    const setText = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    };

    const fmtDate = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;

    function render(data) {
        const weeks = data.weeks;
        const [y, m, d] = String(data.generated || '').split('-').map(Number);
        const generated = y ? new Date(Date.UTC(y, m - 1, d)) : null;
        // Sunday that opens the final column.
        const lastSunday = generated ? new Date(generated - generated.getUTCDay() * DAY_MS) : null;
        const weekStart = (i) => new Date(lastSunday - (weeks.length - 1 - i) * 7 * DAY_MS);

        const frag = document.createDocumentFragment();
        weeks.forEach((week) => {
            const col = document.createElement('div');
            col.className = 'contrib-week';
            for (let day = 0; day < 7; day++) {
                const level = Array.isArray(week) ? week[day] : null;
                const cell = document.createElement('span');
                cell.className = 'contrib-day';
                if (level === null || level === undefined) {
                    cell.classList.add('is-empty');
                } else {
                    cell.dataset.level = String(level);
                }
                col.appendChild(cell);
            }
            frag.appendChild(col);
        });
        grid.replaceChildren(frag);

        if (monthsEl) {
            const labels = document.createDocumentFragment();
            let lastMonth = -1;
            weeks.forEach((_, i) => {
                const span = document.createElement('span');
                if (lastSunday) {
                    // Label the first column that starts in a new month, but
                    // skip the very first column when it would crowd the next.
                    const month = weekStart(i).getUTCMonth();
                    if (month !== lastMonth) {
                        if (i > 0 || weekStart(i).getUTCDate() <= 21) span.textContent = MONTHS[month];
                        lastMonth = month;
                    }
                }
                labels.appendChild(span);
            });
            monthsEl.replaceChildren(labels);
        }

        const total = Number(data.total) || 0;
        const streak = data.streak || {};
        const plural = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
        setText('contribTotal', total.toLocaleString());
        setText('contribCurrent', plural(Number(streak.current) || 0));
        setText('contribLongest', plural(Number(streak.longest) || 0));
        grid.setAttribute('aria-label', `${total.toLocaleString()} GitHub contributions in the last year`);

        if (generated) {
            const firstWeek = weeks[0] || [];
            const firstDay = Math.max(0, firstWeek.findIndex((v) => v !== null && v !== undefined));
            const from = new Date(weekStart(0).getTime() + firstDay * DAY_MS);
            setText('contribRange', `${fmtDate(from)} – ${fmtDate(generated)}`);
        }

        // Newest weeks sit at the right edge, so a narrow screen should open
        // on them rather than on last year.
        const scroller = grid.closest('.contrib-box');
        if (scroller) scroller.scrollLeft = scroller.scrollWidth;
    }

    fetch('data/contributions.json')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
            if (!data || !Array.isArray(data.weeks) || !data.weeks.length) return;
            contribCache = data;
            render(data);
        })
        .catch((err) => console.warn('contributions: could not render calendar', err));
})();
