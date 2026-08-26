//Nav scrollspy
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
if (navLinks.length && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                });
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
}

let updateTechTooltips = null;

//Image change
const myFaceImage = document.querySelector(".myFaceImage");
const profileChangeRing = document.querySelector(".profileChangeRing");
const statusDot = document.querySelector(".status-dot");
const avatarRing = document.querySelector(".avatar-ring");
let profileItr = -1;
let startTime;
let hoverProfileInterval;
let imageArray = [
    "images/myface1.png" , 
    "images/myface2.png" ,
];
let ringColor = [
    "var(--green)",
    "var(--amber)"
];
let percentageOfTime;
function changeProfilePicture(){
    profileItr = (profileItr + 1)%2;
    myFaceImage.src = imageArray[profileItr];
    profileChangeRing.style.setProperty("--progress",`${0}deg`); 
    statusDot.style.background = ringColor[profileItr];
    avatarRing.style.border = "2.5px solid " + ringColor[profileItr];
    statusDot.style.boxShadow ="0 0 14px " + ringColor[profileItr];
    profileChangeRing.style.setProperty("--ring-color",ringColor[profileItr]);
}
changeProfilePicture();
myFaceImage.addEventListener("mouseenter",() =>{
    startTime = Date.now();
    hoverProfileInterval = setInterval(() => {
        const time = ((Date.now() - startTime));
        percentageOfTime = Math.min(1,(time/3000));
        profileChangeRing.style.setProperty("--progress",`${percentageOfTime*360}deg`); 
        if(time >= 3000){
            changeProfilePicture();
            startTime = Date.now();
        }
    },100);
});
myFaceImage.addEventListener("mouseleave",()=>{
    profileChangeRing.style.setProperty("--progress",`${0}deg`); 
    clearInterval(hoverProfileInterval);
});

const translateBtn = document.getElementById('translateBtn');
const translateLabel = document.getElementById('translateLabel');
let lang = 'en';
let animating = false;

const content = {
    en: {
        tagLine: '> whoami',
        name: 'Freyr',
        status: 'Computer Engineering Student\n@ Chulalongkorn University',
        interestLabel: '// areas of interest',
        interests: ['Backend Engineering', 'Competitive Programming'],
        skillsLabel: '// what i use',
        skillGroups: ['languages', 'tools', 'frameworks & libraries'],
        tooltipHas: '→ see what i built',
        tooltipNone: '→ no projects yet',
        btns: ['Email', 'Discord', 'GitHub'],
    },
    th: {
        tagLine: '> ฉันคือใคร',
        name: 'เฟรย์',
        status: 'วิศวกรรมคอมพิวเตอร์\n@ จุฬาลงกรณ์มหาวิทยาลัย',
        interestLabel: '// สาขาที่สนใจ',
        interests: ['ซอฟต์แวร์ระบบหลังบ้าน', 'การเขียนโปรเเกรมเชิงเเข่งขัน'],
        skillsLabel: '// เทคโนโลยีที่ใช้',
        skillGroups: ['ภาษา', 'เครื่องมือ', 'เฟรมเวิร์กและไลบรารี'],
        tooltipHas: '→ ดูโปรเจคที่ผมทำ',
        tooltipNone: '→ ยังไม่มีโปรเจคนี้',
        btns: ['อีเมล', 'ดิสคอร์ด', 'กิตฮับ'],
    }
};

const CHARS = {
    en:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234!@#$%&',
    th:'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ'
}

function scramble(el, target, duration = 600, isHTML = false) {
    const plain = target.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
    const totalFrames = Math.round(duration / 16);
    let frame = 0;

    const tick = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;

        const scrambled = plain.split('').map((char, i) => {
            if (char === ' ' || char === '\n') return char;
            if (i / plain.length < progress) return char;
            return CHARS[lang][Math.floor(Math.random() * CHARS[lang].length)];
        }).join('');

        el.textContent = scrambled;

        if (frame >= totalFrames) {
            clearInterval(tick);
            if (isHTML) {
                el.innerHTML = target;
            } else {
                el.innerHTML = target.replace(/\n/g, '<br>');
            }
        }
    }, 16);
}

function scrambleName(el, target, duration = 700) {
    const totalFrames = Math.round(duration / 16);
    let frame = 0;
    const tick = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const scrambled = target.split('').map((char, i) => {
            if (i / target.length < progress) return char;
            return CHARS[lang][Math.floor(Math.random() * CHARS[lang].length)];
        }).join('');
        el.innerHTML = scrambled + '<span class="cursor">_</span>';
        if (frame >= totalFrames) {
            clearInterval(tick);
            el.innerHTML = target + '<span class="cursor">_</span>';
        }
    }, 16);
}

translateBtn.addEventListener('click', () => {
    if (animating) return;
    animating = true;
    lang = lang === 'en' ? 'th' : 'en';
    const d = content[lang];
    translateLabel.textContent = lang === 'en' ? 'EN / TH' : 'TH / EN';
    translateBtn.classList.toggle('active', lang === 'th');
    const delays = [0, 80, 160, 240, 320, 400];
    const targets = [
        { el: document.querySelector('.tag-line'),      text: d.tagLine,        delay: delays[0] },
        { el: document.querySelector('.name-txt'),      text: d.name,           delay: delays[1], isName: true },
        { el: document.querySelector('.status-txt'),    text: d.status,         delay: delays[2] },
        { el: document.querySelector('.interest-label'),text: d.interestLabel,  delay: delays[3] },
        { el: document.querySelector('.skills-label'),  text: d.skillsLabel,    delay: delays[3] + 60 },
    ];
    targets.forEach(({ el, text, delay, isName }) => {
        setTimeout(() => {
            if (isName) scrambleName(el, text, 650);
            else scramble(el, text, 600);
        }, delay);
    });
    const items = document.querySelectorAll('.interest-list li');
    items.forEach((li, i) => {
        setTimeout(() => scramble(li, d.interests[i], 550), delays[4] + i * 80);
    });
    const groupLabels = document.querySelectorAll('.skill-group-label');
    groupLabels.forEach((label, i) => {
        setTimeout(() => scramble(label, d.skillGroups[i], 450), delays[4] + i * 80);
    });
    const btns = document.querySelectorAll('.contact-btn');
    btns.forEach((btn, i) => {
        setTimeout(() => scramble(btn, d.btns[i], 450), delays[5] + i * 60);
    });
    if (updateTechTooltips) updateTechTooltips();
    setTimeout(() => { animating = false; }, 1100);
});

//Email copy-to-clipboard
const emailBtn = document.getElementById('emailBtn');
const toast = document.getElementById('toast');
let toastTimeout;
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
    toast.textContent = `> copied "${email}" to clipboard`;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
});

//Project card click ripple
document.querySelectorAll('.project-img-link').forEach(link => {
    link.addEventListener('click', (e) => {
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

//Project tech-stack filter
const projectCards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
const filterTagsContainer = document.getElementById('filterTags');
const filterClearBtn = document.getElementById('filterClear');
const filterEmptyMsg = document.getElementById('filterEmpty');

if (projectCards.length && filterTagsContainer) {
    const activeFilters = new Set();
    const uniqueTags = [];
    projectCards.forEach(card => {
        card.dataset.tags.split(',').map(t => t.trim()).forEach(tag => {
            if (!uniqueTags.includes(tag)) uniqueTags.push(tag);
        });
    });

    uniqueTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'skill-tag';
        btn.dataset.tech = tag;
        btn.textContent = tag;
        btn.addEventListener('click', () => toggleFilter(tag));
        filterTagsContainer.appendChild(btn);
    });

    function applyFilters() {
        let visibleCount = 0;
        projectCards.forEach(card => {
            const tags = card.dataset.tags.split(',').map(t => t.trim());
            const matches = activeFilters.size === 0 || Array.from(activeFilters).every(f => tags.includes(f));
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
        activeFilters.has(tag) ? activeFilters.delete(tag) : activeFilters.add(tag);
        applyFilters();
    }

    function setSingleFilter(tag) {
        activeFilters.clear();
        activeFilters.add(tag);
        applyFilters();
    }

    function clearFilters() {
        activeFilters.clear();
        applyFilters();
    }

    filterClearBtn.addEventListener('click', clearFilters);

    //Hero skill tags jump to matching (filtered) projects
    const heroTechBtns = document.querySelectorAll('.skills-block button.skill-tag[data-tech]');
    updateTechTooltips = function () {
        const d = content[lang];
        heroTechBtns.forEach(btn => {
            const tech = btn.dataset.tech;
            btn.dataset.tooltip = uniqueTags.includes(tech) ? d.tooltipHas : d.tooltipNone;
        });
    };
    updateTechTooltips();
    heroTechBtns.forEach(btn => {
        const tech = btn.dataset.tech;
        btn.addEventListener('click', () => {
            if (uniqueTags.includes(tech)) {
                setSingleFilter(tech);
            } else {
                clearFilters();
                toast.textContent = `> no projects tagged "${tech}" yet`;
                toast.classList.add('show');
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
            }
            document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

//Background timeline — experience/education switch
(function () {
    const timeline = document.getElementById('timeline');
    const toggle = document.getElementById('bgToggle');
    const toggleLabel = document.getElementById('bgToggleLabel');
    const toggleHint = document.getElementById('bgToggleHint');
    const emptyMsg = document.getElementById('timelineEmpty');
    if (!timeline || !toggle || !toggleLabel || !toggleHint) return;

    const other = mode => mode === 'education' ? 'experience' : 'education';
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    function setMode(mode) {
        timeline.dataset.mode = mode;
        const categoryItems = timeline.querySelectorAll('.timeline-item[data-category]');
        let anyVisible = false;
        categoryItems.forEach(item => {
            const show = item.dataset.category === mode;
            item.hidden = !show;
            if (show) anyVisible = true;
        });
        if (emptyMsg) emptyMsg.hidden = anyVisible;

        toggleLabel.textContent = capitalize(mode);
        toggleHint.textContent = `switch to ${other(mode)} →`;
        toggle.setAttribute('aria-label', `Currently showing ${mode}. Click to switch to ${other(mode)}.`);
    }

    toggle.addEventListener('click', () => setMode(other(timeline.dataset.mode)));

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

    const GAMES = [
        { id: '21', label: '21 — last to 21 loses' },
    ];

    function scrambleTermLine(el, target, duration = 400) {
        const totalFrames = Math.round(duration / 16);
        let frame = 0;
        const tick = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const scrambled = target.split('').map((char, i) => {
                if (char === ' ') return char;
                if (i / target.length < progress) return char;
                return CHARS.en[Math.floor(Math.random() * CHARS.en.length)];
            }).join('');
            el.textContent = scrambled;
            if (frame >= totalFrames) {
                clearInterval(tick);
                el.textContent = target;
            }
        }, 16);
    }

    function appendLine(text, className) {
        const line = document.createElement('div');
        line.className = 'term-line' + (className ? ' ' + className : '');
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        return line;
    }

    function appendBlock(lines, className) {
        (Array.isArray(lines) ? lines : [lines]).forEach(l => appendLine(l, className));
        output.scrollTop = output.scrollHeight;
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
        const filtered = filterTag
            ? cards.filter(c => c.dataset.tags.split(',').map(t => t.trim().toLowerCase()).includes(filterTag.toLowerCase()))
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
        const items = Array.from(document.querySelectorAll('.timeline-item[data-category="education"]'));
        const lines = [];
        items.forEach((item, i) => {
            const year = item.querySelector('.timeline-year')?.textContent.trim();
            const title = item.querySelector('.timeline-title')?.textContent.trim();
            const place = item.querySelector('.timeline-place')?.textContent.trim();
            if (i > 0) lines.push('');
            lines.push(year);
            lines.push(`  ${title} — ${place}`);
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
        appendLine("21 — take turns adding 1-3 to the total. whoever hits 21 loses.");
        appendLine("you go first. lose and you owe me an internship. or a job. i'm flexible ;)");
        startGame();
    }

    function startGame() {
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
            <span class="term-game-status">total: ${gameTotal} — adding: 0</span>
            <button type="button" class="term-game-btn" data-action="add">+1</button>
            <button type="button" class="term-game-btn term-game-done" data-action="done" disabled>done</button>
        `;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        controlsEl = line;

        const addBtn = line.querySelector('[data-action="add"]');
        const doneBtn = line.querySelector('[data-action="done"]');
        const status = line.querySelector('.term-game-status');

        function finishTurn() {
            addBtn.disabled = true;
            doneBtn.disabled = true;
            const played = gamePending;
            gameTotal += played;
            const summary = document.createElement('div');
            summary.className = 'term-line';
            summary.textContent = `you added ${played} → total: ${gameTotal}`;
            line.replaceWith(summary);
            output.scrollTop = output.scrollHeight;
            controlsEl = null;
            if (gameTotal >= 21) {
                triggerLossEffect();
            } else {
                computerTurn();
            }
        }

        addBtn.addEventListener('click', () => {
            gamePending = Math.min(3, gamePending + 1);
            status.textContent = `total: ${gameTotal} — adding: ${gamePending}`;
            doneBtn.disabled = false;
            if (gamePending >= 3) addBtn.disabled = true;
            if (gameTotal + gamePending >= 21) {
                finishTurn();
            }
        });
        doneBtn.addEventListener('click', finishTurn);
    }

    function triggerLossEffect() {
        panel.classList.add('is-flash');
        setTimeout(() => {
            panel.classList.remove('is-flash');
            endGame('player');
        }, 380);
    }

    function computerTurn() {
        const move = 4 - (gameTotal % 4);
        gameTotal += move;
        appendLine(`freyr added ${move} → total: ${gameTotal}`);
        if (gameTotal >= 21) {
            endGame('computer');
        } else {
            renderPlayerTurn();
        }
    }

    function endGame(loser) {
        if (loser === 'player') {
            appendLine('💀 total hit 21 — you lose.');
            appendLine("per the house rules you now owe freyr an internship (or a job, i'm not picky).");
            appendLine("type 'game' to run it back.");
        } else {
            appendLine("...that shouldn't have happened. well played.");
        }
        mode = 'command';
        input.disabled = false;
        input.placeholder = '';
        controlsEl = null;
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
        scrambleTermLine(l1, "freyr's terminal — type 'help' to get started", 500);
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
            mode = 'command';
            input.disabled = false;
            input.placeholder = '';
            controlsEl = null;
        }
        trigger.focus();
    }

    trigger.addEventListener('click', openTerminal);
    closeBtn.addEventListener('click', closeTerminal);

    document.addEventListener('keydown', (e) => {
        if (!widget.classList.contains('is-open')) return;

        if (mode === 'menu') {
            if (e.key === 'Escape') {
                mode = 'command';
                input.disabled = false;
                input.placeholder = '';
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
            mode = 'command';
            input.disabled = false;
            input.placeholder = '';
            controlsEl = null;
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
