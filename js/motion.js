/* ============================================================
   Form PD-07 Motion Controller (js/motion.js)
   - Sheets fade in and rise 8px as they enter view (200ms)
   - Stamps "thump" once on first view (scale 1.08 -> 1)
   - Signature strokes draw once on first view
   - Foil seal sheen tracks pointer and scroll
   - Nothing loops. Disabled under prefers-reduced-motion.
   ============================================================ */

(function () {
    'use strict';

    const reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
        return;
    }

    const vh = window.innerHeight || document.documentElement.clientHeight;

    // 1. Form sheets: fade in + 8px rise (200ms) on first view
    const sheets = document.querySelectorAll('.sheet');
    const sheetObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.remove('will-enter');
            el.classList.add('is-entered');
            sheetObserver.unobserve(el);
        });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });

    sheets.forEach((sheet) => {
        const rect = sheet.getBoundingClientRect();
        // Keep the top-most visible sheet immediately visible for fast LCP
        if (rect.top < vh * 0.85) {
            sheet.classList.add('is-entered');
        } else {
            sheet.classList.add('will-enter');
            sheetObserver.observe(sheet);
        }
    });

    // 2. Brass stamps: one-time "thump" (scale 1.08 -> 1) on first view
    const stamps = document.querySelectorAll('.stamp-rect, .case-stamp');
    const stampObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.remove('will-thump');
            el.classList.add('is-thumped');
            stampObserver.unobserve(el);
        });
    }, { threshold: 0.25 });

    stamps.forEach((stamp) => {
        stamp.classList.add('will-thump');
        stampObserver.observe(stamp);
    });

    // 3. Signature: pen strokes draw once on first view
    const signature = document.querySelector('.signature-svg');
    if (signature) {
        signature.classList.add('will-sign');
        const signObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                // Force a frame at the hidden state so the transition runs
                requestAnimationFrame(() => {
                    signature.classList.add('is-signed');
                    signature.classList.remove('will-sign');
                });
                signObserver.unobserve(signature);
            });
        }, { threshold: 0.6 });
        signObserver.observe(signature);
    }

    // 4. Foil seal: sheen follows the pointer, hue turns with scroll
    const seal = document.querySelector('.foil-seal');
    if (seal) {
        let px = null;
        let py = null;
        let queued = false;

        const paint = () => {
            queued = false;
            const r = seal.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            if (px !== null) {
                const fx = Math.max(-20, Math.min(120, ((px - r.left) / r.width) * 100));
                const fy = Math.max(-20, Math.min(120, ((py - r.top) / r.height) * 100));
                seal.style.setProperty('--fx', fx.toFixed(1) + '%');
                seal.style.setProperty('--fy', fy.toFixed(1) + '%');
            }
            const angle = (window.scrollY * 0.35 + (px || 0) * 0.15) % 360;
            seal.style.setProperty('--fa', angle.toFixed(1) + 'deg');
        };
        const queue = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(paint);
        };

        window.addEventListener('pointermove', (e) => {
            px = e.clientX;
            py = e.clientY;
            queue();
        }, { passive: true });
        window.addEventListener('scroll', queue, { passive: true });
    }
})();
