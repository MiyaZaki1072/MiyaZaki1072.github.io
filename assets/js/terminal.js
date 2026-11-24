/* ============================================================
   Form PD-07 terminal and rune mode (assets/js/terminal.js)
   The >_ terminal, its games and the Freyr rune-mode easter egg.
   Loads after main.js and uses its showToast().
   ============================================================ */

// ── Freyr Rune Mode (Hold Portrait or `freyr` Command) ───────
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];
let freyrInterval = null;

function toggleFreyrMode(force) {
    const active = typeof force === 'boolean'
        ? (document.body.classList.toggle('freyr-mode', force), force)
        : document.body.classList.toggle('freyr-mode');

    const flash = document.createElement('div');
    flash.className = 'freyr-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 800);

    if (active) {
        spawnEmber();
        freyrInterval = setInterval(spawnEmber, 550);
        showToast('ᚠ FREYR MODE AWAKENED · GOLDEN BOAR OF ALFHEIM');
    } else {
        clearInterval(freyrInterval);
        freyrInterval = null;
        document.querySelectorAll('.freyr-ember').forEach((e) => e.remove());
        showToast('RETURNED TO STANDARD TVA RECORD');
    }
    return active;
}

function spawnEmber() {
    if (!document.body.classList.contains('freyr-mode')) return;
    const e = document.createElement('span');
    e.className = 'freyr-ember';
    e.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];
    e.style.left = Math.random() * 100 + 'vw';
    e.style.fontSize = (11 + Math.random() * 10).toFixed(0) + 'px';
    const dur = 5 + Math.random() * 5;
    e.style.animationDuration = dur.toFixed(2) + 's';
    e.style.setProperty('--drift', ((Math.random() - 0.5) * 80).toFixed(0) + 'px');
    document.body.appendChild(e);
    setTimeout(() => e.remove(), dur * 1000);
}

/* ============================================================
   Cat Terminal Widget (Cat sleeping on the terminal pill button)
   ============================================================ */
(function initTerminal() {
    const widget = document.getElementById('termWidget');
    const trigger = document.getElementById('termTrigger');
    const panel = document.getElementById('termPanel');
    const closeBtn = document.getElementById('termClose');
    const output = document.getElementById('termOutput');
    const input = document.getElementById('termInput');
    const ghost = document.getElementById('termGhost');
    if (!widget || !trigger || !panel || !closeBtn || !output || !input || !ghost) return;

    const titleEl = document.getElementById('termTitle');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');
    const tagsOf = card => (card.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    const CAT_PHOTOS = [
        { src: 'assets/images/cat/cat-sleeping.webp', alt: 'A black cat asleep on a leather seat' },
        { src: 'assets/images/cat/cat-nightcap.webp', alt: 'The same cat in a cartoon nightcap' },
    ];

    const CHARS = {
        en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234!@#$%&',
        runes: 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ',
    };

    const scrambleFrames = new WeakMap();
    function scrambleText(el, target, options) {
        const { duration = 600, pool = null, suffix = '', asText = false } = options || {};
        const chars = pool || CHARS.en;
        const plain = target.replace(/\n/g, ' ');

        const running = scrambleFrames.get(el);
        if (running !== undefined) cancelAnimationFrame(running);

        const settle = () => {
            scrambleFrames.delete(el);
            if (asText) el.textContent = target;
            else el.innerHTML = target.replace(/\n/g, '<br>') + suffix;
        };

        if (reducedMotion.matches) {
            settle();
            return;
        }

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
    const restoredCmds = cmdHistory.length;

    let hasBooted = false;
    let historyIndex = cmdHistory.length;
    let mode = 'command';
    let trapped = false;
    let capture = null;
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
    let activeCleanup = null;
    const BOOT_AT = Date.now();

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
        list.forEach(l => appendLine(l, className));
    }

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

    // Data readers — Form PD-07 DOM is the source of truth
    function readAbout() {
        const name = (document.querySelector('.overview-name-cell .field-value')?.textContent || 'Thitiwut Sreewasut').trim();
        const codename = (document.querySelector('.overview-codename')?.textContent || 'FREYR').trim();
        const assign = (document.querySelector('.overview-assign-cell .field-value')?.textContent || '').replace(/\s+/g, ' ').trim();
        const status = (document.querySelector('.overview-status-cell .field-value')?.textContent || '').replace(/\s+/g, ' ').trim();
        const remarks = (document.querySelector('.overview-remarks-cell .field-prose')?.textContent || '').replace(/\s+/g, ' ').trim();
        return [
            `name: ${name} ("${codename}")`,
            ...(assign ? [assign] : []),
            ...(status ? [status] : []),
            '',
            remarks,
        ];
    }

    function readSkills() {
        return Array.from(document.querySelectorAll('.skill-group')).map(group => {
            const label = group.querySelector('.skill-group-label')?.textContent.trim();
            const tags = Array.from(group.querySelectorAll('.skill-tag')).map(t => t.dataset.skill || t.textContent.trim());
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

    function projectLines(card) {
        const title = card.querySelector('.project-name')?.textContent.trim();
        const context = card.querySelector('.project-context')?.textContent.replace(/\s+/g, ' ').trim();
        const desc = card.querySelector('.project-desc')?.textContent.replace(/\s+/g, ' ').trim();
        const link = card.querySelector('.project-links a')?.getAttribute('href');
        return [
            title,
            ...(context ? [`  ${context}`] : []),
            ...(desc ? [`  ${desc}`] : []),
            `  stack: ${card.dataset.tags}`,
            ...(link ? [`  link: ${link}`] : []),
        ];
    }

    function readEducation() {
        const groups = Array.from(document.querySelectorAll('#timeline .period-group'));
        if (!groups.length) return ['no education entries found.'];
        const lines = [];
        groups.forEach((g, i) => {
            const year = g.querySelector('.period-years')?.textContent.trim();
            const title = g.querySelector('.period-program')?.textContent.trim();
            const place = g.querySelector('.period-school')?.textContent.trim();
            const gpax = g.querySelector('.period-gpax')?.textContent.trim();
            if (i > 0) lines.push('');
            lines.push(year);
            lines.push(`  ${title} - ${place}${gpax ? ' (' + gpax + ')' : ''}`);
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

    // Game: rigged 21 — computer always lands the total on a multiple of 4
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
        if (controlsEl) {
            controlsEl.querySelectorAll('.term-game-btn').forEach(b => { b.disabled = true; });
            controlsEl.classList.remove('is-committing');
            controlsEl = null;
        }
        if (activeCleanup) {
            const undo = activeCleanup;
            activeCleanup = null;
            undo();
        }
        panel.classList.remove('is-flash');
    }

    function exitToCommandMode() {
        mode = 'command';
        controlsEl = null;
        input.disabled = false;
        input.placeholder = '';
        applyGhost();
    }

    function popButton(btn) {
        if (reducedMotion.matches) return;
        btn.classList.remove('is-hit');
        void btn.offsetWidth;
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

    function endGame(lines) {
        appendBlock(lines);
        exitToCommandMode();
        appendLine('');
        input.focus();
    }

    // Game: rock paper scissors, rigged by answering second -------------------
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

    // Game: guess, rigged by never committing to a number ---------------------
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

    // Commands that reach out of the widget and move the page -----------------
    const SECTIONS = {
        overview: 'overview',
        home: 'overview',
        personnel: 'personnel',
        about: 'personnel',
        skills: 'personnel',
        archives: 'archives',
        projects: 'archives',
        organizing: 'organizing',
        contests: 'organizing',
        kit2code: 'organizing',
        contributions: 'contributions',
        timeline: 'timeline',
        background: 'timeline',
        education: 'timeline',
        contact: 'contact',
    };
    const narrow = window.matchMedia('(max-width: 768px)');

    function cmdGoto(args) {
        const key = (args[0] || '').toLowerCase();
        const id = key === 'top' ? null : SECTIONS[key];
        if (key !== 'top' && !id) {
            return `goto: no section "${args[0] || ''}". try: overview, personnel, archives, timeline, contact, top.`;
        }
        const hidden = narrow.matches;
        if (hidden) closeTerminal();
        if (key === 'top') window.scrollTo({ top: 0, behavior: scrollBehavior() });
        else document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
        return hidden ? null : `scrolling to ${key === 'top' ? 'the top' : '#' + id}...`;
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

    function cmdContrib() {
        const cells = Array.from(document.querySelectorAll('#contribGrid .contrib-day, #contribGrid .contrib-cell'));
        if (!cells.length) return 'contrib: no calendar on the page yet.';

        const BLOCKS = ['·', '░', '▒', '▓', '█'];
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

        const rows = [];
        for (let day = 0; day < 7; day++) {
            rows.push('  ' + weeks.map(w => {
                const cell = w[day];
                if (!cell || cell.classList.contains('is-empty')) return ' ';
                return BLOCKS[Number(cell.dataset.level) || 0];
            }).join(''));
        }
        const stat = id => {
            const el = document.getElementById(id);
            return (el && (el.dataset.final || el.textContent)) || '?';
        };
        const total = stat('contribTotal');
        const streak = stat('contribCurrent');
        return [`${total} contributions in the last year`, '', ...rows, '', `current streak: ${streak}`];
    }

    // Easter eggs -------------------------------------------------------------
    function cmdNeofetch() {
        const name = (document.querySelector('.overview-name-cell .field-value')?.textContent || 'Thitiwut Sreewasut').trim();
        const status = (document.querySelector('.overview-assign-cell .field-value')?.textContent || 'Computer Engineering')
            .replace(/\s+/g, ' ')
            .split('·')[0]
            .trim();
        const role = status.length > 16 ? status.slice(0, 15).trimEnd() + '…' : status;
        const info = [
            'guest@freyr',
            '───────────',
            'host:   miyazaki1072',
            'shell:  term.js',
            `name:   ${name}`,
            `role:   ${role}`,
            `form:   PD-07 (REV. 2026)`,
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

    // File system -------------------------------------------------------------
    const slugOf = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const cwdParts = [];

    function buildFs() {
        const dir = children => ({ dir: true, children });
        const file = read => ({ dir: false, read });

        const projects = {};
        document.querySelectorAll('.project-card[data-tags]').forEach(card => {
            const title = card.querySelector('.project-name')?.textContent.trim();
            if (title) projects[`${slugOf(title)}.md`] = file(() => projectLines(card));
        });

        const education = {};
        document.querySelectorAll('#timeline .period-group').forEach(g => {
            const year = g.querySelector('.period-years')?.textContent.trim();
            const title = g.querySelector('.period-program')?.textContent.trim();
            const place = g.querySelector('.period-school')?.textContent.trim();
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

    function listPaths(node, base) {
        return Object.keys(node.children).flatMap(name => {
            const child = node.children[name];
            return child.dir ? listPaths(child, `${base}/${name}`) : [`${base}/${name}`];
        });
    }

    // Shell basics ------------------------------------------------------------
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

    // Fun ---------------------------------------------------------------------
    const FORTUNES = [
        ['it works on my machine.', 'ship the machine.'],
        ['a bug is a feature', 'with no marketing.'],
        ['tabs or spaces:', 'both are wrong at 3am.'],
        ['the cat reviewed your code.', 'it is unimpressed.'],
        ['git push --force is a', 'personality, not a plan.'],
        ['O(n) is fine', 'until n is the internet.'],
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
        const status = document.querySelector('.overview-status-cell .field-value')?.textContent.trim();
        return ['good choice.', ...(status ? [status] : []), cmdOpen(['email'])];
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

    const TRAIN = [
        '   (@@)    ______________________',
        '  (    )  | [] [] [] [] [] [] [] |',
        ' =========|______________________|',
        '  O  O  O    O  O      O  O  O  O',
    ];

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

    const COMMANDS = [
        { name: 'help',      args: '',      help: 'show this list',      run: () => renderHelp() },
        { name: 'whoami',    args: '',      help: 'who am i',            run: () => readAbout(), alias: ['about'] },
        { name: 'skills',    args: '',      help: 'tech stack',          run: () => readSkills() },
        { name: 'projects',  args: '[tag]', help: "things i've built",   run: (a) => readProjects(a[0]),
          man: ['list projects. a tag shows', 'only those built with it.', '', 'try: projects | grep stack'],
          complete: partial => {
              const tags = new Set();
              document.querySelectorAll('.project-card[data-tags]')
                  .forEach(card => tagsOf(card).forEach(t => tags.add(t)));
              return [...tags].filter(t => t.toLowerCase().startsWith(partial.toLowerCase())).sort();
          } },
        { name: 'education', args: '',      help: 'where i studied',     run: () => readEducation(), alias: ['timeline'] },
        { name: 'contact',   args: '',      help: 'how to reach me',     run: () => readContact() },
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
        { name: 'open',      args: '<link>',    help: 'open a link',       run: (a) => cmdOpen(a) },
        { name: 'matrix',    args: '',      help: 'follow the rabbit',   noPipe: true, run: () => cmdMatrix() },
        { name: 'neofetch',  args: '',      help: 'system info',
          run: () => { appendBlock(cmdNeofetch(), 'term-line-art'); return null; } },
        { name: 'cowsay',    args: '<text>', help: 'the cat says it',
          run: (a) => { appendBlock(cmdCowsay(a), 'term-line-art'); return null; } },
        { name: 'clear',     args: '',      help: 'clear the screen',    noPipe: true, run: () => { output.innerHTML = ''; return null; } },
        { name: 'exit',      args: '',      help: 'close the panel',     noPipe: true, run: () => { closeTerminal(); return null; } },
        { name: 'freyr', hidden: true, alias: ['yngvi'],
          run: () => {
              appendBlock([
                  'ᚠᚱᛅᛁᛦ · Freyr of the Vanir,',
                  'son of Njörðr.',
                  ' ',
                  '"he rules over the rain and the',
                  ' shining of the sun, and',
                  ' therewithal the fruit of the',
                  ' earth"  — Gylfaginning 24',
                  ' ',
                  'his boar Gullinbursti lights',
                  'the dark; his ship Skíðblaðnir',
                  'folds away into a pouch.',
                  'he gave his sword for Gerðr,',
                  'and meets Surtr without it.',
                  ' ',
                  '"Of the heroes brave is Freyr',
                  ' the best"  — Lokasenna 37',
              ], 'term-line-art');
              return toggleFreyrMode() ? 'ᛜ the runes wake.' : 'ᛜ the runes rest.';
          } },
        { name: 'rm', hidden: true, run: (a) => cmdRm(a) },
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

    function completionsFor(value) {
        const parts = value.split(/\s+/);
        if (parts.length <= 1) {
            return COMMANDS.filter(c => !c.hidden && c.name.startsWith(parts[0])).map(c => c.name);
        }
        const entry = commandMap.get(parts[0].toLowerCase());
        if (!entry || !entry.complete) return [];
        return entry.complete(parts[parts.length - 1]);
    }

    function commonPrefix(list) {
        if (!list.length) return '';
        return list.reduce((acc, s) => {
            let i = 0;
            while (i < acc.length && i < s.length && acc[i] === s[i]) i++;
            return acc.slice(0, i);
        });
    }

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
            if (list.length === 1 && !list[0].endsWith('/')) input.value += ' ';
        } else if (list.length > 1) {
            appendLine(value, 'term-line-cmd');
            appendBlock(list.join('   '), 'term-line-hint');
        }
        applyGhost();
    }

    function handleControlKey(e) {
        if (!e.ctrlKey || e.altKey || e.metaKey) return false;
        const key = e.key.toLowerCase();
        if (key === 'l') {
            e.preventDefault();
            output.innerHTML = '';
            return true;
        }
        if (key === 'c') {
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
        if (e.ctrlKey) {
            if (handleControlKey(e)) e.stopPropagation();
            return;
        }
        if (mode !== 'command') return;
        if (e.key === 'Tab') {
            e.preventDefault();
            completeInput();
        } else if (e.key === 'Enter') {
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
