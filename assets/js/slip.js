/* ============================================================
   Form PD-07 Resume Printer (assets/js/slip.js)
   - Any [data-resume] link opens the records-office dialog
   - Printer retrieves (spinner) -> prints (paper feeds out
     line by line) -> downloads resume.pdf
   - Without <dialog> support the link downloads directly
   - Reduced motion: slip appears without the feed animation
   ============================================================ */

(function () {
    'use strict';

    const dialog = document.getElementById('resumeDialog');
    const triggers = document.querySelectorAll('[data-resume]');
    if (!dialog || typeof dialog.showModal !== 'function' || !triggers.length) return;

    const printer = dialog.querySelector('.slip-printer');
    const btn = dialog.querySelector('#slipPrintBtn');
    const closeBtn = dialog.querySelector('.resume-dialog-close');
    const feed = printer.querySelector('.slip-feed');
    const paper = printer.querySelector('.slip-paper');
    const statusText = printer.querySelector('.slip-status-text');
    const barcode = printer.querySelector('.slip-barcode');
    const numberEl = printer.querySelector('[data-slip="number"]');
    const dateEl = printer.querySelector('[data-slip="date"]');
    const exhibitsEl = printer.querySelector('[data-slip="exhibits"]');

    const RESUME_URL = triggers[0].getAttribute('href');
    const RESUME_NAME = triggers[0].getAttribute('download') || 'resume.pdf';

    const reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const pad = (n) => String(n).padStart(2, '0');
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    let run = 0;          // bumps on every open/close so stale prints stop
    let feedAnim = null;

    function setStage(stage, text) {
        printer.dataset.stage = stage;
        statusText.textContent = text;
    }

    // Small seeded PRNG so the barcode matches its slip number
    function rng(seed) {
        let s = seed >>> 0;
        return () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function fillSlip() {
        const now = new Date();
        const serial = Math.floor(1000 + Math.random() * 9000);
        numberEl.textContent = `PD07-${serial}`;
        dateEl.textContent = `${pad(now.getDate())} ${MONTHS[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const cards = document.querySelectorAll('#archives .project-card').length;
        if (cards) exhibitsEl.textContent = String(cards);

        const rand = rng(serial);
        const bars = [];
        for (let i = 0; i < 46; i++) {
            bars.push(`<i style="width:${1 + Math.floor(rand() * 3)}px"></i>`);
        }
        barcode.innerHTML = bars.join('');
    }

    // Paper advances one line, pauses, advances again, like a thermal head
    function feedKeyframes(height, lines) {
        const frames = [{ height: '0px', offset: 0 }];
        for (let i = 1; i <= lines; i++) {
            const h = `${Math.round((height * i) / lines)}px`;
            frames.push({ height: h, offset: (i - 0.45) / lines });
            if (i < lines) frames.push({ height: h, offset: i / lines });
        }
        frames[frames.length - 1].offset = 1;
        return frames;
    }

    function download() {
        const a = document.createElement('a');
        a.href = RESUME_URL;
        a.download = RESUME_NAME;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function reset() {
        run++;
        if (feedAnim) {
            feedAnim.cancel();
            feedAnim = null;
        }
        feed.style.height = '0px';
        btn.textContent = 'PRINT';
        btn.disabled = false;
        setStage('idle', 'Ready to print');
    }

    async function print() {
        reset();
        const id = run;
        btn.disabled = true;
        fillSlip();

        // Trigger the download synchronously inside the click gesture so mobile
        // browsers and download blockers don't drop it; the printer animation
        // runs alongside as visual feedback.
        download();

        setStage('processing', 'Retrieving file…');
        await wait(reducedMotion ? 200 : 1000);
        if (id !== run) return;

        const height = paper.offsetHeight;
        setStage('printing', 'Printing…');

        if (reducedMotion || typeof feed.animate !== 'function') {
            feed.style.height = `${height}px`;
        } else {
            feedAnim = feed.animate(feedKeyframes(height, 14), {
                duration: 2400,
                easing: 'linear',
                fill: 'forwards'
            });
            await feedAnim.finished.catch(() => {});
            if (id !== run) return;
            feed.style.height = `${height}px`;
            feedAnim.cancel();
            feedAnim = null;
        }

        setStage('complete', 'Resume downloaded');
        btn.textContent = 'DOWNLOAD AGAIN';
        btn.disabled = false;
    }

    function closeMobileNav() {
        const nav = document.getElementById('primaryNav');
        const toggle = document.getElementById('navToggle');
        if (nav) nav.classList.remove('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    triggers.forEach((link) => {
        link.addEventListener('click', (e) => {
            // Let modifier clicks behave like a normal link
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            closeMobileNav();
            if (!dialog.open) dialog.showModal();
            print();
        });
    });

    btn.addEventListener('click', () => {
        if (printer.dataset.stage === 'complete') download();
        else print();
    });

    closeBtn.addEventListener('click', () => dialog.close());

    // Click on the dimmed backdrop closes
    dialog.addEventListener('click', (e) => {
        if (e.target !== dialog) return;
        const r = dialog.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dialog.close();
    });

    dialog.addEventListener('close', reset);

    // Keep a printed slip sized correctly if the layout reflows
    window.addEventListener('resize', () => {
        if (printer.dataset.stage === 'complete') {
            feed.style.height = `${paper.offsetHeight}px`;
        }
    }, { passive: true });
})();
