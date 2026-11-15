/* ============================================================
   Form PD-07 Motion Controller (js/motion.js)
   - Sheets fade in and rise 8px as they enter view (200ms)
   - Stamps "thump" once on first view (scale 1.08 -> 1)
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
})();
