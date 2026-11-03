//Shared ---------------------------------------------------------------------

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

//Project cards carry their stack as a comma-separated attribute. The hero tags
//and the terminal's `projects` command both read it, so the parse lives here
//rather than once in each.
const tagsOf = card => card.dataset.tags.split(',').map(t => t.trim());

//Flip to true once resume.pdf is committed at the site root. Until then the
//button stays visibly disabled with no href, so it can never lead to a 404.
const RESUME_READY = false;

//The cat that used to be the avatar. Recruiters get the face; anyone who opens
//the terminal and types `cat` still gets the cat.
const CAT_PHOTOS = [
    { src: 'images/cat/cat-sleeping.webp', alt: 'A black cat asleep on a leather seat' },
    { src: 'images/cat/cat-nightcap.webp', alt: 'The same cat in a cartoon nightcap' },
];

const CHARS = {
    en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234!@#$%&',
    th: 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ',
    //The 24 runes of the Elder Futhark, for rune mode's scramble.
    runes: 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ',
};

//Language state. The translate button owns it and everything else subscribes,
//so no block has to reach across for a mutable global.
const i18n = (function () {
    const content = {
        en: {
            //Split three ways so the legal name carries the display size and
            //the nickname sits small on a line under it.
            nameGiven: 'Thitiwut',
            nameNick: '"Freyr"',
            nameFamily: 'Sreewasut',
            status: 'Computer Engineering @\u00a0Chulalongkorn\u00a0University\n2× TOI Bronze · NSC2024 Finalist',
            availability: 'Open to new opportunities',
            skillGroups: ['languages', 'tools & frameworks'],
            tooltipHas: '→ see projects',
            tooltipNone: '→ no projects yet',
            //Same order as the .grove-links buttons in index.html.
            btns: ['Email', 'GitHub', 'LinkedIn', 'Discord'],
            resume: RESUME_READY ? 'Résumé' : 'Résumé · coming soon',
        },
        th: {
            nameGiven: 'ธิติวุฒิ',
            nameNick: '"เฟรย์"',
            nameFamily: 'ศรีวะสุทธิ์',
            status: 'วิศวกรรมคอมพิวเตอร์ @\u00a0จุฬาลงกรณ์มหาวิทยาลัย\nเหรียญทองแดง TOI 2 ปี · ผ่านเข้ารอบสุดท้าย NSC2024',
            availability: 'เปิดรับโอกาสใหม่ๆ',
            skillGroups: ['ภาษา', 'เครื่องมือและเฟรมเวิร์ก'],
            tooltipHas: '→ ดูโปรเจกต์',
            tooltipNone: '→ ยังไม่มีโปรเจกต์',
            btns: ['อีเมล', 'GitHub', 'LinkedIn', 'Discord'],
            resume: RESUME_READY ? 'เรซูเม่' : 'เรซูเม่ · เร็วๆ นี้',
        },
    };
    let lang = 'en';
    const listeners = [];

    return {
        get lang() { return lang; },
        get strings() { return content[lang]; },
        get chars() { return CHARS[lang]; },
        onChange(fn) { listeners.push(fn); },
        toggle() {
            lang = lang === 'en' ? 'th' : 'en';
            document.documentElement.lang = lang;
            listeners.forEach(fn => fn(lang));
            return content[lang];
        },
    };
})();

//One scramble for the whole site. The call sites only ever differed in which
//alphabet the noise came from, whether a blinking cursor trailed the text, and
//whether the result was written as markup or as plain text.
const scrambleFrames = new WeakMap();

function scrambleText(el, target, options) {
    const { duration = 600, pool = null, suffix = '', asText = false } = options || {};
    const chars = pool || i18n.chars;
    const plain = target.replace(/\n/g, ' ');

    //Two loops writing to the same element would fight over its text.
    const running = scrambleFrames.get(el);
    if (running !== undefined) cancelAnimationFrame(running);

    const settle = () => {
        scrambleFrames.delete(el);
        if (asText) el.textContent = target;
        else el.innerHTML = target.replace(/\n/g, '<br>') + suffix;
    };

    //Nothing to watch if the visitor asked for less motion — show the answer.
    if (reducedMotion.matches) {
        settle();
        return;
    }

    //Split once and reuse: step runs ~60 times a second.
    const letters = plain.split('');
    const start = performance.now();
    const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const scrambled = letters.map((char, i) => {
            if (char === ' ') return char;
            if (i / plain.length < progress) return char;
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');

        if (suffix) el.innerHTML = scrambled + suffix;
        else el.textContent = scrambled;

        if (progress < 1) scrambleFrames.set(el, requestAnimationFrame(step));
        else settle();
    };
    scrambleFrames.set(el, requestAnimationFrame(step));
}

const showToast = (function () {
    const toast = document.getElementById('toast');
    let timer;
    return function (message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove('show'), 2200);
    };
})();

//Nav scrollspy --------------------------------------------------------------
(function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    if (!navLinks.length || !sections.length) return;

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(section => sectionObserver.observe(section));
})();

//Rune mode — hold the photo, or type `freyr` ---------------------------------
//Freyr is a Norse god as well as my nickname. Holding the photo fills a ring;
//when it closes, every word on the page turns to runes for ten seconds, the
//page goes gold, and runes rise off the photo. Esc, or another hold, ends it.
const runeMode = (function () {
    const root = document.documentElement;
    const avatar = document.querySelector('.avatar-wrap');
    const ring = document.querySelector('.freyr-ring');

    const HOLD_MS = 1800;
    const LAST_MS = 10000;
    const SWEEP_MS = 900;
    //Younger Futhark, as Viking Age Swedish runestones spell the Frey- of names
    //like fraistain (U 227). A letter-for-letter ᚠᚱᛖᛃᚱ would be a modern spelling.
    const NAME_RUNES = 'ᚠᚱᛅᛁᛦ';
    //The Th of Thitiwut is a Thai aspirated t, not the English sound ᚦ stands
    //for, so the given name skips the digraph rule below.
    const GIVEN_RUNES = 'ᛏᛁᛏᛁᚹᚢᛏ';
    const EMBERS = 'ᚠᛃᛜᚱᛅᛁᛦᛉ';
    //Latin letters to Elder Futhark by the usual modern convention (th → ᚦ,
    //ng → ᛜ). A gimmick, not a historical spelling: only the nickname keeps
    //the runestone form above.
    const LATIN_RUNES = {
        a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ', i: 'ᛁ',
        j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ', n: 'ᚾ', o: 'ᛟ', p: 'ᛈ', q: 'ᚲ', r: 'ᚱ',
        s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚹ', w: 'ᚹ', x: 'ᚲᛊ', y: 'ᛃ', z: 'ᛉ',
    };
    const toRunes = text => text
        .replace(/th/gi, 'ᚦ')
        .replace(/ng/gi, 'ᛜ')
        .replace(/[a-z]/gi, ch => LATIN_RUNES[ch.toLowerCase()]);
    //The terminal stays readable (it is how keyboard visitors get here), and
    //the toasts are what explain the joke.
    const SKIP = '#termWidget, .toast, script, style, noscript, .freyr-ember, .gullinbursti, .freyr-pop, .freyr-portal';

    let active = false;
    let frame = null;
    let endTimer = null;
    let emberTimer = null;
    //Freyr as the Rällinge figure is often read: pointed cap and braided beard
    //(no horns, which are nineteenth-century opera), holding the antler he
    //fought Beli with once he had given his sword away, the sun behind him.
    const FREYR_ART = String.raw`          \    |    /
       '.  \   |   /  .'
         '. \  |  / .'
    ------    .^.    ------
             /   \
            /  .  \
    Y      /_______\
   \|/     | () () |
    |  /   |   <   |
    | /     \ '-' /
    |/     _/|||||\_
    |     / ||||||| \
    |    /  |||||||  \
    |   |   |||||||   |
         '._'''''''_.'`;
    const POP_MS = 4600;
    //The door opens first; the page goes to runes once it is open, Freyr walks
    //out a moment later, and the door closes behind him.
    const EMERGE_AT = 0.75;
    const RUNES_MS = 800;
    const DOOR_CLOSE_MS = 2300;

    //The art greets the change and then gets out of the way: it fades on its
    //own, or on a click, while the page turns to runes behind it.
    function showPortrait(emerge) {
        const old = document.querySelector('.freyr-pop');
        if (old) old.remove();
        const pop = document.createElement('div');
        pop.className = 'freyr-pop';
        pop.setAttribute('aria-hidden', 'true');
        const pre = document.createElement('pre');
        pre.className = 'freyr-pop-art';
        const lines = FREYR_ART.split('\n');
        lines.forEach((text, i) => {
            const row = document.createElement('span');
            row.textContent = text;
            row.style.setProperty('--i', String(lines.length - 1 - i));
            pre.appendChild(row);
        });
        const name = document.createElement('p');
        name.className = 'freyr-pop-name';
        name.textContent = `${NAME_RUNES} · FREYR`;
        const line = document.createElement('p');
        line.className = 'freyr-pop-line';
        //Snorri's three: rain, the shining of the sun, the fruit of the earth.
        line.textContent = 'rain · sunshine · harvest';
        pop.append(pre, name, line);
        const close = () => {
            if (!pop.isConnected || pop.classList.contains('is-leaving')) return;
            pop.classList.add('is-leaving');
            setTimeout(() => pop.remove(), reducedMotion.matches ? 0 : 400);
        };
        pop.addEventListener('click', close);
        setTimeout(close, POP_MS);
        document.body.appendChild(pop);
        if (emerge) walkOut(pop, pre);
    }

    //Freyr steps out of the door toward you: small and bright inside it, then
    //full size, while each line of the figure scrambles out of noise into its
    //shape, bottom line first.
    function walkOut(pop, pre) {
        const rows = Array.from(pre.children);
        rows.forEach(row => {
            row.dataset.line = row.textContent;
            row.textContent = '';
        });
        gsap.set(pop, { xPercent: -50, yPercent: -50, scale: 0.3, opacity: 0, filter: 'brightness(2.5) blur(3px)' });
        const tl = gsap.timeline({ delay: EMERGE_AT });
        tl.to(pop, { opacity: 1, scale: 0.55, filter: 'brightness(1.6) blur(0px)', duration: 0.35, ease: 'power2.out' })
          .to(pop, { scale: 1, filter: 'brightness(1) blur(0px)', duration: 0.9, ease: 'power3.out', clearProps: 'filter' });
        //ScrambleText trims and collapses runs of spaces, and the figure is
        //made of them, so it scrambles toward a no-break-space copy and each
        //line is set to the exact original once it lands.
        rows.forEach((row, i) => {
            tl.to(row, {
                duration: 0.6,
                scrambleText: {
                    text: row.dataset.line.replace(/ /g, ' '),
                    chars: '#%@*+=-:.',
                    speed: 0.8,
                    revealDelay: 0.15,
                    trim: false,
                },
                onComplete: () => { row.textContent = row.dataset.line; },
            }, 0.1 + (rows.length - 1 - i) * 0.03);
        });
    }

    //A time door, drawn in characters. A rift opens down the middle of the
    //screen and snaps wide into a doorway with crackling edges and a vortex of
    //characters inside; it tears loose characters off the page around it, and
    //Freyr walks out of it toward you. Then it closes behind him. GSAP drives
    //it: CustomEase for the snap, CustomWiggle for the shake, Physics2D for the
    //flying debris, ScrambleText for his figure resolving out of noise.
    const DOOR_RAMP = ' .:-=+*#%@';
    const DEBRIS = '#@%&*+=-:./\\|[]<>{}';
    let portal = null;

    //Any of the five missing (a deleted js/vendor/, a blocked script) and the
    //portrait simply appears, as it does with motion reduced.
    const canPortal = () => Boolean(window.gsap && window.Physics2DPlugin
        && window.ScrambleTextPlugin && window.CustomEase && window.CustomWiggle);

    if (canPortal()) {
        gsap.registerPlugin(Physics2DPlugin, ScrambleTextPlugin, CustomEase, CustomWiggle);
        //Overshoots past full width and settles back: a door snapping open.
        CustomEase.create('doorSnap', 'M0,0 C0.18,0 0.24,1.18 0.52,1.08 0.72,1.01 0.84,1 1,1');
        CustomWiggle.create('doorQuake', { wiggles: 9, type: 'easeOut' });
    }

    function quake() {
        gsap.fromTo('body > section, .navbar, .footer', { x: 0 },
            { x: 7, duration: 0.6, ease: 'doorQuake', clearProps: 'x' });
    }

    function openPortal() {
        closePortal(true);
        const canvas = document.createElement('canvas');
        canvas.className = 'freyr-portal';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);

        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const fs = w < 640 ? 13 : 16;
        ctx.font = `700 ${fs}px ui-monospace, Menlo, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cw = ctx.measureText('M').width || fs * 0.6;
        const chh = fs * 1.2;

        //The doorway in cells: tall and narrow like a door, capped well inside
        //the screen on both axes.
        const doorCols = Math.max(9, Math.min(Math.floor((w * 0.34) / cw), 30));
        const doorRows = Math.max(12, Math.min(Math.floor((h * 0.72) / chh), 40));
        const cx = w / 2;
        const cy = h / 2;
        const at = (col, row) => [cx + col * cw, cy + row * chh];
        const state = { h: 0, w: 0, glow: 0 };
        const debris = [];
        let frame = 0;

        const flicker = base => (Math.random() < 0.12 ? '#%|=+*'[Math.floor(Math.random() * 6)] : base);

        function draw(now) {
            const t = now / 1000;
            ctx.clearRect(0, 0, w, h);
            const R = Math.round((doorRows * state.h) / 2);
            const C = Math.round((doorCols * state.w) / 2);

            if (R >= 1) {
                //The room goes dark around the door, and the doorway is a real
                //opening: nothing of the page shows through it.
                if (C >= 1) {
                    ctx.fillStyle = `rgba(8, 11, 8, ${(0.55 * state.glow).toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                    ctx.fillStyle = 'rgba(10, 7, 0, 0.94)';
                    ctx.fillRect(cx - C * cw, cy - R * chh, 2 * C * cw, 2 * R * chh);
                }
                //The vortex: rings of ramp characters turning inward, hottest
                //(whitest) at the centre of the door.
                for (let r = -R + 1; C >= 2 && r < R; r++) {
                    for (let c = -C + 1; c < C; c++) {
                        const nx = c / C;
                        const ny = r / R;
                        const rad = Math.hypot(nx, ny);
                        const v = 0.5 + 0.5 * Math.sin(rad * 10 - t * 7 + Math.atan2(ny, nx) * 3);
                        const ch = DOOR_RAMP[Math.min(DOOR_RAMP.length - 1, Math.floor(v * DOOR_RAMP.length))];
                        if (ch === ' ') continue;
                        const core = Math.max(0, 1 - rad);
                        ctx.fillStyle = `rgba(255, ${170 + Math.round(core * 70)}, ${40 + Math.round(core * 170)}, ${((0.25 + 0.65 * v) * (0.5 + 0.5 * core)).toFixed(3)})`;
                        const [x, y] = at(c, r);
                        ctx.fillText(ch, x, y);
                    }
                }

                //The frame: box-drawing edges that crackle, glowing. Until the
                //door widens it is a single rift line.
                ctx.shadowColor = 'rgba(255, 190, 40, 0.95)';
                ctx.shadowBlur = 10 + 8 * state.glow;
                ctx.fillStyle = '#ffd34d';
                for (let r = -R; r <= R; r++) {
                    const [xl, y] = at(-C, r);
                    if (C < 1) {
                        ctx.fillText(flicker('│'), cx, y);
                        continue;
                    }
                    const [xr] = at(C, r);
                    const top = r === -R;
                    const bottom = r === R;
                    ctx.fillText(top ? '╔' : bottom ? '╚' : flicker('║'), xl, y);
                    ctx.fillText(top ? '╗' : bottom ? '╝' : flicker('║'), xr, y);
                }
                for (let c = -C + 1; C >= 1 && c < C; c++) {
                    const [x, yt] = at(c, -R);
                    const [, yb] = at(c, R);
                    ctx.fillText(flicker('═'), x, yt);
                    ctx.fillText(flicker('═'), x, yb);
                }
                ctx.shadowBlur = 0;

                //Sparks spitting off the sides.
                const sparks = Math.round(30 * state.glow);
                for (let s = 0; s < sparks; s++) {
                    const side = Math.random() < 0.5 ? -1 : 1;
                    const [x, y] = at(side * (C + 1 + Math.floor(Math.random() * 3)), Math.round((Math.random() * 2 - 1) * R));
                    ctx.fillStyle = `rgba(255, 210, 90, ${(Math.random() * 0.8).toFixed(2)})`;
                    ctx.fillText('.*+'[s % 3], x, y);
                }
            }

            for (const p of debris) {
                if (p.a <= 0) continue;
                ctx.fillStyle = `rgba(255, 200, 80, ${p.a.toFixed(2)})`;
                ctx.fillText(p.ch, p.x, p.y);
            }
            frame = requestAnimationFrame(draw);
        }
        frame = requestAnimationFrame(draw);

        //The page tears: characters ripped off around the doorway fly outward
        //and fall under gravity.
        function burst() {
            const n = w < 640 ? 70 : 140;
            const halfW = (doorCols * cw) / 2;
            const halfH = (doorRows * chh) / 2;
            for (let i = 0; i < n; i++) {
                const fromSide = Math.random() < 0.7;
                const x = fromSide
                    ? cx + (Math.random() < 0.5 ? -1 : 1) * (halfW + Math.random() * cw * 4)
                    : cx + (Math.random() * 2 - 1) * halfW;
                const y = fromSide
                    ? cy + (Math.random() * 2 - 1) * halfH
                    : cy + (Math.random() < 0.5 ? -1 : 1) * (halfH + Math.random() * chh * 3);
                const p = { x, y, a: 1, ch: DEBRIS[Math.floor(Math.random() * DEBRIS.length)] };
                debris.push(p);
                const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + (Math.random() - 0.5) * 30;
                gsap.to(p, {
                    duration: 1.2 + Math.random() * 0.8,
                    ease: 'none',
                    physics2D: { velocity: 250 + Math.random() * 450, angle, gravity: 900 },
                });
                gsap.to(p, { a: 0, duration: 0.6, delay: 0.8 + Math.random() * 0.8 });
            }
        }

        const tl = gsap.timeline();
        tl.to(state, { h: 1, duration: 0.35, ease: 'power2.out' })
          .to(state, { w: 1, glow: 1, duration: 0.45, ease: 'doorSnap' })
          .call(burst, null, '<0.05')
          .call(quake, null, '<');
        portal = { canvas, tl, state, debris, stop: () => cancelAnimationFrame(frame) };
    }

    function closePortal(instant) {
        if (!portal) return;
        const p = portal;
        portal = null;
        p.tl.kill();
        const done = () => {
            p.stop();
            gsap.killTweensOf(p.debris);
            p.canvas.remove();
        };
        if (instant) {
            done();
            return;
        }
        gsap.timeline({ onComplete: done })
            .to(p.state, { w: 0, glow: 0, duration: 0.3, ease: 'power3.in' })
            .to(p.state, { h: 0, duration: 0.22, ease: 'power2.in' });
    }

    let swapped = [];
    let sweepFrame = null;
    let titleBefore = '';

    const setProgress = p => ring && ring.style.setProperty('--progress', `${p * 360}deg`);

    function spawnEmber() {
        if (!avatar) return;
        const ember = document.createElement('span');
        ember.className = 'freyr-ember';
        ember.setAttribute('aria-hidden', 'true');
        ember.textContent = EMBERS[Math.floor(Math.random() * EMBERS.length)];
        ember.style.left = `${10 + Math.random() * 80}%`;
        ember.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 60)}px`);
        ember.addEventListener('animationend', () => ember.remove(), { once: true });
        avatar.appendChild(ember);
    }

    //Every visible text node, with what it says now and what it says in runes.
    function collect() {
        const items = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: n => (!n.nodeValue.trim() || n.parentElement.closest(SKIP))
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT,
        });
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const from = n.nodeValue;
            const parent = n.parentElement;
            const to = parent.closest('.name-nick') ? `"${NAME_RUNES}"`
                : parent.closest('.name-given') && from === 'Thitiwut' ? GIVEN_RUNES
                : toRunes(from);
            if (to !== from) items.push({ node: n, from, to, last: from });
        }
        return items;
    }

    //One wave down the page in document order: each node turns over letter by
    //letter, with a single flickering rune at the seam. Only nodes still holding
    //what this wrote are touched, so text something else rewrote in the
    //meantime is left alone rather than reverted.
    function sweep(items, forward, done) {
        if (sweepFrame !== null) cancelAnimationFrame(sweepFrame);
        sweepFrame = null;
        const live = items.filter(it => it.node.isConnected && it.node.nodeValue === it.last);
        const write = (it, q) => {
            const want = Array.from(forward ? it.to : it.from);
            const have = Array.from(forward ? it.from : it.to);
            const k = Math.round(q * Math.max(want.length, have.length));
            let text = want.slice(0, k).join('') + have.slice(k).join('');
            if (q > 0 && q < 1) {
                const r = CHARS.runes[Math.floor(Math.random() * CHARS.runes.length)];
                text = want.slice(0, k).join('') + r + have.slice(k + 1).join('');
            }
            if (it.node.nodeValue !== text) it.node.nodeValue = text;
            it.last = text;
        };
        if (reducedMotion.matches) {
            live.forEach(it => write(it, 1));
            if (done) done();
            return;
        }
        const t0 = performance.now();
        const n = live.length || 1;
        const step = now => {
            const p = Math.min(1, (now - t0) / SWEEP_MS);
            live.forEach((it, i) => write(it, Math.min(1, Math.max(0, (p - (i / n) * 0.5) / 0.5))));
            if (p < 1) {
                sweepFrame = requestAnimationFrame(step);
                return;
            }
            sweepFrame = null;
            if (done) done();
        };
        sweepFrame = requestAnimationFrame(step);
    }

    function begin() {
        if (active) return false;
        active = true;
        root.classList.add('is-freyr');
        const fancy = !reducedMotion.matches && canPortal();
        if (fancy) {
            openPortal();
            setTimeout(() => { if (active) closePortal(); }, DOOR_CLOSE_MS);
        }
        showPortrait(fancy);
        //The page turns to runes once the door is open, not before.
        setTimeout(() => {
            if (!active) return;
            swapped = collect();
            sweep(swapped, true);
            titleBefore = document.title;
            document.title = toRunes(titleBefore);
        }, fancy ? RUNES_MS : 0);
        if (!reducedMotion.matches) {
            spawnEmber();
            emberTimer = setInterval(spawnEmber, 450);
        }
        if (typeof window.runGullinbursti === 'function') window.runGullinbursti();
        //Snorri, Gylfaginning 24 (Brodeur 1916): "he rules over the rain and the
        //shining of the sun". It follows the portrait rather than landing on it.
        setTimeout(() => {
            if (active) showToast('ᚠ Freyr rules the rain and the shining of the sun');
        }, POP_MS);
        endTimer = setTimeout(end, LAST_MS);
        return true;
    }

    function end() {
        if (!active) return;
        active = false;
        clearTimeout(endTimer);
        clearInterval(emberTimer);
        const pop = document.querySelector('.freyr-pop');
        if (pop) {
            if (window.gsap) gsap.killTweensOf(pop);
            pop.remove();
        }
        closePortal();
        root.classList.remove('is-freyr');
        sweep(swapped, false, () => { swapped = []; });
        if (titleBefore) document.title = titleBefore;
        showToast('ᛜ The runes fade');
    }

    function stopHold() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        setProgress(0);
        if (avatar) avatar.classList.remove('is-holding');
    }

    //Pointer events cover mouse, pen and touch alike. A touch that turns into a
    //scroll fires pointercancel, so scrolling past the photo never triggers it.
    function startHold(e) {
        if (e.button > 0) return;
        stopHold();
        avatar.classList.add('is-holding');
        const t0 = performance.now();
        const step = now => {
            const p = Math.min(1, (now - t0) / HOLD_MS);
            setProgress(p);
            if (p < 1) {
                frame = requestAnimationFrame(step);
                return;
            }
            stopHold();
            if (active) end(); else begin();
        };
        frame = requestAnimationFrame(step);
    }

    if (avatar && ring) {
        avatar.addEventListener('pointerdown', startHold);
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => avatar.addEventListener(type, stopHold));
        avatar.addEventListener('contextmenu', e => e.preventDefault());
        avatar.addEventListener('dragstart', e => e.preventDefault());
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && active) end();
    });

    return { begin, end, get active() { return active; } };
})();

//Gullinbursti — Freyr's golden boar runs past once each rune mode ------------
//A pass is decoration only, so it is skipped when motion is reduced, and the
//element removes itself when the run ends.
window.runGullinbursti = function () {
    if (reducedMotion.matches || document.querySelector('.gullinbursti')) return;
    const boar = document.createElement('div');
    boar.className = 'gullinbursti';
    boar.setAttribute('aria-hidden', 'true');
    boar.addEventListener('animationend', e => {
        if (e.animationName === 'gullinRun') boar.remove();
    });
    document.body.appendChild(boar);
};

//EN / TH translate ----------------------------------------------------------
(function () {
    const translateBtn = document.getElementById('translateBtn');
    const translateLabel = document.getElementById('translateLabel');
    if (!translateBtn || !translateLabel) return;

    let animating = false;

    translateBtn.addEventListener('click', () => {
        if (animating) return;
        animating = true;

        const d = i18n.toggle();
        translateLabel.textContent = i18n.lang === 'en' ? 'EN / TH' : 'TH / EN';
        translateBtn.classList.toggle('active', i18n.lang === 'th');

        const targets = [
            //Same delay for all three: the name is one word visually, so the
            //parts have to resolve together rather than cascade.
            { el: document.querySelector('.name-given'),     text: d.nameGiven,     delay: 80,  duration: 650 },
            { el: document.querySelector('.name-nick'),      text: d.nameNick,      delay: 80,  duration: 650 },
            { el: document.querySelector('.name-family'),    text: d.nameFamily,    delay: 80,  duration: 650 },
            { el: document.querySelector('.status-txt'),     text: d.status,        delay: 160, duration: 600 },
            { el: document.querySelector('.availability-txt'), text: d.availability, delay: 240, duration: 500 },
            { el: document.getElementById('resumeLink'),      text: d.resume,       delay: 280, duration: 450 },
        ];
        targets.forEach(({ el, text, delay, duration }) => {
            if (el) setTimeout(() => scrambleText(el, text, { duration }), delay);
        });

        //These three are matched to their dictionary entry by position, so an
        //element added to the markup without a matching string would otherwise
        //scramble to undefined — and only ever in Thai. Skip instead.
        const scrambleList = (selector, strings, duration, base, step) => {
            document.querySelectorAll(selector).forEach((el, i) => {
                if (strings[i] === undefined) return;
                setTimeout(() => scrambleText(el, strings[i], { duration }), base + i * step);
            });
        };

        scrambleList('.skill-group-label',  d.skillGroups, 450, 320, 80);
        scrambleList('.about-section .contact-label', d.btns, 450, 400, 60);

        setTimeout(() => { animating = false; }, 1100);
    });
})();

//Email: copy as well as open ------------------------------------------------
//The button is a mailto: link, so it still opens a draft. The copy runs too,
//because a visitor with no mail app set up gets nothing from mailto: at all.
//No preventDefault — the link keeps doing its own job.
(function () {
    const emailBtn = document.getElementById('emailBtn');
    if (!emailBtn) return;

    emailBtn.addEventListener('click', async () => {
        const email = emailBtn.dataset.email;
        try {
            await navigator.clipboard.writeText(email);
        } catch (err) {
            const scratch = document.createElement('textarea');
            scratch.value = email;
            scratch.style.position = 'fixed';
            scratch.style.opacity = '0';
            document.body.appendChild(scratch);
            scratch.select();
            document.execCommand('copy');
            document.body.removeChild(scratch);
        }
        showToast('Email copied to clipboard');
    });
})();

//Résumé link ----------------------------------------------------------------
(function () {
    const link = document.getElementById('resumeLink');
    if (!link || !RESUME_READY) return;
    link.href = 'resume.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled');
    link.hidden = false;
    link.textContent = i18n.strings.resume;
})();

//Codeforces rating -----------------------------------------------------------
//Read from the public API on load and shown under the Codeforces button. Stays
//hidden when the request fails or the account is unrated, so a visitor never
//sees a placeholder.
(function () {
    const badge = document.getElementById('cfRating');
    const link = document.getElementById('codeforcesLink');
    if (!badge || !link) return;
    const handle = link.getAttribute('href').split('/').pop();
    fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`)
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
        .then(data => {
            const user = data.status === 'OK' && data.result && data.result[0];
            if (!user || typeof user.rating !== 'number') return;
            badge.textContent = `${user.rating} · ${user.rank || 'rated'}`;
            badge.hidden = false;
        })
        .catch(() => {});
})();

//Hero skill tags -------------------------------------------------------------
//With four projects there is nothing to filter, so a tag now scrolls to the
//projects and lights the ones built with it for a moment. springs.js previews
//the same thing on hover.
(function () {
    const projectCards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
    const heroTechBtns = document.querySelectorAll('.skills-block button.skill-tag[data-tech]');
    if (!projectCards.length || !heroTechBtns.length) return;

    const uniqueTags = new Set(projectCards.flatMap(tagsOf));
    let flashTimer;

    function updateTechTooltips() {
        const d = i18n.strings;
        heroTechBtns.forEach(btn => {
            btn.dataset.tooltip = uniqueTags.has(btn.dataset.tech) ? d.tooltipHas : d.tooltipNone;
        });
    }

    updateTechTooltips();
    i18n.onChange(updateTechTooltips);

    heroTechBtns.forEach(btn => {
        const tech = btn.dataset.tech;
        btn.addEventListener('click', () => {
            if (!uniqueTags.has(tech)) {
                showToast(`No projects tagged ${tech} yet`);
                return;
            }
            document.getElementById('projects').scrollIntoView({ behavior: scrollBehavior() });
            projectCards.forEach(card => card.classList.toggle('is-linked', tagsOf(card).includes(tech)));
            clearTimeout(flashTimer);
            flashTimer = setTimeout(() => {
                projectCards.forEach(card => card.classList.remove('is-linked'));
            }, 2200);
        });
    });
})();

//GitHub contributions -------------------------------------------------------
//The data is baked in at build time by scripts/fetch-contributions.mjs. The
//calendar is GraphQL-only and GraphQL needs a token, which can never ship in a
//page served publicly, so there is no client-side path to it.
//
//That file is generated into the Pages artifact and never committed, so it is
//simply absent in local dev and on a first deploy. That is the ordinary case,
//not a failure: the block stays hidden and nothing is logged.
//real
(function () {
    const block = document.getElementById('contributions');
    const grid = document.getElementById('contribGrid');
    if (!block || !grid) return;

    fetch('data/contributions.json')
        .then(response => (response.ok ? response.json() : Promise.reject(response.status)))
        .then(render)
        .catch(() => { /* no data yet, leave the section hidden */ });

    function render(data) {
        if (!Array.isArray(data.weeks) || !data.weeks.length) return;

        //One fragment, one append: 365 individual insertions would lay out the
        //grid 365 times.
        const fragment = document.createDocumentFragment();
        data.weeks.forEach(week => {
            week.forEach(level => {
                const cell = document.createElement('span');
                cell.className = 'contrib-cell';
                if (level === null) cell.classList.add('is-empty');
                else cell.dataset.level = level;
                fragment.appendChild(cell);
            });
        });
        grid.appendChild(fragment);

        //The grid is one image to a screen reader, not 371 unlabelled cells.
        grid.setAttribute('aria-label', `${data.total} GitHub contributions in the last year`);

        setText('contribTotal', data.total.toLocaleString());
        setText('contribCurrent', `${data.streak.current} days`);
        setText('contribLongest', `${data.streak.longest} days`);
        setText('contribBusiest', data.busiestWeekday);

        block.hidden = false;

        //Newest weeks sit at the right edge, so a narrow screen should open on
        //them rather than on last year.
        const scroller = block.querySelector('.contrib-scroll');
        if (scroller) scroller.scrollLeft = scroller.scrollWidth;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
})();

//Education timeline — click lightbox
(function () {
    const items = Array.from(document.querySelectorAll('.timeline-content[data-image]'));
    const lightbox = document.getElementById('timelineLightbox');
    const lightboxImg = document.getElementById('timelineLightboxImg');
    const lightboxCaption = document.getElementById('timelineLightboxCaption');
    const lightboxClose = document.getElementById('timelineLightboxClose');
    if (!items.length || !lightbox || !lightboxImg || !lightboxCaption || !lightboxClose) return;

    let lastFocused = null;

    function openLightbox(item) {
        lastFocused = document.activeElement;
        lightbox.classList.remove('is-missing');
        lightboxImg.src = item.dataset.image;
        lightboxImg.alt = item.dataset.caption || '';
        lightboxCaption.textContent = item.dataset.caption || '';
        lightbox.classList.add('is-open');
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        if (lastFocused) lastFocused.focus();
    }

    lightboxImg.addEventListener('error', () => lightbox.classList.add('is-missing'));

    items.forEach(item => {
        item.addEventListener('click', () => openLightbox(item));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(item);
            }
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        //Keep Tab inside the dialog: the close button is its only stop.
        if (e.key === 'Tab') {
            e.preventDefault();
            lightboxClose.focus();
        }
    });
})();

//Kit2Code numbers ------------------------------------------------------------
//The three figures count up once, under a second, the first time they are on
//screen. The final text is already in the markup, so without this (or with
//reduced motion) nothing changes.
(function () {
    const stats = document.querySelector('.k2c-stats');
    if (!stats || reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const finalText = stats.textContent;
    const spans = [];
    stats.innerHTML = stats.innerHTML.replace(/\d+/g, n => `<span data-count="${n}">${n}</span>`);
    stats.querySelectorAll('[data-count]').forEach(el => spans.push(el));
    const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const DURATION = 800;
        const tick = now => {
            const t = Math.min(1, (now - start) / DURATION);
            const eased = 1 - Math.pow(1 - t, 3);
            spans.forEach(el => { el.textContent = Math.round(Number(el.dataset.count) * eased); });
            if (t < 1) requestAnimationFrame(tick);
            else stats.textContent = finalText;
        };
        spans.forEach(el => { el.textContent = '0'; });
        requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(stats);
})();

//Terminal widget
(function () {
    const widget = document.getElementById('termWidget');
    const trigger = document.getElementById('termTrigger');
    const panel = document.getElementById('termPanel');
    const closeBtn = document.getElementById('termClose');
    const output = document.getElementById('termOutput');
    const input = document.getElementById('termInput');
    const ghost = document.getElementById('termGhost');
    if (!widget || !trigger || !panel || !closeBtn || !output || !input || !ghost) return;

    const titleEl = document.getElementById('termTitle');

    //Storage can be blocked (private windows, site data off) and can throw on
    //either end, so the terminal only ever treats it as a bonus.
    const HISTORY_KEY = 'freyr-term-history';
    const THEME_KEY = 'freyr-term-theme';
    const HISTORY_KEPT = 50;
    const loadSaved = key => { try { return localStorage.getItem(key); } catch (e) { return null; } };
    const storeSaved = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /*not remembered */ } };

    const cmdHistory = (() => {
        try {
            const saved = JSON.parse(loadSaved(HISTORY_KEY));
            return Array.isArray(saved) ? saved.filter(s => typeof s === 'string').slice(-HISTORY_KEPT) : [];
        } catch (e) {
            return [];
        }
    })();
    //What came back from a past visit, so `neofetch` can count this session alone.
    const restoredCmds = cmdHistory.length;

    let hasBooted = false;
    let historyIndex = cmdHistory.length;
    let mode = 'command';
    //The next line of `vim`'s joke: while set, only :q gets out.
    let trapped = false;
    //While a piped command runs, appendBlock collects its lines here instead of
    //printing them, so `| grep` can filter what the command would have shown.
    let capture = null;
    //What the terminal says when an effect (matrix, sl) ends.
    let fxEndMsg = '';
    let menuIndex = 0;
    let controlsEl = null;
    let gameTotal = 0;
    let gamePending = 0;
    let thinkTimer = null;
    let thinkingEl = null;
    let commitTimer = null;
    let lossTimer = null;
    let stopTimer = null;
    //Any interactive mode can leave work in flight that a timer handle does not
    //describe — a rAF loop, a listener, a node that has to go. Each one parks
    //its own undo here so closing the panel stays a single call rather than a
    //growing list of special cases.
    let activeCleanup = null;
    const BOOT_AT = Date.now();

    //Three games, and freyr wins all three by construction — that is the joke,
    //not a bug. 21 is the misère subtraction game where the multiples of four
    //are the losing seats; rps answers second; guess never commits to a number.
    //Two of the three admit it at the end, because a cheat nobody admits to is
    //just a cheat. Labels are padded here so refreshMenuHighlight can keep
    //prefixing them without knowing about alignment.
    const GAMES = [
        {
            id: '21',
            label: '21    - last to 21 loses',
            intro: ['21 - take turns adding 1-3 to the total. whoever hits 21 loses.',
                    "you go first. lose and you owe me an internship. or a job. i'm flexible ;)"],
            start: () => start21(),
        },
        {
            id: 'rps',
            label: 'rps   - rock paper scissors',
            intro: ['rock paper scissors, best of three.',
                    "i've already locked my moves in. no peeking."],
            start: () => startRps(),
        },
        {
            id: 'guess',
            label: 'guess - i pick a number, you hunt it',
            intro: ["i'm thinking of a number from 1 to 100. you get seven guesses.",
                    "i'll tell you higher or lower. honest."],
            start: () => startGuess(),
        },
    ];

    //Freyr "deliberating" before moving. Randomised so it never reads as a
    //fixed timer, and varied in wording so it never reads as one script.
    const THINK_MIN = 700;
    const THINK_MAX = 1400;
    const THINKING_LINES = [
        'freyr is thinking',
        'counting on fingers',
        'doing the math',
        'hmm',
    ];

    const scrollOut = () => { output.scrollTop = output.scrollHeight; };

    function appendLine(text, className) {
        const line = document.createElement('div');
        line.className = 'term-line' + (className ? ' ' + className : '');
        line.textContent = text;
        output.appendChild(line);
        scrollOut();
        return line;
    }

    function appendBlock(lines, className) {
        const list = Array.isArray(lines) ? lines : [lines];
        if (capture) {
            capture.push(...list);
            return;
        }
        //appendLine already scrolls, so the last line has done it.
        list.forEach(l => appendLine(l, className));
    }

    //`ls` is the one output with colour in it: directories are green, files are
    //not. Each entry is { name, dir }; when a pipe is collecting, they go out
    //as plain lines, one per name, so grep can match them.
    function appendListing(entries) {
        if (capture) {
            capture.push(...entries.map(e => e.name + (e.dir ? '/' : '')));
            return;
        }
        const line = document.createElement('div');
        line.className = 'term-line';
        entries.forEach((e, i) => {
            if (i) line.appendChild(document.createTextNode('  '));
            const span = document.createElement('span');
            if (e.dir) span.className = 'term-dir';
            span.textContent = e.name + (e.dir ? '/' : '');
            line.appendChild(span);
        });
        output.appendChild(line);
        scrollOut();
    }

    //An image is a line too. Scroll again once it has decoded: before that it
    //has no height, so scrolling on append would stop short of it.
    function appendImage(src, alt) {
        const line = document.createElement('div');
        line.className = 'term-line term-line-img';
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.decoding = 'async';
        img.addEventListener('load', scrollOut, { once: true });
        line.appendChild(img);
        output.appendChild(line);
        scrollOut();
        return line;
    }

    //Data readers — DOM is the source of truth, mirrors the tag-filter system's approach
    function readAbout() {
        const name = (document.querySelector('.name-txt')?.textContent || '').replace('_', '').trim();
        const status = document.querySelector('.status-txt')?.innerText.trim() || '';
        const availability = document.querySelector('.availability-txt')?.textContent.trim() || '';
        return [
            `name: ${name}`,
            ...status.split(/\n| · /),
            '',
            availability,
        ];
    }

    function readSkills() {
        return Array.from(document.querySelectorAll('.skill-group')).map(group => {
            const label = group.querySelector('.skill-group-label')?.textContent.trim();
            const tags = Array.from(group.querySelectorAll('.skill-tag')).map(t => t.textContent.trim());
            return `${label}: ${tags.join(', ')}`;
        });
    }

    function readProjects(filterTag) {
        const cards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
        const wanted = filterTag && filterTag.toLowerCase();
        const filtered = wanted
            ? cards.filter(c => tagsOf(c).some(t => t.toLowerCase() === wanted))
            : cards;
        if (!filtered.length) {
            return [filterTag ? `no projects tagged "${filterTag}".` : 'no projects found.'];
        }
        const lines = [];
        filtered.forEach((card, i) => {
            if (i > 0) lines.push('');
            lines.push(...projectLines(card));
        });
        return lines;
    }

    //One card as terminal lines. `projects` prints several of these and a
    //file under ~/projects prints exactly one.
    function projectLines(card) {
        const title = card.querySelector('.project-title')?.textContent.trim();
        const subs = Array.from(card.querySelectorAll('.project-sub')).map(p => p.textContent.trim());
        const link = card.querySelector('.project-img-link')?.getAttribute('href');
        return [title, ...subs.map(s => `  ${s}`), `  stack: ${card.dataset.tags}`, `  link: ${link}`];
    }

    function readEducation() {
        const items = Array.from(
            document.querySelectorAll('.timeline-col[data-track="education"] .timeline-item')
        );
        if (!items.length) return ['no education entries found.'];
        const lines = [];
        items.forEach((item, i) => {
            const year = item.querySelector('.timeline-year')?.textContent.trim();
            const title = item.querySelector('.timeline-title')?.textContent.trim();
            const place = item.querySelector('.timeline-place')?.textContent.trim();
            if (i > 0) lines.push('');
            lines.push(year);
            lines.push(`  ${title} - ${place}`);
        });
        return lines;
    }

    function readContact() {
        const email = document.getElementById('emailBtn')?.dataset.email || 'n/a';
        const discordLink = document.getElementById('discordLink');
        const discord = discordLink
            ? `${discordLink.dataset.handle} · ${discordLink.getAttribute('href')}`
            : 'n/a';
        const github = document.getElementById('githubLink')?.getAttribute('href') || 'n/a';
        const linkedin = document.getElementById('linkedinLink')?.getAttribute('href') || 'n/a';
        const codeforces = document.getElementById('codeforcesLink')?.getAttribute('href') || 'n/a';
        const instagram = document.getElementById('instagramLink')?.getAttribute('href') || 'n/a';
        const facebook = document.getElementById('facebookLink')?.getAttribute('href') || 'n/a';
        const line = document.getElementById('lineLink')?.getAttribute('href') || 'n/a';
        return [
            `email:      ${email}`,
            `github:     ${github}`,
            `linkedin:   ${linkedin}`,
            `codeforces: ${codeforces}`,
            `instagram:  ${instagram}`,
            `facebook:   ${facebook}`,
            `line:       ${line}`,
            `discord:    ${discord}`,
        ];
    }

    //Game: rigged 21 — computer always lands the total on a multiple of 4
    function renderMenu() {
        appendLine("select a game (↑↓ + enter, or click):");
        GAMES.forEach((g, i) => {
            const el = appendLine((i === menuIndex ? '> ' : '  ') + g.label, 'term-menu-item' + (i === menuIndex ? ' is-selected' : ''));
            el.addEventListener('click', () => {
                menuIndex = i;
                confirmMenuSelection();
            });
        });
    }

    function refreshMenuHighlight() {
        const items = output.querySelectorAll('.term-menu-item');
        items.forEach((el, i) => {
            const selected = i === menuIndex;
            el.classList.toggle('is-selected', selected);
            el.textContent = (selected ? '> ' : '  ') + GAMES[i].label;
        });
    }

    //The menu owns the mode switch and the input bookkeeping for every game, so
    //a new game is a row in GAMES rather than another copy of these four lines.
    function confirmMenuSelection() {
        const game = GAMES[menuIndex];
        appendBlock(game.intro);
        cancelActive();
        mode = 'game';
        input.disabled = true;
        input.placeholder = 'use the buttons above ↑';
        game.start();
    }

    function cancelActive() {
        [thinkTimer, commitTimer, lossTimer, stopTimer].forEach(t => {
            if (t !== null) clearTimeout(t);
        });
        thinkTimer = commitTimer = lossTimer = stopTimer = null;
        if (thinkingEl) {
            thinkingEl.remove();
            thinkingEl = null;
        }
        //The row stays in the log as a record of where the game stopped, but its
        //buttons must not stay clickable — their listeners would resume the game.
        if (controlsEl) {
            controlsEl.querySelectorAll('.term-game-btn').forEach(b => { b.disabled = true; });
            controlsEl.classList.remove('is-committing');
            controlsEl = null;
        }
        //Whatever the effect parked here knows how to undo itself; this only has
        //to make sure it runs exactly once.
        if (activeCleanup) {
            const undo = activeCleanup;
            activeCleanup = null;
            undo();
        }
        panel.classList.remove('is-flash');
    }

    //Every way out of a game or the menu has to put the same four pieces of
    //state back. Four hand-written copies is four chances to forget one.
    function exitToCommandMode() {
        mode = 'command';
        controlsEl = null;
        input.disabled = false;
        input.placeholder = '';
        //The hint is suppressed outside command mode, so coming back has to be
        //the moment it is allowed to reappear.
        applyGhost();
    }

    function popButton(btn) {
        if (reducedMotion.matches) return;
        btn.classList.remove('is-hit');
        void btn.offsetWidth;              //restart the animation on rapid clicks
        btn.classList.add('is-hit');
    }

    function floatGain(btn, text) {
        if (reducedMotion.matches) return;
        const float = document.createElement('span');
        float.className = 'term-float';
        float.textContent = text;
        btn.appendChild(float);
        float.addEventListener('animationend', () => float.remove());
    }

    function start21() {
        gameTotal = 0;
        renderPlayerTurn();
    }

    function renderPlayerTurn() {
        gamePending = 0;
        const line = document.createElement('div');
        line.className = 'term-line term-game-controls';
        line.innerHTML = `
            <span class="term-game-status">total: ${gameTotal} - adding: 0</span>
            <button type="button" class="term-game-btn" data-action="add">+1</button>
            <button type="button" class="term-game-btn term-game-done" data-action="done" disabled>done</button>
        `;
        output.appendChild(line);
        scrollOut();
        controlsEl = line;

        const addBtn = line.querySelector('[data-action="add"]');
        const doneBtn = line.querySelector('[data-action="done"]');
        const status = line.querySelector('.term-game-status');

        function finishTurn() {
            addBtn.disabled = true;
            doneBtn.disabled = true;
            const played = gamePending;

            //As with the thinking pause, the total only advances once the result
            //is on screen, so forfeiting mid-commit leaves the score consistent.
            const settle = () => {
                commitTimer = null;
                gameTotal += played;
                const summary = document.createElement('div');
                summary.className = 'term-line term-line-commit';
                summary.textContent = `you added ${played} → total: ${gameTotal}`;
                line.replaceWith(summary);
                scrollOut();
                controlsEl = null;
                if (gameTotal >= 21) {
                    triggerLossEffect();
                } else {
                    computerTurn();
                }
            };

            //This hold exists only so the flash is visible, so it goes away with
            //motion — unlike the thinking pause, which is game pacing and stays.
            if (reducedMotion.matches) {
                settle();
                return;
            }
            line.classList.add('is-committing');
            commitTimer = setTimeout(settle, 260);
        }

        addBtn.addEventListener('click', () => {
            popButton(addBtn);
            floatGain(addBtn, '+1');
            gamePending = Math.min(3, gamePending + 1);
            status.textContent = `total: ${gameTotal} - adding: ${gamePending}`;
            doneBtn.disabled = false;
            if (gamePending >= 3) addBtn.disabled = true;
            if (gameTotal + gamePending >= 21) {
                finishTurn();
            }
        });
        doneBtn.addEventListener('click', () => {
            popButton(doneBtn);
            finishTurn();
        });
    }

    function triggerLossEffect() {
        panel.classList.add('is-flash');
        lossTimer = setTimeout(() => {
            lossTimer = null;
            panel.classList.remove('is-flash');
            endGame([
                '💀 total hit 21 - you lose.',
                "per the house rules you now owe freyr an internship (or a job, i'm not picky).",
                "type 'game' to run it back.",
            ]);
        }, 380);
    }

    function computerTurn() {
        const move = 4 - (gameTotal % 4);
        const label = THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)];

        thinkingEl = appendLine('', 'term-thinking');
        thinkingEl.innerHTML = `${label}<span class="term-thinking-dots">...</span>`;

        //The total only advances once the move is on screen, so forfeiting
        //mid-think can never leave the state ahead of what the player saw.
        thinkTimer = setTimeout(() => {
            thinkTimer = null;
            const settled = thinkingEl;
            thinkingEl = null;

            gameTotal += move;
            const line = document.createElement('div');
            line.className = 'term-line';
            line.textContent = `freyr added ${move} → total: ${gameTotal}`;
            settled.replaceWith(line);
            scrollOut();

            if (gameTotal >= 21) {
                endGame(["...that shouldn't have happened. well played."]);
            } else {
                renderPlayerTurn();
            }
        }, THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN));
    }

    //The closing copy belongs to whichever game just finished, so this only
    //owns the part every ending shares: say the words, hand the prompt back.
    function endGame(lines) {
        appendBlock(lines);
        exitToCommandMode();
        appendLine('');
        input.focus();
    }

    //Game: rock paper scissors, rigged by answering second -------------------
    const RPS_BEATS = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
    let rpsRound = 0;

    function startRps() {
        rpsRound = 0;
        renderRpsTurn();
    }

    function renderRpsTurn() {
        const line = document.createElement('div');
        line.className = 'term-line term-game-controls';
        line.innerHTML = `
            <span class="term-game-status">round ${rpsRound + 1} of 3 - your move:</span>
            <button type="button" class="term-game-btn is-choice" data-action="rock">rock</button>
            <button type="button" class="term-game-btn is-choice" data-action="paper">paper</button>
            <button type="button" class="term-game-btn is-choice" data-action="scissors">scissors</button>
        `;
        output.appendChild(line);
        scrollOut();
        controlsEl = line;

        line.querySelectorAll('.term-game-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pick = btn.dataset.action;
                popButton(btn);
                floatGain(btn, pick);
                line.querySelectorAll('.term-game-btn').forEach(b => { b.disabled = true; });

                //Same shape as 21's finishTurn: nothing advances until the result
                //is on screen, so forfeiting mid-commit leaves the score honest.
                const settle = () => {
                    commitTimer = null;
                    const summary = document.createElement('div');
                    summary.className = 'term-line term-line-commit';
                    summary.textContent = `you played ${pick}`;
                    line.replaceWith(summary);
                    scrollOut();
                    controlsEl = null;
                    rpsAnswer(pick);
                };

                if (reducedMotion.matches) {
                    settle();
                    return;
                }
                line.classList.add('is-committing');
                commitTimer = setTimeout(settle, 260);
            });
        });
    }

    function rpsAnswer(pick) {
        //The gimmick, and the whole joke: freyr said he locked his move in before
        //you chose. He did not. He answers after, which is why the scoreline
        //never moves. The thinking pause is what sells it — a real opponent
        //would need a moment here too.
        const move = RPS_BEATS[pick];
        const label = THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)];

        thinkingEl = appendLine('', 'term-thinking');
        thinkingEl.innerHTML = `${label}<span class="term-thinking-dots">...</span>`;

        thinkTimer = setTimeout(() => {
            thinkTimer = null;
            const settled = thinkingEl;
            thinkingEl = null;

            rpsRound += 1;
            const line = document.createElement('div');
            line.className = 'term-line';
            line.textContent = `freyr played ${move} → ${move} beats ${pick}. ${rpsRound}-0.`;
            settled.replaceWith(line);
            scrollOut();

            if (rpsRound >= 3) {
                endGame([
                    '3-0. you may have noticed i always move second.',
                    "that's not a bug, that's the house edge.",
                    "type 'game' to run it back anyway.",
                ]);
            } else {
                renderRpsTurn();
            }
        }, THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN));
    }

    //Game: guess, rigged by never committing to a number ---------------------
    //There is no number. The range is the whole game: every answer keeps the
    //larger half of it alive, so seven guesses can never close it. Same trick as
    //adversarial hangman, and the ending admits it — the joke only lands if it
    //is owned up to.
    let guessLo = 1;
    let guessHi = 100;
    let guessesLeft = 7;
    let guessPending = 50;

    function startGuess() {
        guessLo = 1;
        guessHi = 100;
        guessesLeft = 7;
        guessPending = 50;
        renderGuessTurn();
    }

    function renderGuessTurn() {
        //The pending value is clamped into the range that is still alive, so a
        //guess can never fall outside it — an answer of "higher" to a guess of
        //100 would show the seams immediately.
        guessPending = Math.min(guessHi, Math.max(guessLo, guessPending));

        const line = document.createElement('div');
        line.className = 'term-line term-game-controls';
        line.innerHTML = `
            <span class="term-game-status">guess: ${guessPending} - ${guessesLeft} left</span>
            <button type="button" class="term-game-btn" data-step="-10">-10</button>
            <button type="button" class="term-game-btn" data-step="-1">-1</button>
            <button type="button" class="term-game-btn" data-step="1">+1</button>
            <button type="button" class="term-game-btn" data-step="10">+10</button>
            <button type="button" class="term-game-btn is-choice" data-action="guess">guess</button>
        `;
        output.appendChild(line);
        scrollOut();
        controlsEl = line;

        const status = line.querySelector('.term-game-status');
        line.querySelectorAll('[data-step]').forEach(btn => {
            btn.addEventListener('click', () => {
                popButton(btn);
                const step = Number(btn.dataset.step);
                guessPending = Math.min(guessHi, Math.max(guessLo, guessPending + step));
                status.textContent = `guess: ${guessPending} - ${guessesLeft} left`;
            });
        });

        const goBtn = line.querySelector('[data-action="guess"]');
        goBtn.addEventListener('click', () => {
            popButton(goBtn);
            floatGain(goBtn, String(guessPending));
            line.querySelectorAll('.term-game-btn').forEach(b => { b.disabled = true; });

            const played = guessPending;
            const settle = () => {
                commitTimer = null;
                const summary = document.createElement('div');
                summary.className = 'term-line term-line-commit';
                summary.textContent = `you guessed ${played}`;
                line.replaceWith(summary);
                scrollOut();
                controlsEl = null;
                guessAnswer(played);
            };

            if (reducedMotion.matches) {
                settle();
                return;
            }
            line.classList.add('is-committing');
            commitTimer = setTimeout(settle, 260);
        });
    }

    function guessAnswer(played) {
        const label = THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)];
        thinkingEl = appendLine('', 'term-thinking');
        thinkingEl.innerHTML = `${label}<span class="term-thinking-dots">...</span>`;

        thinkTimer = setTimeout(() => {
            thinkTimer = null;
            const settled = thinkingEl;
            thinkingEl = null;

            //Keep whichever half is bigger. That is the entire cheat.
            const goLower = (played - guessLo) > (guessHi - played);
            if (goLower) guessHi = played - 1;
            else guessLo = played + 1;
            guessesLeft -= 1;

            const line = document.createElement('div');
            line.className = 'term-line';
            line.textContent = goLower ? 'lower.' : 'higher.';
            settled.replaceWith(line);
            scrollOut();

            if (guessesLeft <= 0 || guessLo > guessHi) {
                const reveal = guessLo > guessHi
                    ? played
                    : guessLo + Math.floor((guessHi - guessLo) / 2);
                endGame([
                    `out of guesses. it was ${reveal}.`,
                    '...it was whatever it needed to be. i never wrote one down.',
                    "type 'game' to be lied to again.",
                ]);
            } else {
                renderGuessTurn();
            }
        }, THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN));
    }

    function cmdGame() {
        mode = 'menu';
        menuIndex = 0;
        input.disabled = true;
        input.placeholder = '↑↓ to choose, enter to select';
        renderMenu();
        return null;
    }

    //Commands that reach out of the widget and move the page ------------------

    const SECTIONS = {
        about: 'about', home: 'about', projects: 'projects',
        organizing: 'organizing', contests: 'organizing', kit2code: 'organizing',
        background: 'background',
    };
    const narrow = window.matchMedia('(max-width: 768px)');

    function cmdGoto(args) {
        const key = (args[0] || '').toLowerCase();
        const id = key === 'top' ? null : SECTIONS[key];
        if (key !== 'top' && !id) {
            return `goto: no section "${args[0] || ''}". try: about, projects, organizing, background, top.`;
        }
        //Below 768px the panel is fixed to the whole viewport, so scrolling
        //behind it would look like nothing happened at all.
        const hidden = narrow.matches;
        if (hidden) closeTerminal();
        if (key === 'top') window.scrollTo({ top: 0, behavior: scrollBehavior() });
        else document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
        return hidden ? null : `scrolling to ${key === 'top' ? 'the top' : '#' + id}...`;
    }

    //The translate button owns the language flip *and* the hero scramble that
    //goes with it. Calling i18n.toggle() straight would move the state without
    //ever running that animation, so this clicks the button a visitor would.
    function cmdLang(args) {
        const want = (args[0] || '').toLowerCase();
        if (want && want !== 'en' && want !== 'th') return `lang: "${args[0]}"? i speak 'en' and 'th'.`;
        if (want && want === i18n.lang) return `already ${want}.`;
        const next = want || (i18n.lang === 'en' ? 'th' : 'en');
        document.getElementById('translateBtn')?.click();
        return `switched to ${next}.`;
    }

    function cmdOpen(args) {
        const target = (args[0] || '').toLowerCase();
        if (target === 'email') {
            const email = document.getElementById('emailBtn')?.dataset.email;
            if (!email) return 'open: no email on the page.';
            window.location.href = `mailto:${email}`;
            return `opening a mail draft to ${email}...`;
        }
        const ids = {
            github: 'githubLink', linkedin: 'linkedinLink', codeforces: 'codeforcesLink',
            instagram: 'instagramLink', facebook: 'facebookLink', line: 'lineLink',
            discord: 'discordLink',
        };
        const href = ids[target] ? document.getElementById(ids[target])?.getAttribute('href') : null;
        if (!href) return "open: try 'open github', 'open linkedin', 'open codeforces', 'open instagram', 'open facebook', 'open line', 'open discord' or 'open email'.";
        window.open(href, '_blank', 'noopener,noreferrer');
        return `opening ${target}...`;
    }

    //Reads the rendered grid rather than data/contributions.json: that file is
    //generated into the Pages artifact by CI and is an empty calendar in the
    //working tree, so the JSON would print a blank year everywhere but prod.
    function cmdContrib() {
        const cells = Array.from(document.querySelectorAll('#contribGrid .contrib-cell'));
        if (!cells.length) return 'contrib: no calendar on the page yet.';

        const BLOCKS = ['·', '░', '▒', '▓', '█'];
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

        //Seven rows, one per weekday, weeks running left to right — the same
        //shape as the grid on the page, just spelled out in characters.
        const rows = [];
        for (let day = 0; day < 7; day++) {
            rows.push('  ' + weeks.map(w => {
                const cell = w[day];
                if (!cell || cell.classList.contains('is-empty')) return ' ';
                return BLOCKS[Number(cell.dataset.level) || 0];
            }).join(''));
        }
        //springs.js may be mid-count on these, or parked at 0 until they scroll
        //into view; it keeps the real figure in data-final while it does.
        const stat = id => {
            const el = document.getElementById(id);
            return (el && (el.dataset.final || el.textContent)) || '?';
        };
        const total = stat('contribTotal');
        const streak = stat('contribCurrent');
        return [`${total} contributions in the last year`, '', ...rows, '', `current streak: ${streak}`];
    }

    //Easter eggs -------------------------------------------------------------

    //Reads the same DOM the hero does, so it can never disagree with the page.
    function cmdNeofetch() {
        const name = (document.querySelector('.name-txt')?.textContent || '').replace('_', '').trim();
        //The status line is two lines of hero copy joined by a <br>, so it comes
        //back as one long run. Everything here is cut to fit instead: the panel
        //is 340px at its narrowest, which is about 35 characters, and a card you
        //have to scroll sideways is not a card.
        const status = (document.querySelector('.status-txt')?.textContent || '')
            .replace(/\s+/g, ' ')
            .split('@')[0]
            .trim();
        const role = status.length > 16 ? status.slice(0, 15).trimEnd() + '…' : status;
        const info = [
            'guest@freyr',
            '───────────',
            'host:   miyazaki1072',
            'shell:  term.js',
            `name:   ${name}`,
            `role:   ${role}`,
            `lang:   ${i18n.lang}`,
            `uptime: ${sessionAge()}`,
            `cmds:   ${sessionCmds()}`,
            `theme:  ${widget.dataset.theme || 'green'} on black`,
        ];
        const art = [
            ' ╭──────╮ ',
            ' │ >_   │ ',
            ' │      │ ',
            ' ╰──────╯ ',
            '  ╱    ╲  ',
            ' ╱      ╲ ',
        ];
        const rows = Math.max(art.length, info.length);
        const out = [];
        for (let i = 0; i < rows; i++) out.push((art[i] || '          ') + (info[i] || ''));
        return out;
    }

    //A cat, not a cow — the widget already has one perched on it.
    function cmdCowsay(args) {
        const text = args.join(' ').slice(0, 40) || 'say something.';
        const bar = '─'.repeat(text.length + 2);
        return [
            ` ╭${bar}╮`,
            ` │ ${text} │`,
            ` ╰${bar}╯`,
            '    ╲',
            '     ╲  ╱\\_/\\',
            '        ( o.o )',
            '         > ^ <',
        ];
    }

    //The one command that animates instead of printing. It rewrites a node ~18
    //times a second, so that node is kept out of the accessibility tree
    //entirely — #termOutput is a polite live region and would otherwise try to
    //announce every single frame.
    function cmdMatrix() {
        const COLS = 32;
        const ROWS = 12;
        const pool = CHARS.en;
        const rain = document.createElement('div');
        rain.className = 'term-line term-rain';
        rain.setAttribute('aria-hidden', 'true');
        output.appendChild(rain);
        scrollOut();

        const drops = Array.from({ length: COLS }, () => Math.floor(Math.random() * ROWS));
        const draw = () => {
            const grid = [];
            for (let r = 0; r < ROWS; r++) {
                let row = '';
                for (let c = 0; c < COLS; c++) {
                    const head = drops[c];
                    row += (r > head || r < head - 6)
                        ? ' '
                        : pool[Math.floor(Math.random() * pool.length)];
                }
                grid.push(row);
            }
            rain.textContent = grid.join('\n');
        };

        //Reduced motion still gets the joke, just as a still.
        if (reducedMotion.matches) {
            draw();
            return 'wake up, neo. (one frame - you asked for less motion.)';
        }

        mode = 'fx';
        fxEndMsg = '...you were never really in there.';
        input.disabled = true;
        input.placeholder = 'press any key to wake up';

        let raf = null;
        let last = 0;
        const step = (now) => {
            if (now - last > 55) {
                last = now;
                for (let c = 0; c < COLS; c++) {
                    drops[c] = drops[c] > ROWS + 6 ? 0 : drops[c] + 1;
                }
                draw();
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);

        activeCleanup = () => {
            if (raf !== null) cancelAnimationFrame(raf);
            raf = null;
            rain.remove();
        };
        stopTimer = setTimeout(() => { stopTimer = null; stopFx(); }, 4200);
        return null;
    }

    function stopFx() {
        cancelActive();
        exitToCommandMode();
        appendLine(fxEndMsg);
        input.focus();
    }

    //File system --------------------------------------------------------------
    //A small pretend home directory. It is built from the page every time it is
    //asked for, so a file can never disagree with the card or column it was
    //read from, and nothing here is stored.
    const slugOf = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const cwdParts = [];

    function buildFs() {
        const dir = children => ({ dir: true, children });
        const file = read => ({ dir: false, read });

        const projects = {};
        document.querySelectorAll('.project-card[data-tags]').forEach(card => {
            const title = card.querySelector('.project-title')?.textContent.trim();
            if (title) projects[`${slugOf(title)}.md`] = file(() => projectLines(card));
        });

        const education = {};
        document.querySelectorAll('.timeline-col[data-track="education"] .timeline-item').forEach(item => {
            const year = item.querySelector('.timeline-year')?.textContent.trim();
            const title = item.querySelector('.timeline-title')?.textContent.trim();
            const place = item.querySelector('.timeline-place')?.textContent.trim();
            if (place) education[`${slugOf(place)}.txt`] = file(() => [year, `${title} - ${place}`].filter(Boolean));
        });

        return dir({
            'about.txt': file(readAbout),
            'skills.txt': file(readSkills),
            'contact.txt': file(readContact),
            projects: dir(projects),
            education: dir(education),
            '.secret': file(() => ['some commands never made it into help.', 'try the names of the old gods.']),
        });
    }

    //Walks a path from the current folder. `~` and a leading `/` both mean the
    //root, since there is nowhere else to stand. Returns null for a miss.
    function resolvePath(arg, root) {
        const text = arg || '';
        const absolute = text === '~' || text.startsWith('~/') || text.startsWith('/');
        const parts = absolute ? [] : cwdParts.slice();
        for (const seg of text.replace(/^~/, '').split('/')) {
            if (!seg || seg === '.') continue;
            if (seg === '..') { parts.pop(); continue; }
            parts.push(seg);
        }
        let node = root;
        for (const seg of parts) {
            if (!node.dir || !Object.hasOwn(node.children, seg)) return null;
            node = node.children[seg];
        }
        return { node, parts };
    }

    const homePath = parts => '~' + parts.map(p => '/' + p).join('');
    const syncPrompt = () => {
        if (titleEl) titleEl.textContent = `> guest@freyr:${homePath(cwdParts)}$`;
    };

    //Folders first, then alphabetical; dotfiles only when asked for.
    function namesIn(node, all) {
        return Object.keys(node.children)
            .filter(n => all || !n.startsWith('.'))
            .sort((a, b) => (node.children[b].dir - node.children[a].dir) || a.localeCompare(b));
    }

    function cmdLs(args) {
        const all = args.some(a => a.startsWith('-') && a.includes('a'));
        const target = args.find(a => !a.startsWith('-'));
        const hit = resolvePath(target, buildFs());
        if (!hit) return `ls: cannot access '${target}': no such file or directory`;
        if (!hit.node.dir) return target;
        const entries = namesIn(hit.node, all).map(name => ({ name, dir: hit.node.children[name].dir }));
        if (entries.length) appendListing(entries);
        return null;
    }

    function cmdCd(args) {
        const target = args[0];
        const hit = resolvePath(target === undefined ? '~' : target, buildFs());
        if (!hit) return `cd: no such directory: ${target}`;
        if (!hit.node.dir) return `cd: not a directory: ${target}`;
        cwdParts.splice(0, cwdParts.length, ...hit.parts);
        syncPrompt();
        return null;
    }

    const cmdPwd = () => '/home/guest' + cwdParts.map(p => '/' + p).join('');

    function cmdTree(args) {
        const all = args.includes('-a');
        const target = args.find(a => !a.startsWith('-'));
        const hit = resolvePath(target, buildFs());
        if (!hit) return `tree: ${target}: no such directory`;
        if (!hit.node.dir) return `tree: ${target}: not a directory`;
        const counts = { dirs: 0, files: 0 };
        const walk = (node, prefix) => namesIn(node, all).flatMap((name, i, list) => {
            const child = node.children[name];
            const last = i === list.length - 1;
            counts[child.dir ? 'dirs' : 'files']++;
            const line = `${prefix}${last ? '└── ' : '├── '}${name}${child.dir ? '/' : ''}`;
            return child.dir ? [line, ...walk(child, prefix + (last ? '    ' : '│   '))] : [line];
        });
        const lines = walk(hit.node, '');
        const { dirs, files } = counts;
        return [homePath(hit.parts), ...lines, '',
                `${dirs} director${dirs === 1 ? 'y' : 'ies'}, ${files} file${files === 1 ? '' : 's'}`];
    }

    function catFiles(names) {
        const root = buildFs();
        return names.flatMap(name => {
            const hit = resolvePath(name, root);
            if (!hit) return [`cat: ${name}: no such file or directory`];
            if (hit.node.dir) return [`cat: ${name}: is a directory`];
            return hit.node.read();
        });
    }

    //Candidates are whole words, because the completer swaps the word under the
    //cursor for their common prefix. A folder keeps its trailing slash so the
    //next Tab goes one level deeper.
    function completePath(partial, dirsOnly) {
        if (partial.startsWith('-')) return [];
        const slash = partial.lastIndexOf('/');
        const base = partial.slice(0, slash + 1);
        const stem = partial.slice(slash + 1).toLowerCase();
        const hit = resolvePath(base, buildFs());
        if (!hit || !hit.node.dir) return [];
        return namesIn(hit.node, stem.startsWith('.'))
            .filter(n => n.toLowerCase().startsWith(stem) && (!dirsOnly || hit.node.children[n].dir))
            .map(n => base + n + (hit.node.children[n].dir ? '/' : ''));
    }

    //Every file under a node, as paths. `rm -rf /` reads its victims from here.
    function listPaths(node, base) {
        return Object.keys(node.children).flatMap(name => {
            const child = node.children[name];
            return child.dir ? listPaths(child, `${base}/${name}`) : [`${base}/${name}`];
        });
    }

    //Shell basics -------------------------------------------------------------

    function sessionAge() {
        const elapsed = Date.now() - BOOT_AT;
        return `${Math.floor(elapsed / 60000)}m ${Math.floor(elapsed / 1000) % 60}s`;
    }
    const sessionCmds = () => cmdHistory.length - restoredCmds;

    function cmdHistoryList() {
        if (!cmdHistory.length) return 'history: nothing yet.';
        return cmdHistory.map((c, i) => `${String(i + 1).padStart(3)}  ${c}`);
    }

    const cmdDate = () => new Date().toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const cmdUptime = () => `up ${sessionAge()}, ${sessionCmds()} command${sessionCmds() === 1 ? '' : 's'}`;

    function cmdMan(args) {
        const name = (args[0] || '').toLowerCase();
        if (!name) return "man: which manual page? try 'man ls'.";
        const entry = commandMap.get(name);
        if (!entry || entry.hidden) return `man: no manual entry for ${args[0]}`;
        return [
            `${entry.name.toUpperCase()}(1)`,
            '',
            `  ${`${entry.name} ${entry.args || ''}`.trim()}`,
            '',
            ...(entry.man || [entry.help]).map(l => `  ${l}`),
        ];
    }

    //Green is the default and has no attribute: the stylesheet only recolours
    //when data-theme is set, which keeps rune mode working on the default.
    const THEMES = ['green', 'amber', 'blue', 'pink'];
    function applyTheme(name) {
        if (name === 'green') widget.removeAttribute('data-theme');
        else widget.dataset.theme = name;
    }
    const savedTheme = loadSaved(THEME_KEY);
    if (THEMES.includes(savedTheme)) applyTheme(savedTheme);

    function cmdTheme(args) {
        const want = (args[0] || '').toLowerCase();
        if (!want) return [`theme: ${widget.dataset.theme || 'green'}`, `try: ${THEMES.join(', ')}`];
        if (!THEMES.includes(want)) return `theme: no "${args[0]}". try: ${THEMES.join(', ')}.`;
        applyTheme(want);
        storeSaved(THEME_KEY, want);
        return `theme: ${want}.`;
    }

    //Fun ----------------------------------------------------------------------
    //Everything from here down is hidden: out of help and out of Tab, so finding
    //one is still finding something.

    const FORTUNES = [
        ['it works on my machine.', 'ship the machine.'],
        ['a bug is a feature', 'with no marketing.'],
        ['tabs or spaces:', 'both are wrong at 3am.'],
        ['the cat reviewed your code.', 'it is unimpressed.'],
        ['git push --force is a', 'personality, not a plan.'],
        ['O(n) is fine', 'until n is the internet.'],
        //Quoted from the same public-domain translations as `freyr`.
        ['"Of the heroes brave is Freyr', ' the best"', '  — Lokasenna 37'],
        ['"he rules over the rain and the', ' shining of the sun"', '  — Gylfaginning 24'],
    ];

    function cmdRm(args) {
        if (!args.length) return 'rm: missing operand';
        const recursive = args.some(a => /^-[a-z]*r/i.test(a));
        const everything = args.some(a => ['/', '/*', '~', '~/', '~/*', '*'].includes(a));
        if (recursive && everything) {
            return [
                ...listPaths(buildFs(), '~').map(p => `removed '${p}'`),
                "removed '~'",
                '',
                'just kidding. this is a static site;',
                'nothing was harmed.',
            ];
        }
        return `rm: cannot remove '${args[args.length - 1]}': read-only file system`;
    }

    function cmdPing(args) {
        const host = (args[0] || 'freyr').slice(0, 24);
        const ms = () => (Math.random() * 0.8 + 0.1).toFixed(2);
        return [
            `PING ${host}: 56 data bytes`,
            ...[0, 1, 2].map(i => `64 bytes: seq=${i} time=${ms()} ms`),
            '',
            '3 packets sent, 3 received, 0% loss',
            '(he was already here.)',
        ];
    }

    function cmdHire() {
        const availability = document.querySelector('.availability-txt')?.textContent.trim();
        return ['good choice.', ...(availability ? [availability] : []), cmdOpen(['email'])];
    }

    const COFFEE = [
        "418 i'm a teapot.",
        '',
        '    ( (',
        '     ) )',
        '  ........',
        '  |      |]',
        '  \\      /',
        "   `----'",
    ];

    //Four rows, padded to one width so the slide can cut them all the same way.
    const TRAIN = [
        '   (@@)    ______________________',
        '  (    )  | [] [] [] [] [] [] [] |',
        ' =========|______________________|',
        '  O  O  O    O  O      O  O  O  O',
    ];

    //An effect that animates instead of printing. It rewrites one node every
    //frame, so that node stays out of the accessibility tree.
    function cmdSl() {
        const COLS = 34;
        const width = Math.max(...TRAIN.map(r => r.length));
        const art = TRAIN.map(r => r.padEnd(width));
        if (reducedMotion.matches) {
            appendBlock(art, 'term-line-art');
            return 'choo choo. (one frame - you asked for less motion.)';
        }
        const train = document.createElement('div');
        train.className = 'term-line term-rain';
        train.setAttribute('aria-hidden', 'true');
        output.appendChild(train);
        scrollOut();

        mode = 'fx';
        fxEndMsg = 'choo choo.';
        input.disabled = true;
        input.placeholder = 'press any key to stop the train';

        let x = COLS;
        let raf = null;
        let last = 0;
        const step = (now) => {
            if (now - last > 45) {
                last = now;
                x -= 1;
                if (x < -width) {
                    stopFx();
                    return;
                }
                train.textContent = art
                    .map(r => (' '.repeat(Math.max(0, x)) + r.slice(Math.max(0, -x))).slice(0, COLS))
                    .join('\n');
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);

        activeCleanup = () => {
            if (raf !== null) cancelAnimationFrame(raf);
            raf = null;
            train.remove();
        };
        return null;
    }

    //One table, three consumers. `help`, tab-completion and the did-you-mean
    //suggestion each used to keep their own copy of this list, and the copies
    //drifted — `about` and `sudo` were live commands that help never mentioned.
    //Now they all read the same rows.
    const COMMANDS = [
        //Help text is kept short on purpose: the panel is as narrow as 340px,
        //and a description that wraps takes the aligned column with it.
        { name: 'help',      args: '',      help: 'show this list',      run: () => renderHelp() },
        { name: 'whoami',    args: '',      help: 'who am i',            run: () => readAbout(), alias: ['about'] },
        { name: 'skills',    args: '',      help: 'tech stack',          run: () => readSkills() },
        //`complete` is the per-command half of Tab: given the word under the
        //cursor, it returns whole candidate words. A command without one
        //completes its name only.
        { name: 'projects',  args: '[tag]', help: "things i've built",   run: (a) => readProjects(a[0]),
          man: ['list projects. a tag shows', 'only those built with it.', '', 'try: projects | grep stack'],
          //The tags the cards actually carry, so the shell can never offer a
          //filter that would come back empty.
          complete: partial => {
              const tags = new Set();
              document.querySelectorAll('.project-card[data-tags]')
                  .forEach(card => tagsOf(card).forEach(t => tags.add(t)));
              return [...tags].filter(t => t.toLowerCase().startsWith(partial.toLowerCase())).sort();
          } },
        { name: 'education', args: '',      help: 'where i studied',     run: () => readEducation() },
        { name: 'contact',   args: '',      help: 'how to reach me',     run: () => readContact() },
        //From the Freyr research in .claude/plans/freyr_reseach.md.
        { name: 'sword',     args: '',      help: "freyr's sword",
          run: () => [
              'no name in any old source.',
              'it fights the giants by itself, if he is wise who wields it.',
              'he gave it to skirnir to win gerdr,',
              'and met surtr at ragnarok without it.',
          ] },
        { name: 'boar',      args: '',      help: 'gullinbursti',
          run: () => [
              'gullinbursti, "golden-bristled".',
              'made by the dwarves brokkr and eitri.',
              'runs over air and sea faster than any horse.',
              'its bristles light the dark.',
          ] },
        { name: 'alfheim',   args: '',      help: "freyr's realm",
          run: () => [
              'alfheimr, the world of the elves.',
              'the gods gave it to freyr as a tooth-gift,',
              'the present for a first tooth.',
          ] },
        { name: 'contrib',   args: '',      help: 'activity heatmap',    run: () => cmdContrib() },
        { name: 'ls',        args: '[-a] [dir]', help: 'list files',
          run: (a) => cmdLs(a), complete: p => completePath(p, false),
          man: ['list what is in a folder.', '', '  -a  show hidden files', '', 'try: ls projects'] },
        { name: 'cd',        args: '[dir]', help: 'change folder',
          run: (a) => cmdCd(a), complete: p => completePath(p, true),
          man: ['change folder. no argument', 'goes home.', '', '  cd ..  up one level', '  cd ~   home'] },
        { name: 'pwd',       args: '',      help: 'where am i',          run: () => cmdPwd() },
        { name: 'tree',      args: '[dir]', help: 'folder tree',
          run: (a) => cmdTree(a), complete: p => completePath(p, true),
          man: ['draw the folders as a tree.', '', '  -a  include hidden files'] },
        { name: 'cat',       args: '[file]', help: 'read file or cat',
          man: ['print a file. with no file,', 'shows a photo of the cat.', '', 'try: cat about.txt'],
          complete: p => completePath(p, false),
          run: (a) => {
              if (a.length) return catFiles(a);
              const { src, alt } = CAT_PHOTOS[Math.floor(Math.random() * CAT_PHOTOS.length)];
              appendImage(src, alt);
              return null;
          } },
        { name: 'history',   args: '',      help: 'past commands',       run: () => cmdHistoryList(),
          man: ['numbered past commands,', 'kept between visits.', '', '  !!  run the last one again', '  !3  run number 3'] },
        { name: 'echo',      args: '<text>', help: 'repeat text',        run: (a) => a.length ? a.join(' ') : null },
        { name: 'date',      args: '',      help: 'date and time',       run: () => cmdDate() },
        { name: 'uptime',    args: '',      help: 'time in terminal',    run: () => cmdUptime() },
        { name: 'man',       args: '<cmd>', help: 'command manual',
          run: (a) => cmdMan(a),
          complete: p => COMMANDS.filter(c => !c.hidden && c.name.startsWith(p.toLowerCase())).map(c => c.name) },
        { name: 'theme',     args: '[name]', help: 'terminal colour',
          run: (a) => cmdTheme(a), complete: p => THEMES.filter(t => t.startsWith(p.toLowerCase())),
          man: ['recolour the terminal.', 'green, amber, blue or pink.', 'remembered for next visit.'] },
        { name: 'game',      args: '',      help: 'play a game',        noPipe: true, run: () => cmdGame() },
        { name: 'goto',      args: '<where>',   help: 'jump to a section', run: (a) => cmdGoto(a) },
        { name: 'lang',      args: '[en|th]',   help: 'switch language',   run: (a) => cmdLang(a) },
        { name: 'open',      args: '<link>',    help: 'open a link',       run: (a) => cmdOpen(a) },
        { name: 'matrix',    args: '',      help: 'follow the rabbit',   noPipe: true, run: () => cmdMatrix() },
        { name: 'neofetch',  args: '',      help: 'system info',
          run: () => { appendBlock(cmdNeofetch(), 'term-line-art'); return null; } },
        { name: 'cowsay',    args: '<text>', help: 'the cat says it',
          run: (a) => { appendBlock(cmdCowsay(a), 'term-line-art'); return null; } },
        { name: 'clear',     args: '',      help: 'clear the screen',    noPipe: true, run: () => { output.innerHTML = ''; return null; } },
        { name: 'exit',      args: '',      help: 'close the panel',     noPipe: true, run: () => { closeTerminal(); return null; } },
        //Hidden: kept out of help and out of tab-completion, so finding one is
        //still finding something.
        { name: 'freyr', hidden: true, alias: ['yngvi'],
          run: () => {
              //Short lines from public-domain translations: Snorri's Gylfaginning
              //(Brodeur 1916) and the Poetic Edda (Bellows 1923).
              //Wrapped to 34 columns: the panel is about 35 characters wide at its
              //narrowest, and a quote that runs off the edge loses its citation.
              //Gaps are a no-break space because an empty line collapses.
              appendBlock([
                  'ᚠᚱᛅᛁᛦ · Freyr of the Vanir,',
                  'son of Njörðr.',
                  ' ',
                  '"he rules over the rain and the',
                  ' shining of the sun, and',
                  ' therewithal the fruit of the',
                  ' earth"  — Gylfaginning 24',
                  ' ',
                  'his boar Gullinbursti lights',
                  'the dark; his ship Skíðblaðnir',
                  'folds away into a pouch.',
                  'he gave his sword for Gerðr,',
                  'and meets Surtr without it.',
                  ' ',
                  '"Of the heroes brave is Freyr',
                  ' the best"  — Lokasenna 37',
              ], 'term-line-art');
              return runeMode.begin() ? 'ᛜ the runes wake.' : 'ᛜ the runes are already awake.';
          } },
        { name: 'rm', hidden: true, run: (a) => cmdRm(a) },
        //The trap is a flag the next lines check: only :q gets out, and closing
        //the panel lets go of it as well.
        { name: 'vim', hidden: true, noPipe: true, alias: ['vi', 'nvim'],
          run: () => {
              trapped = true;
              return ['-- INSERT --', 'you are now trapped. nobody here', 'knows how to leave.', '(hint: it starts with a colon.)'];
          } },
        { name: 'sl', hidden: true, noPipe: true, run: () => cmdSl() },
        { name: 'fortune', hidden: true, run: () => FORTUNES[Math.floor(Math.random() * FORTUNES.length)] },
        { name: 'ping', hidden: true, run: (a) => cmdPing(a) },
        { name: 'hire', hidden: true, noPipe: true, run: () => cmdHire() },
        { name: 'coffee', hidden: true, alias: ['tea'], run: () => COFFEE },
        { name: 'sudo', hidden: true, run: (a) => a.length
            ? `sudo: ${a[0]}: you are not in the sudoers file. this incident has been reported to freyr.`
            : 'permission denied: nice try.' },
    ];

    const commandMap = new Map();
    COMMANDS.forEach(c => {
        commandMap.set(c.name, c);
        (c.alias || []).forEach(a => commandMap.set(a, c));
    });

    //Column width is measured rather than hard-coded: a longer command added
    //later should not silently un-align the list.
    function renderHelp() {
        const visible = COMMANDS.filter(c => !c.hidden);
        const width = Math.max(...visible.map(c => `${c.name} ${c.args}`.trim().length));
        return [
            'available commands:',
            ...visible.map(c => `  ${`${c.name} ${c.args}`.trim().padEnd(width + 2)}${c.help}`),
            '',
            'shortcuts:',
            '  tab completes - ^C cancels',
            '  ^L clears - esc closes',
            '  ^U wipes line - ^A/^E ends',
            '  !! reruns - cmd | grep word',
        ];
    }

    //Levenshtein, two rows. A typo is worth catching; a different word is not,
    //so the threshold stays at 2 and the suggestion is silent when nothing is
    //close enough to be worth guessing at.
    function editDistance(a, b) {
        let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            const row = [i];
            for (let j = 1; j <= b.length; j++) {
                row[j] = Math.min(
                    prev[j] + 1,
                    row[j - 1] + 1,
                    prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
            prev = row;
        }
        return prev[b.length];
    }

    function suggestFor(name) {
        const best = COMMANDS
            .filter(c => !c.hidden)
            .map(c => ({ name: c.name, d: editDistance(name.toLowerCase(), c.name) }))
            .sort((x, y) => x.d - y.d)[0];
        return best && best.d <= 2 ? best.name : null;
    }

    //Completion --------------------------------------------------------------

    //The first word completes from the same table `help` reads. After that it
    //is the command's own business: a row with a `complete` function decides
    //what its arguments can be, and one without simply has no suggestions.
    function completionsFor(value) {
        const parts = value.split(/\s+/);
        if (parts.length <= 1) {
            return COMMANDS.filter(c => !c.hidden && c.name.startsWith(parts[0])).map(c => c.name);
        }
        const entry = commandMap.get(parts[0].toLowerCase());
        if (!entry || !entry.complete) return [];
        return entry.complete(parts[parts.length - 1]);
    }

    //The longest prefix every candidate agrees on. Two matches that share more
    //letters should still advance the line rather than only listing themselves.
    function commonPrefix(list) {
        if (!list.length) return '';
        return list.reduce((acc, s) => {
            let i = 0;
            while (i < acc.length && i < s.length && acc[i] === s[i]) i++;
            return acc.slice(0, i);
        });
    }

    //Called from every path that touches input.value — a hint left behind under
    //an empty line is the most visible bug this feature can have.
    function applyGhost() {
        const value = input.value;
        if (mode !== 'command' || !value) {
            ghost.textContent = '';
            return;
        }
        const list = completionsFor(value);
        const prefix = commonPrefix(list);
        const last = value.split(/\s+/).pop();
        ghost.textContent = (list.length && prefix.length > last.length)
            ? value + prefix.slice(last.length)
            : '';
    }

    function completeInput() {
        const value = input.value;
        const list = completionsFor(value);
        if (!list.length) return;
        const last = value.split(/\s+/).pop();
        const prefix = commonPrefix(list);
        if (prefix.length > last.length) {
            input.value = value.slice(0, value.length - last.length) + prefix;
            //A lone match is a finished word, so hand it the trailing space and
            //the next tab starts on the argument. A folder is not finished: it
            //ends in a slash and the next tab goes inside it.
            if (list.length === 1 && !list[0].endsWith('/')) input.value += ' ';
        } else if (list.length > 1) {
            appendLine(value, 'term-line-cmd');
            appendBlock(list.join('   '), 'term-line-hint');
        }
        applyGhost();
    }

    //^L and ^C have to work while a game holds the floor, and a disabled input
    //fires no keydown of its own — so this lives in one place and both the
    //input and the document listener call it.
    function handleControlKey(e) {
        if (!e.ctrlKey || e.altKey || e.metaKey) return false;
        const key = e.key.toLowerCase();
        if (key === 'l') {
            e.preventDefault();
            output.innerHTML = '';
            return true;
        }
        if (key === 'c') {
            //Copying output out of the terminal has to keep working, so a live
            //selection wins over the cancel.
            if (window.getSelection()?.toString()) return false;
            e.preventDefault();
            appendLine('^C', 'term-line-cmd');
            input.value = '';
            applyGhost();
            if (mode !== 'command') {
                cancelActive();
                exitToCommandMode();
                appendLine('cancelled.');
                input.focus();
            }
            return true;
        }
        return false;
    }

    function remember(line) {
        cmdHistory.push(line);
        historyIndex = cmdHistory.length;
        storeSaved(HISTORY_KEY, JSON.stringify(cmdHistory.slice(-HISTORY_KEPT)));
    }

    function runCommand(raw) {
        let trimmed = raw.trim();
        if (!trimmed) return;

        //`!!` and `!3` are replaced by the line they point at before anything
        //else happens, and it is the replacement that lands in the history.
        const recall = trimmed.match(/^!(!|\d+)$/);
        if (recall) {
            const wanted = recall[1] === '!' ? cmdHistory.length - 1 : Number(recall[1]) - 1;
            if (!cmdHistory[wanted]) {
                appendLine(trimmed, 'term-line-cmd');
                appendBlock(`${trimmed}: event not found`, 'term-line-error');
                return;
            }
            trimmed = cmdHistory[wanted];
        }
        appendLine(trimmed, 'term-line-cmd');
        remember(trimmed);

        if (trapped) {
            if (/^:(q|wq|x)!?$/.test(trimmed)) {
                trapped = false;
                appendBlock('you escaped. barely.');
            } else {
                appendBlock('E37: no write since last change. type :q to leave.', 'term-line-error');
            }
            return;
        }

        //One pipe, and only into grep: `cmd | grep word` keeps the lines of the
        //command's output that contain the word.
        let left = trimmed;
        let pattern = null;
        const pipeAt = trimmed.indexOf('|');
        if (pipeAt >= 0) {
            left = trimmed.slice(0, pipeAt).trim();
            const right = trimmed.slice(pipeAt + 1).trim();
            const grep = right.match(/^grep\s+(.+)$/i);
            if (!grep) {
                appendBlock(`${right.split(/\s+/)[0] || '|'}: only 'grep' works after a pipe.`, 'term-line-error');
                return;
            }
            pattern = grep[1].trim().replace(/^["']|["']$/g, '').toLowerCase();
        }

        const [name, ...args] = left.split(/\s+/);
        const entry = commandMap.get(name.toLowerCase());
        if (!entry) {
            appendBlock(`command not found: "${name}".`, 'term-line-error');
            const guess = suggestFor(name);
            appendBlock(guess ? `did you mean '${guess}'?` : "type 'help' for a list of commands.",
                        'term-line-error');
            return;
        }
        if (pattern === null) {
            const result = entry.run(args);
            if (result) appendBlock(result);
            return;
        }
        if (entry.noPipe) {
            appendBlock(`${entry.name}: nothing to pipe.`, 'term-line-error');
            return;
        }

        capture = [];
        let result;
        let collected;
        try {
            result = entry.run(args);
        } finally {
            //Released before anything is printed: appendBlock would otherwise
            //collect its own output again.
            collected = capture;
            capture = null;
        }
        const lines = [...collected, ...(result ? [].concat(result) : [])];
        const hits = lines.filter(l => l.toLowerCase().includes(pattern));
        appendBlock(hits.length ? hits : 'grep: no matches.', hits.length ? undefined : 'term-line-error');
    }

    function bootSequence() {
        const l1 = appendLine('');
        scrambleText(l1, "freyr's terminal - type 'help' to get started",
                     { duration: 500, pool: CHARS.en, asText: true });
        appendLine('');
    }

    function openTerminal() {
        widget.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        if (!hasBooted) {
            hasBooted = true;
            bootSequence();
        }
        setTimeout(() => input.focus(), 50);
    }

    function closeTerminal() {
        widget.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        if (mode !== 'command') {
            cancelActive();
            exitToCommandMode();
        }
        trapped = false;
        trigger.focus();
    }

    trigger.addEventListener('click', openTerminal);
    closeBtn.addEventListener('click', closeTerminal);

    document.addEventListener('keydown', (e) => {
        if (!widget.classList.contains('is-open')) return;
        if (handleControlKey(e)) return;

        //The rain owns the whole panel while it runs, so any key ends it —
        //there is nothing else to press.
        if (mode === 'fx') {
            e.preventDefault();
            stopFx();
            return;
        }

        if (mode === 'menu') {
            if (e.key === 'Escape') {
                exitToCommandMode();
                appendLine('cancelled.');
                input.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                menuIndex = Math.max(0, menuIndex - 1);
                refreshMenuHighlight();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                menuIndex = Math.min(GAMES.length - 1, menuIndex + 1);
                refreshMenuHighlight();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                confirmMenuSelection();
            }
            return;
        }

        if (e.key !== 'Escape') return;
        if (mode === 'game') {
            cancelActive();
            exitToCommandMode();
            appendLine('game forfeited.');
            input.focus();
        } else {
            closeTerminal();
        }
    });

    input.addEventListener('keydown', (e) => {
        //Line editing. These only make sense while there is a line to edit, and
        //^A would otherwise select the whole field.
        if (e.ctrlKey && !e.altKey && !e.metaKey && mode === 'command') {
            const key = e.key.toLowerCase();
            if (key === 'u' || key === 'a' || key === 'e') {
                e.preventDefault();
                if (key === 'u') input.value = input.value.slice(input.selectionStart);
                const at = key === 'e' ? input.value.length : 0;
                input.setSelectionRange(at, at);
                applyGhost();
                return;
            }
        }
        //^L and ^C run whatever mode the terminal is in, so they come first.
        if (e.ctrlKey) {
            if (handleControlKey(e)) e.stopPropagation();
            return;
        }
        if (mode !== 'command') return;
        if (e.key === 'Tab') {
            //Without this the browser walks focus to the close button and the
            //visitor carries on typing into nothing.
            e.preventDefault();
            completeInput();
        } else if (e.key === 'Enter') {
            //A command is free to move focus — `exit` and a mobile `goto` both
            //close the panel, which parks focus on the trigger. Enter's default
            //action lands on whatever is focused by then, so without this the
            //trigger gets clicked and the panel reopens on the way out.
            e.preventDefault();
            e.stopPropagation();
            runCommand(input.value);
            input.value = '';
            applyGhost();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length) {
                historyIndex = Math.max(0, historyIndex - 1);
                input.value = cmdHistory[historyIndex] || '';
                applyGhost();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (cmdHistory.length) {
                historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
                input.value = cmdHistory[historyIndex] || '';
                applyGhost();
            }
        }
    });

    input.addEventListener('input', applyGhost);

    output.addEventListener('click', () => input.focus());
})();
