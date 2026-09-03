//Shared ---------------------------------------------------------------------

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

//Project cards carry their stack as a comma-separated attribute. The tag filter
//and the terminal's `projects` command both read it, so the parse lives here
//rather than once in each.
const tagsOf = card => card.dataset.tags.split(',').map(t => t.trim());

const CHARS = {
    en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234!@#$%&',
    th: 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ',
};

//Language state. The translate button owns it and everything else subscribes,
//so no block has to reach across for a mutable global.
const i18n = (function () {
    const content = {
        en: {
            tagLine: '> whoami',
            name: 'Freyr',
            status: 'Computer Engineering Student\n@ Chulalongkorn University',
            interests: ['Backend Engineering', 'Competitive Programming'],
            skillGroups: ['languages', 'tools & frameworks'],
            tooltipHas: '→ see what i built',
            tooltipNone: '→ no projects yet',
            btns: ['Email', 'Discord', 'GitHub'],
        },
        th: {
            tagLine: '> ฉันคือใคร',
            name: 'เฟรย์',
            status: 'วิศวกรรมคอมพิวเตอร์\n@ จุฬาลงกรณ์มหาวิทยาลัย',
            interests: ['ซอฟต์แวร์ระบบหลังบ้าน', 'การเขียนโปรเเกรมเชิงเเข่งขัน'],
            skillGroups: ['ภาษา', 'เครื่องมือและเฟรมเวิร์ก'],
            tooltipHas: '→ ดูโปรเจคที่ผมทำ',
            tooltipNone: '→ ยังไม่มีโปรเจคนี้',
            btns: ['อีเมล', 'ดิสคอร์ด', 'กิตฮับ'],
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

//Pre-baked ASCII cats for the avatar's click-to-flip, one per profile photo:
//CAT_1 rides the green photo, CAT_2 the amber one. Braille dot art — each cell
//is 2x4 dots, so these 90x45 and 50x25 grids are really 180x180 and
//100x100 one-bit bitmaps. The grids differ, so .ascii-face is sized from
//whichever art is showing rather than from a hardcoded column count.
//JetBrains Mono has no glyphs in U+2800-28FF — .ascii-face puts Noto Sans
//Symbols 2 in front of it for exactly that range.
const ASCII_CAT_1 = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠂⠠⣦⢶⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠤⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⡧⠯⠁⠘⣽⡿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⠠⢶⣶⣿⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡛⣩⣵⡂⠀⢐⡒⡆⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠨⣵⣻⣧⣽⣳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢸⡿⣞⡿⣋⡄⠀⠀⢭⣑⢻⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡇⠀⠀⠔⠫⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣸⣾⣧⣶⠟⡋⣀⡀⠀⢀⣀⣯⢎⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣷⠀⠀⠠⢶⣶⣞⣻⢿⣾⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣈⣾⣫⣿⣽⣶⣯⣟⡶⠄⠀⠀⠲⠄⢧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⡆⠀⣴⣓⠚⠛⣿⣿⣿⣾⣿⣿⣷⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⡿⠟⠉⠁⠀⠀⠀⠂⡧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡀⠉⠉⠉⣳⣿⣶⣿⣿⣿⣿⣿⣿⣿⣷⡶⣴⣴⣶⡛⠛⠉⠉⠉⠉⠉⠀⢠⠛⠛⢿⣟⣯⣷⣾⣿⣿⣿⣿⣿⣿⣟⣛⣭⡴⠄⠀⠀⠀⠀⠈⠆⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡧⠀⠀⠈⢉⣉⣿⣿⣿⣿⣿⠿⣛⣿⡿⠀⠀⠀⠻⢿⣦⢀⣀⡀⠀⠀⣤⣇⣀⣼⡞⠈⠉⠉⠉⣀⠉⠛⠻⢿⣿⣿⣟⠓⣦⠔⠀⠀⠀⠀⠀⠨⡕⠅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣇⠀⣤⣬⣿⣿⠟⠛⠉⠁⠀⠘⣿⣿⠇⠀⠀⠑⠀⠘⠿⠟⠛⠙⠦⡞⠉⠛⠾⠃⠀⠀⠀⠀⠀⢿⣿⣧⠀⠀⠀⠈⠙⢷⣶⣼⡒⠓⠂⠀⢀⠀⠍⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣾⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠘⠿⠀⠀⣀⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠾⡿⠉⠀⠀⠀⠀⠀⠀⠙⠿⣿⣶⡄⠀⢸⡇⡆⠀⠐⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠏⠉⢀⣰⣷⡿⠷⣾⣶⣶⣤⣀⠀⠀⠀⠀⠹⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠈⠀⠀⠀⠁⣀⣤⣶⣾⣽⣿⣷⣤⣄⠀⠉⠛⣧⣿⠽⡀⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⠥⠤⠴⣾⡿⠃⢠⣾⣿⡟⠉⠉⣻⡗⢄⠀⠀⠀⠈⠣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠁⠀⠀⡴⡏⠎⢿⣿⠋⠐⢿⣿⣏⠈⢹⣦⠀⠀⠀⢹⡙⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⢏⠀⠀⠀⠀⢿⣇⠀⢸⣿⣿⣧⣀⣰⣿⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⡈⡇⠀⡀⢸⣦⣤⡀⣼⣿⢿⠀⠀⢀⠈⠁⠀⠣⣄⠘⣳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠃⠀⠁⠄⡀⠀⠀⠛⠦⠌⠿⠿⢿⠿⠿⠋⣠⣾⣿⡀⢀⡤⠖⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⢸⣿⣄⡀⠈⠻⢿⢿⠿⡿⠁⣀⡸⠃⠀⠀⠀⣠⠀⠻⢮⢥⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠁⠀⠀⠀⠀⠀⠀⠃⠰⠠⢄⡀⠀⠀⠀⠀⠀⠀⠀⣨⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠿⣷⣜⠋⠉⠉⠉⠉⠓⠀⠐⠀⠈⠈⠄⠀⡄⠐⠈⠁⠁⠀⡁⠂⠁⠘⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠐⠒⠠⢀⠠⢺⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢷⣦⡀⠀⠄⠀⠤⠀⠀⠐⠀⠉⠀⠀⠀⠀⠀⠀⠀⠄⠀⠀⢀⢀⡑⠝⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡏⠀⣠⣤⣠⣀⡀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠀⠀⠀⠀⣀⣤⣤⣤⣦⣤⣤⣤⣤⣤⣤⣤⣤⣀⠀⠀⠀⠀⠙⠛⠠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠀⢰⣄⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⢈⣭⣿⠷⠚⠛⠙⢹⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢿⣿⣿⣿⣿⣿⣽⣿⣻⣟⣿⣽⣻⣟⣿⡷⠀⠀⠀⠀⠀⠐⢡⢀⠀⠀⠀⠀⠀⢀⣶⣴⣦⣤⣤⣄⡀⠀⢀⣶⡧⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣧⠀⠀⠈⠁⠀⠀⠀⠀⢸⣿⡆⠀⠀⠶⠆⢾⠃⠀⠷⠀⠀⠀⠀⠀⠈⠉⠉⢿⣟⣿⣿⣽⣿⡾⣿⡅⠀⠀⠀⠀⠀⠀⠀⢠⡄⢠⢯⠐⣀⠀⢀⣀⡈⠉⠉⠙⠙⠛⠛⠳⢚⡾⣽⡋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⢀⡀⢠⣶⠀⣴⡄⠀⠀⠀⠀⠀⠀⠀⠙⢯⣿⣾⣿⣏⡿⠃⠀⠀⠀⠀⠀⠀⠀⠠⣄⠠⣠⣀⡀⡈⠉⠉⠀⠀⠀⠀⠀⠀⢀⣤⡖⣿⠁⠴⣾⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢧⠀⠀⠀⠀⠀⠀⠀⠀⠹⠃⠀⠀⠀⡀⠀⢀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠉⠐⠀⠀⠀⠀⢠⡴⠞⠋⠁⠀⠀⠀⣠⢂⣥⠡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣤⣤⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣧⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠀⠈⠈⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠤⢈⡋⠉⠁⠀⠀⠚⠄⠌⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠏⠡⢺⡿⠏⠀⠀⡠⠀⠀⠀⠀⠀⠀⠐⠒⠠⠤⠄⠠⠤⠤⠤⠴⠒⠚⠉⠉⠉⠉⠉⠉⠓⠲⠤⢤⣀⣀⡀⣀⠤⠒⡖⠊⠩⠉⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠀⠀⠁⢴⡃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠏⠀⠀⠼⣅⠀⠀⢩⢶⣿⣿⣿⣶⠶⠚⠀⠀⠀⠀⠀⠐⠤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⡄⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⡑⠘⡮⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠏⠀⠀⢠⠎⠁⠀⠀⠀⠈⠉⠁⠉⠉⠟⠋⠽⢴⣂⣥⣀⣀⣀⣈⡉⢒⡶⠦⣀⣀⣀⣠⣀⣀⣀⣤⣴⣶⠿⠛⠁⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢬⣿⣡⣗⡅⠤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡏⠀⠀⠀⠀⠀⢡⠔⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠁⠉⠉⠉⠀⠀⠀⠉⠉⠉⡍⠉⠉⢉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣄⣹⣿⣿⣖⣹⠨⣏⡐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢷⠀⠀⠀⠀⢰⠃⠤⠊⢠⠴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⠀⠀⢸⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠤⣄⣤⣄⣹⣿⠛⡓⠂⠀⠙⠀⢻⠬⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣤⠄⠀⠀⠀⠀⣴⠈⠛⢻⢛⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⠞⠀⠀⠀⠈⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣄⠀⠀⠀⠀⠀⠤⣄⣷⣬⣙⡛⠛⠉⠀⠀⠀⠀⣒⡰⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠃⢼⣿⡇⠀⠀⠀⠀⠈⠁⠀⠟⠉⢩⣭⢉⣠⢀⡤⠀⠀⠀⠀⠀⠀⠀⢀⣾⠇⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣔⢆⢸⡀⠀⢀⣰⣠⡿⠒⠂⠈⠀⠁⠀⠀⠀⢀⠈⢠⣳⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⡄⠀⠿⢟⡿⣶⡀⠀⠀⠀⠀⠀⠀⠸⠋⠡⣰⢿⣧⣞⣡⣾⣀⣄⣤⡾⠋⠈⠀⠀⠀⠀⠀⠀⠀⠀⢳⡈⢿⣆⣠⣀⢠⢀⡀⢠⣬⣏⣳⣬⠿⠛⠃⠈⠉⠀⠀⠀⠀⠀⠀⠀⠀⡰⣟⣿⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡀⠀⠈⣼⠥⣿⣧⣶⣾⣀⡀⠀⠀⠀⠀⠁⠘⠁⠐⠛⠁⠘⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠃⠀⠉⠉⠛⠿⠿⠟⢻⣿⠉⠛⠙⠒⠒⠀⠀⠀⠀⠀⠀⠀⠀⢈⣷⣾⣾⣧⣎⡯⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⢰⣀⠀⢠⠿⣿⣿⣿⣼⣧⣾⢀⠀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠐⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣝⠒⢶⣿⡿⢿⡏⠁⠼⠁⡋⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣷⡼⣿⣄⠀⠀⠀⢨⠿⢻⣿⣿⣧⣾⣷⣏⣡⢀⣠⣷⣖⣴⣶⣶⣾⠤⢀⣤⣴⡾⠁⠀⠀⠘⣿⡷⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⢰⣶⣀⠰⣿⣷⣾⠏⠉⠀⠸⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⢻⠿⠇⡀⠀⠀⠀⠘⠈⠁⠀⡽⠛⠟⠋⣵⣾⡿⠿⠛⡿⠋⠁⡰⢫⢯⢿⠁⠀⠀⠀⠀⠘⠳⣽⣿⣦⢀⣞⣤⡀⠹⣤⣦⠀⡀⢴⢠⠀⢳⣿⣭⣛⠻⠏⠉⠉⠀⠀⠀⡨⢸⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣟⣾⣿⣷⣿⣧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠒⠚⠉⠀⠀⠈⠀⠀⠊⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠻⣿⢿⡿⣿⡦⣼⣿⡳⣽⣽⣷⠷⢬⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⢀⡨⣠⠴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⢩⣯⣼⣿⣿⡿⠻⡜⣦⣠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠀⠀⠈⠙⠋⠉⠉⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢀⠐⣤⣼⣿⢩⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡇⣾⣽⣿⣿⢟⣵⢿⡇⣻⡿⣇⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠲⣤⣀⠀⠀⠀⠀⠀⠀⠀⢠⣠⢤⡀⠀⠤⠀⠀⠐⠀⠐⡐⣤⣿⣂⣿⠿⣷⠿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣻⢿⣿⢯⣾⣿⣿⣷⣿⢗⡙⢃⣷⣾⠀⡆⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠇⠀⠑⠆⠀⠀⠀⠀⠲⠌⠉⠁⠁⠀⠀⢠⡀⢤⣐⣈⣿⣿⣿⣿⣿⣿⣿⠦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣳⢯⣿⣿⢏⣾⣿⣿⣿⣾⣼⡿⠁⡿⠏⢻⡸⣇⣶⣤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢤⣀⣀⣀⠀⣐⣶⣾⣹⣯⣷⣚⠿⣷⣿⣿⣿⣿⡟⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠇⣾⣿⣿⣿⣿⣿⣿⣿⣿⡟⣁⣼⠟⣐⣬⡷⣠⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢰⣤⣴⣶⣶⠾⣷⣦⣽⡿⢩⣌⠻⣿⣷⣯⣟⡿⣿⣿⣿⣿⣿⣿⠇⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡟⢀⣼⣿⣿⣿⣿⣿⣿⡿⣋⣴⠟⣡⣶⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠿⣿⣷⣹⣿⡷⣿⣦⣻⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⡿⡏⣯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢘⡇⠸⣿⢋⣿⠟⠋⢁⡿⢠⠛⠠⠌⠉⣿⡿⣿⣿⡿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣷⢿⣿⣿⣿⣿⡟⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢷⣧⣼⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

const ASCII_CAT_2 = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⠀⠀⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡿⠇⠀⠀⠀⠀⢻⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡇⠀⠀⠀⠀⡸⣞⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠃⠀⠀⠀⢀⣧⢿⣽⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢴⣿⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⣼⣞⡿⣞⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠀⠀⠀⣰⣟⢾⣽⢫⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣠⢤⣶⡻⣞⣿⣺⢯⣽⣳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢠⣄⡀⠀⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⣀⣠⣤⣿⣽⣻⢾⣽⣷⣾⣽⣻⣞⣷⣳⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣶⣄⡀⠀⠀⠀⣉⣲⣴⢶⣞⡿⣽⣞⡷⣯⢿⡽⣞⣿⠟⠋⠁⠉⠈⠳⣟⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⢶⣾⣿⡽⣯⣟⡾⣽⡷⣯⣟⡽⡾⣽⡯⠁⠀⠀⠀⠀⠀⠀⢮⣭⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢞⣿⣿⢯⡿⣿⣯⣟⣷⣯⢿⣳⣟⡷⣽⣼⣻⣽⠀⠀⠀⠀⠀⠀⠀⢀⣼⡯⡗⠋⠤⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢾⣿⣿⣯⣽⣾⣿⣾⣗⡿⣯⡷⣯⣟⡷⣞⣼⣿⣀⠀⠀⠀⠀⢀⣠⡿⣏⡗⠈⠐⠈⠅⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⠛⠏⠉⠉⠽⢟⢿⣿⣿⣿⣿⣷⣻⢾⡽⣞⡷⠄⡹⣶⢿⣻⢿⣻⡽⢯⣼⢦⠶⠁⠈⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣯⠇⠀⠀⠀⠀⠀⠁⣽⣿⣿⣿⣷⣯⣿⣽⣛⡦⠀⠀⢩⣿⣹⢯⣷⢻⣟⠺⢣⡖⣘⠤⠓⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⣿⡃⠁⠀⠀⠀⢀⣤⣾⣟⢿⣻⣿⣿⣟⡾⣽⡳⠄⠎⢳⣯⢯⣟⡾⢯⣞⣯⣓⠉⢀⠀⠀⡄⢢⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣷⣷⣶⣳⣶⣺⣿⣿⣳⢯⣟⣿⣿⣳⢯⠛⠅⠃⠀⠀⣴⣿⡿⣬⢶⠾⠙⣊⣥⠾⡒⠊⢁⢠⠣⣌⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢺⡽⣾⡽⣯⣟⣿⡿⣯⣿⣿⣾⢿⣿⠳⢏⣈⢠⠀⠀⣰⢿⡿⣽⣉⡶⠌⠋⠉⣀⡀⠁⠀⠀⠀⣘⡐⣂⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣽⣳⣟⣳⣟⣾⣽⣿⣿⣿⣿⣿⣦⣜⡻⡽⠆⠧⣴⡟⣯⢟⡳⣭⠲⠄⠐⠀⠀⠀⠈⠁⠉⠑⢊⡕⢃⠄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣾⣿⣯⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣾⢧⠀⠹⠾⡵⡞⡽⢢⣃⠐⠀⠀⠄⡐⠀⠀⠀⡘⢦⠘⣌⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠹⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢯⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠒⡈⠀⡀⠄⡑⠢⣉⠴⣈⣆
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢯⣏⡴⣶⣵⣢⢤⢠⡀⡄⢠⠐⡰⢌⡱⠀⡁⡀⠆⡥⠆⡥⣛⡽⣾
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠔⠉⠀⠀⢽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣼⣻⢷⣯⡽⣞⣷⣻⡼⣡⢋⡔⠣⠜⡐⢐⠠⡓⣤⣙⣲⣽⣻⢷
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡿⣽⣞⣷⣻⡴⣣⢜⡱⣊⡕⣊⠠⡙⡰⣭⢷⣯⣿⢿`;

//Profile picture — hold the avatar to swap it, click it to flip to ASCII ------
(function () {
    const avatarWrap = document.querySelector('.avatar-wrap');
    const toggle = document.getElementById('avatarToggle');
    const asciiFace = document.getElementById('asciiFace');
    const myFaceImage = document.querySelector('.myFaceImage');
    const profileChangeRing = document.querySelector('.profileChangeRing');
    const statusDot = document.querySelector('.status-dot');
    const avatarRing = document.querySelector('.avatar-ring');
    if (!myFaceImage || !profileChangeRing || !statusDot || !avatarRing) return;

    const HOLD_MS = 3000;

    //Each art is written as a template literal to stay legible in the source,
    //which leaves a newline after the opening backtick — and on a CRLF checkout
    //every line also carries a \r. A <pre> renders both: the newline as an extra
    //blank row, the returns as stray characters.
    //
    //The two cats are different grids (90x45 and 100x50), so the cell size is
    //derived from whichever art is showing rather than hardcoded. Measuring the
    //string itself means new art needs no matching edit in the CSS. A braille
    //glyph advances 0.7em, so the art spans cols*0.7 em across and rows down.
    //
    //Holding re-runs this every three seconds, so the strip-and-measure happens
    //once per cat here rather than once per swap.
    const prepArt = (raw) => {
        const art = raw.replace(/\r/g, '').replace(/^\n/, '');
        const rows = art.split('\n');
        return { art, cols: ([...rows[0]].length * 0.7).toFixed(2), rows: rows.length };
    };

    const profiles = [
        { src: 'images/myface1.webp', color: 'var(--green)', art: prepArt(ASCII_CAT_1) },
        { src: 'images/myface2.webp', color: 'var(--amber)', art: prepArt(ASCII_CAT_2) },
    ];
    let index = -1;
    let frame = null;
    let timer = null;

    function showArt({ art, cols, rows }) {
        if (!asciiFace) return;
        asciiFace.textContent = art;
        asciiFace.style.setProperty('--ascii-w', cols);
        asciiFace.style.setProperty('--ascii-rows', rows);
    }

    function setProgress(deg) {
        profileChangeRing.style.setProperty('--progress', `${deg}deg`);
    }

    function changeProfilePicture() {
        index = (index + 1) % profiles.length;
        const { src, color, art } = profiles[index];
        myFaceImage.src = src;
        //Each photo has its own cat, so holding to swap while the ASCII is
        //showing morphs to the other one instead of leaving the wrong cat up.
        showArt(art);
        setProgress(0);
        statusDot.style.background = color;
        statusDot.style.boxShadow = `0 0 14px ${color}`;
        avatarRing.style.border = `2.5px solid ${color}`;
        profileChangeRing.style.setProperty('--ring-color', color);
    }

    changeProfilePicture();

    function stopHold() {
        setProgress(0);
        if (frame !== null) cancelAnimationFrame(frame);
        if (timer !== null) clearInterval(timer);
        frame = null;
        timer = null;
    }

    //Holding swaps the photo in every motion mode. With motion reduced the ring
    //simply is not animated — the swap itself is one discrete state change, not
    //motion — which leaves click free to mean the same thing for everyone.
    (toggle || myFaceImage).addEventListener('mouseenter', () => {
        if (reducedMotion.matches) {
            timer = setInterval(changeProfilePicture, HOLD_MS);
            return;
        }
        //rAF instead of a 100ms timer: the ring now tracks the display instead of
        //stepping in tenths, and the loop stops itself while the tab is hidden.
        let start = performance.now();
        const step = (now) => {
            const elapsed = now - start;
            setProgress(Math.min(1, elapsed / HOLD_MS) * 360);
            if (elapsed >= HOLD_MS) {
                changeProfilePicture();
                start = now;
            }
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
    });

    (toggle || myFaceImage).addEventListener('mouseleave', stopHold);

    //Click flips between the photo and its ASCII rendering. A real <button>
    //carries Enter and Space for free; aria-pressed carries the state, so the
    //label stays static rather than describing the next action.
    if (toggle && asciiFace) {
        toggle.addEventListener('click', () => {
            const on = avatarWrap.classList.toggle('is-ascii');
            toggle.setAttribute('aria-pressed', String(on));
        });
    }
})();

//EN / TH translate ----------------------------------------------------------
(function () {
    const translateBtn = document.getElementById('translateBtn');
    const translateLabel = document.getElementById('translateLabel');
    if (!translateBtn || !translateLabel) return;

    const CURSOR = '<span class="cursor">_</span>';
    let animating = false;

    translateBtn.addEventListener('click', () => {
        if (animating) return;
        animating = true;

        const d = i18n.toggle();
        translateLabel.textContent = i18n.lang === 'en' ? 'EN / TH' : 'TH / EN';
        translateBtn.classList.toggle('active', i18n.lang === 'th');

        const targets = [
            { el: document.querySelector('.tag-line'),       text: d.tagLine,       delay: 0,   duration: 600 },
            { el: document.querySelector('.name-txt'),       text: d.name,          delay: 80,  duration: 650, suffix: CURSOR },
            { el: document.querySelector('.status-txt'),     text: d.status,        delay: 160, duration: 600 },
        ];
        targets.forEach(({ el, text, delay, duration, suffix }) => {
            if (el) setTimeout(() => scrambleText(el, text, { duration, suffix }), delay);
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

        scrambleList('.interest-list li',   d.interests,  550, 320, 80);
        scrambleList('.skill-group-label',  d.skillGroups, 450, 320, 80);
        scrambleList('.contact-btn',        d.btns,        450, 400, 60);

        setTimeout(() => { animating = false; }, 1100);
    });
})();

//Email copy-to-clipboard ----------------------------------------------------
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
        showToast(`> copied "${email}" to clipboard`);
    });
})();

//Project card click ripple --------------------------------------------------
(function () {
    document.querySelectorAll('.project-img-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (reducedMotion.matches) return;
            const wrap = link.querySelector('.project-img-wrap');
            const rect = wrap.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.8;
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            wrap.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });
})();

//Project tech-stack filter --------------------------------------------------
(function () {
    const projectCards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
    const filterTagsContainer = document.getElementById('filterTags');
    const filterClearBtn = document.getElementById('filterClear');
    const filterEmptyMsg = document.getElementById('filterEmpty');
    if (!projectCards.length || !filterTagsContainer || !filterClearBtn || !filterEmptyMsg) return;

    const activeFilters = new Set();
    //Tags never change, so each card is parsed once here rather than on every
    //filter pass, and into a Set so the match below is a lookup, not a scan.
    const cardTags = new Map(projectCards.map(card => [card, new Set(tagsOf(card))]));
    //Set keeps insertion order, so the buttons still come out in card order.
    const uniqueTags = new Set(projectCards.flatMap(tagsOf));

    function applyFilters() {
        //every() on an empty list is already true, so no filters means no match
        //test — the same shortcut the explicit size check used to spell out.
        const wanted = [...activeFilters];
        let visibleCount = 0;
        projectCards.forEach(card => {
            const tags = cardTags.get(card);
            const matches = wanted.every(f => tags.has(f));
            card.classList.toggle('is-hidden', !matches);
            if (matches) visibleCount++;
        });
        filterEmptyMsg.hidden = visibleCount !== 0;
        filterClearBtn.hidden = activeFilters.size === 0;
        filterTagsContainer.querySelectorAll('.skill-tag').forEach(btn => {
            btn.classList.toggle('is-active', activeFilters.has(btn.dataset.tech));
        });
    }

    function toggleFilter(tag) {
        if (activeFilters.has(tag)) activeFilters.delete(tag);
        else activeFilters.add(tag);
        applyFilters();
    }

    function clearFilters() {
        activeFilters.clear();
        applyFilters();
    }

    uniqueTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'skill-tag';
        btn.dataset.tech = tag;
        btn.textContent = tag;
        btn.addEventListener('click', () => toggleFilter(tag));
        filterTagsContainer.appendChild(btn);
    });

    filterClearBtn.addEventListener('click', clearFilters);

    //Hero skill tags jump to the matching (filtered) projects
    const heroTechBtns = document.querySelectorAll('.skills-block button.skill-tag[data-tech]');

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
            if (uniqueTags.has(tech)) {
                activeFilters.clear();
                activeFilters.add(tech);
                applyFilters();
            } else {
                clearFilters();
                showToast(`> no projects tagged "${tech}" yet`);
            }
            document.getElementById('projects').scrollIntoView({ behavior: scrollBehavior() });
        });
    });
})();

//Project card scroll reveal -------------------------------------------------
//Staggered so the eye travels the grid in reading order as the section enters.
//One-shot by construction: the card is stripped of both reveal classes once its
//animation ends, so the tag filter's display toggling has no animation left to
//restart. Under reduced motion no class is ever added and the cards just sit
//there at full opacity.
(function () {
    const cards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
    if (!cards.length || reducedMotion.matches) return;

    cards.forEach((card, i) => {
        card.style.setProperty('--reveal-i', i);
        card.classList.add('reveal-pending');
    });

    const reveal = card => {
        card.classList.remove('reveal-pending');
        card.classList.add('reveal-in');
        card.addEventListener('animationend', () => card.classList.remove('reveal-in'), { once: true });
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            reveal(entry.target);
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -10% 0px' });

    cards.forEach(card => observer.observe(card));
})();

//GitHub contributions -------------------------------------------------------
//The data is baked in at build time by scripts/fetch-contributions.mjs. The
//calendar is GraphQL-only and GraphQL needs a token, which can never ship in a
//page served publicly, so there is no client-side path to it.
//
//That file is generated into the Pages artifact and never committed, so it is
//simply absent in local dev and on a first deploy. That is the ordinary case,
//not a failure: the block stays hidden and nothing is logged.
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

//Background timeline — experience/education switch
(function () {
    const timeline = document.getElementById('timeline');
    const toggle = document.getElementById('bgToggle');
    const toggleLabel = document.getElementById('bgToggleLabel');
    const toggleHint = document.getElementById('bgToggleHint');
    if (!timeline || !toggle || !toggleLabel || !toggleHint) return;

    const other = mode => mode === 'education' ? 'experience' : 'education';
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    const LINE_SEL = '.timeline-year, .timeline-title, .timeline-place, '
                   + '.timeline-award, .timeline-note, .timeline-hint';

    //Snapshot the copy once. Reading it back live would risk catching an element
    //mid-scramble and baking the noise in as the new "real" text.
    const originals = new Map();
    timeline.querySelectorAll(`.timeline-col-title, ${LINE_SEL}`)
        .forEach(el => originals.set(el, el.textContent));

    //Timeline copy is English-only — it is not part of the EN/TH toggle — so the
    //noise pool is pinned to Latin instead of following the active language.
    const scrambleOpts = { duration: 420, pool: CHARS.en, asText: true };
    let pending = [];

    function scrambleGroup(group) {
        pending.forEach(clearTimeout);
        pending = [];
        group.querySelectorAll('.timeline-col').forEach(col => {
            const title = col.querySelector('.timeline-col-title');
            if (title) scrambleText(title, originals.get(title), scrambleOpts);
            col.querySelectorAll('.timeline-item').forEach((item, i) => {
                item.querySelectorAll(LINE_SEL).forEach((el, j) => {
                    //Stepped so the switch reads as a cascade down the column
                    //rather than every line twitching at once.
                    pending.push(setTimeout(
                        () => scrambleText(el, originals.get(el), scrambleOpts),
                        120 + i * 70 + j * 35));
                });
            });
        });
    }

    function setMode(mode, animate) {
        timeline.dataset.mode = mode;
        const groups = timeline.querySelectorAll('.timeline-columns[data-category]');
        groups.forEach(group => {
            const show = group.dataset.category === mode;
            group.hidden = !show;
            const items = group.querySelectorAll('.timeline-item');
            items.forEach(item => item.classList.remove('is-entering'));
            if (!show || !animate) return;

            //Reading offsetWidth forces a synchronous layout, which is the point
            //— it is what makes the re-added class restart the animation. Doing
            //it once for the column after every class is off costs one layout
            //instead of one per entry.
            void group.offsetWidth;
            items.forEach((item, i) => {
                item.style.animationDelay = `${i * 0.06}s`;
                item.classList.add('is-entering');
            });
            scrambleGroup(group);
        });

        const label = capitalize(mode);
        const hint = `cd ~/${other(mode)} →`;
        if (animate) {
            scrambleText(toggleLabel, label, scrambleOpts);
            scrambleText(toggleHint, hint, scrambleOpts);
        } else {
            toggleLabel.textContent = label;
            toggleHint.textContent = hint;
        }
        toggle.setAttribute('aria-label', `Currently showing ${mode}. Click to switch to ${other(mode)}.`);
    }

    toggle.addEventListener('click', () => setMode(other(timeline.dataset.mode), true));

    setMode(timeline.dataset.mode || 'education');
})();

//Education timeline — click lightbox
(function () {
    const items = Array.from(document.querySelectorAll('.timeline-content[data-image]'));
    const lightbox = document.getElementById('timelineLightbox');
    const lightboxImg = document.getElementById('timelineLightboxImg');
    const lightboxCaption = document.getElementById('timelineLightboxCaption');
    const lightboxClose = document.getElementById('timelineLightboxClose');
    const lightboxImgLink = document.getElementById('timelineLightboxImgLink');
    if (!items.length || !lightbox || !lightboxImg || !lightboxCaption || !lightboxClose || !lightboxImgLink) return;

    let lastFocused = null;

    function openLightbox(item) {
        lastFocused = document.activeElement;
        lightbox.classList.remove('is-missing');
        lightboxImg.src = item.dataset.image;
        lightboxImg.alt = item.dataset.caption || '';
        lightboxCaption.textContent = item.dataset.caption || '';
        if (item.dataset.fb) {
            lightboxImgLink.href = item.dataset.fb;
            lightboxImgLink.classList.remove('is-disabled');
        } else {
            lightboxImgLink.removeAttribute('href');
            lightboxImgLink.classList.add('is-disabled');
        }
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
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
})();

//Terminal widget
(function () {
    const widget = document.getElementById('termWidget');
    const trigger = document.getElementById('termTrigger');
    const panel = document.getElementById('termPanel');
    const closeBtn = document.getElementById('termClose');
    const output = document.getElementById('termOutput');
    const input = document.getElementById('termInput');
    if (!widget || !trigger || !panel || !closeBtn || !output || !input) return;

    let hasBooted = false;
    const cmdHistory = [];
    let historyIndex = -1;
    let mode = 'command';
    let menuIndex = 0;
    let controlsEl = null;
    let gameTotal = 0;
    let gamePending = 0;
    let thinkTimer = null;
    let thinkingEl = null;
    let commitTimer = null;
    let lossTimer = null;

    const GAMES = [
        { id: '21', label: '21 - last to 21 loses' },
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
        //appendLine already scrolls, so the last line has done it.
        (Array.isArray(lines) ? lines : [lines]).forEach(l => appendLine(l, className));
    }

    //Data readers — DOM is the source of truth, mirrors the tag-filter system's approach
    function readAbout() {
        const name = (document.querySelector('.name-txt')?.textContent || '').replace('_', '').trim();
        const status = document.querySelector('.status-txt')?.textContent.trim() || '';
        const interests = Array.from(document.querySelectorAll('.interest-list li')).map(li => li.textContent.trim());
        return [
            `name: ${name}`,
            status,
            '',
            'areas of interest:',
            ...interests.map(i => `  - ${i}`),
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
            const title = card.querySelector('.project-title')?.textContent.trim();
            const subs = Array.from(card.querySelectorAll('.project-sub')).map(p => p.textContent.trim());
            const link = card.querySelector('.project-img-link')?.getAttribute('href');
            if (i > 0) lines.push('');
            lines.push(title);
            subs.forEach(s => lines.push(`  ${s}`));
            lines.push(`  stack: ${card.dataset.tags}`);
            lines.push(`  link: ${link}`);
        });
        return lines;
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
        const discord = document.getElementById('discordLink')?.getAttribute('href') || 'n/a';
        const github = document.getElementById('githubLink')?.getAttribute('href') || 'n/a';
        return [
            `email:   ${email}`,
            `discord: ${discord}`,
            `github:  ${github}`,
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

    function confirmMenuSelection() {
        appendLine("21 - take turns adding 1-3 to the total. whoever hits 21 loses.");
        appendLine("you go first. lose and you owe me an internship. or a job. i'm flexible ;)");
        startGame();
    }

    function cancelPendingTurn() {
        [thinkTimer, commitTimer, lossTimer].forEach(t => {
            if (t !== null) clearTimeout(t);
        });
        thinkTimer = commitTimer = lossTimer = null;
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
        panel.classList.remove('is-flash');
    }

    //Every way out of a game or the menu has to put the same four pieces of
    //state back. Four hand-written copies is four chances to forget one.
    function exitToCommandMode() {
        mode = 'command';
        controlsEl = null;
        input.disabled = false;
        input.placeholder = '';
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

    function startGame() {
        cancelPendingTurn();
        mode = 'game';
        gameTotal = 0;
        input.disabled = true;
        input.placeholder = 'use the buttons above ↑';
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
            endGame('player');
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
                endGame('computer');
            } else {
                renderPlayerTurn();
            }
        }, THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN));
    }

    function endGame(loser) {
        if (loser === 'player') {
            appendLine('💀 total hit 21 - you lose.');
            appendLine("per the house rules you now owe freyr an internship (or a job, i'm not picky).");
            appendLine("type 'game' to run it back.");
        } else {
            appendLine("...that shouldn't have happened. well played.");
        }
        exitToCommandMode();
        appendLine('');
        input.focus();
    }

    function cmdGame() {
        mode = 'menu';
        menuIndex = 0;
        input.disabled = true;
        input.placeholder = '↑↓ to choose, enter to select';
        renderMenu();
        return null;
    }

    const HELP_LINES = [
        'available commands:',
        "  help              show this list",
        "  whoami            who am i",
        "  skills            tech stack",
        "  projects [tag]    things i've built",
        "  education         academic background",
        "  contact           email / discord / github",
        "  game              play a game with me",
        "  blackhole         toggle the backdrop",
        "  clear             clear the screen",
    ];

    const commands = {
        help: () => HELP_LINES,
        whoami: () => readAbout(),
        about: () => readAbout(),
        skills: () => readSkills(),
        projects: (args) => readProjects(args[0]),
        education: () => readEducation(),
        contact: () => readContact(),
        game: () => cmdGame(),
        //blackhole.js is a separate script, so it may legitimately not be here
        //(blocked, failed to load); the command says so rather than throwing.
        blackhole: () => {
            if (!window.blackhole) return 'blackhole: no such object in this universe.';
            return window.blackhole.toggle()
                ? 'accretion disk spun up. scroll to fall in.'
                : 'horizon collapsed. the sky is quiet again.';
        },
        sudo: () => 'permission denied: nice try.',
        clear: () => { output.innerHTML = ''; return null; },
    };

    function runCommand(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return;
        appendLine(trimmed, 'term-line-cmd');
        cmdHistory.push(trimmed);
        historyIndex = cmdHistory.length;

        const [name, ...args] = trimmed.split(/\s+/);
        const handler = commands[name.toLowerCase()];
        if (!handler) {
            appendBlock(`command not found: "${name}". type 'help' for a list of commands.`, 'term-line-error');
            return;
        }
        const result = handler(args);
        if (result) appendBlock(result);
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
            cancelPendingTurn();
            exitToCommandMode();
        }
        trigger.focus();
    }

    trigger.addEventListener('click', openTerminal);
    closeBtn.addEventListener('click', closeTerminal);

    document.addEventListener('keydown', (e) => {
        if (!widget.classList.contains('is-open')) return;

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
            cancelPendingTurn();
            exitToCommandMode();
            appendLine('game forfeited.');
            input.focus();
        } else {
            closeTerminal();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (mode !== 'command') return;
        if (e.key === 'Enter') {
            e.stopPropagation();
            runCommand(input.value);
            input.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length) {
                historyIndex = Math.max(0, historyIndex - 1);
                input.value = cmdHistory[historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (cmdHistory.length) {
                historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
                input.value = cmdHistory[historyIndex] || '';
            }
        }
    });

    output.addEventListener('click', () => input.focus());
})();
