/* ============================================================
   Isometric line diagrams (assets/js/iso.js)
   Draws each featured project's real architecture as a small
   animated machine, and the filing cabinet on the boot card.
   Pure SVG + SMIL, no dependencies.
   ============================================================ */

(function () {
    const COS30 = Math.cos(Math.PI / 6);
    const UNIT = 20;
    const CYCLE = 4; // seconds; every scene loops on the same beat
    const CHAR_W = 6.5; // glyph advance at the leader-label size, letter-spacing included

    const toScreen = (x, y, z) => [(x - y) * COS30 * UNIT, (x + y) * 0.5 * UNIT - z * UNIT];
    const n1 = (v) => v.toFixed(1);
    const fmt = (p) => n1(p[0]) + ',' + n1(p[1]);
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const line = (a, b, cls) =>
        `<line class="${cls}" x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}"/>`;
    const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

    // Text painted flat onto a face. Local x always runs along the world x
    // axis; local y runs down the face (left face) or along +y (top face).
    const FACE = {
        left: (o) => `matrix(${COS30.toFixed(4)} 0.5 0 1 ${n1(o[0])} ${n1(o[1])})`,
        top: (o) => `matrix(${COS30.toFixed(4)} 0.5 ${(-COS30).toFixed(4)} 0.5 ${n1(o[0])} ${n1(o[1])})`,
    };
    function faceText(origin, face, text, size, room, cls) {
        const fit = Math.min(size, room / (text.length * 0.62));
        return `<text class="iso-ft ${cls || ''}" transform="${FACE[face](origin)}" y="${n1(fit * 0.36)}" ` +
            `font-size="${n1(fit)}">${esc(text)}</text>`;
    }

    // A part's explanation, read by the full-screen viewer ("Title|text").
    function noteAttr(note) {
        if (!note) return '';
        const [title, text] = note.split('|');
        return ` data-note="${esc(title)}" data-note-text="${esc(text || '')}"`;
    }

    // Collects shapes in three layers (floor, solids, notes) and tracks
    // the drawing's bounds so the viewBox fits whatever the scene draws.
    // Solids are painted in call order, so scenes add them back to front.
    function Scene() {
        const floor = [];
        const solids = [];
        const notes = [];
        const b = [Infinity, Infinity, -Infinity, -Infinity];

        function grow(x, y) {
            b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
            b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
        }
        function P(x, y, z) {
            const p = toScreen(x, y, z || 0);
            grow(p[0], p[1]);
            return p;
        }
        const poly = (pts, cls) => `<polygon class="${cls}" points="${pts.map(fmt).join(' ')}"/>`;

        // Opacity pulse that switches on at `at` seconds and holds until the
        // cycle restarts. All pulses share one clock, so they stay in step.
        function pulse(at) {
            const t = Math.min(Math.max(at / CYCLE, 0.001), 0.85);
            return `<animate attributeName="opacity" dur="${CYCLE}s" repeatCount="indefinite" ` +
                `values="0;0;1;1;0" keyTimes="0;${t.toFixed(3)};${(t + 0.03).toFixed(3)};0.94;1"/>`;
        }

        const api = {
            // opt: cls, lines(faces), hot (seconds), left (name on the front
            // face), top (smaller text on the top face), note ("Title|text")
            box(x, y, z, w, d, h, opt) {
                opt = opt || {};
                const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
                const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
                const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
                let s = `<g class="iso-box ${opt.cls || ''}"${noteAttr(opt.note)}>` +
                    poly(right, 'f-r') + poly(left, 'f-l') + poly(top, 'f-t');
                if (opt.lines) s += opt.lines({ top, left, right });
                if (opt.hot != null) {
                    s += `<g class="f-hot" opacity="0">${poly(right, 'f-r')}${poly(left, 'f-l')}${poly(top, 'f-t')}${pulse(opt.hot)}</g>`;
                }
                const room = (w - 0.36) * UNIT;
                if (opt.left) s += faceText(toScreen(x + 0.18, y + d, z + h / 2), 'left', opt.left, Math.min(8, h * UNIT * 0.5), room);
                if (opt.top) s += faceText(toScreen(x + 0.18, y + d / 2, z + h), 'top', opt.top, Math.min(7, d * UNIT * 0.4), room, 'is-sub');
                solids.push(s + '</g>');
                return api;
            },
            // Upright cylinder (a database) centred on (cx, cy).
            cylinder(cx, cy, z, r, h, opt) {
                opt = opt || {};
                const rx = r * Math.SQRT2 * COS30 * UNIT;
                const ry = r * Math.SQRT2 * 0.5 * UNIT;
                const t = P(cx, cy, z + h), bt = P(cx, cy, z);
                grow(t[0] - rx, t[1] - ry); grow(bt[0] + rx, bt[1] + ry);
                const L = n1(bt[0] - rx), R = n1(bt[0] + rx);
                const bands = opt.bands || 3;
                const arc = (yy) => `M${L},${n1(yy)} A${n1(rx)} ${n1(ry)} 0 0 0 ${R},${n1(yy)}`;
                let s = `<g class="iso-cyl ${opt.cls || ''}"${noteAttr(opt.note)}>` +
                    `<path class="f-l" d="M${L},${n1(t[1])} L${L},${n1(bt[1])} A${n1(rx)} ${n1(ry)} 0 0 0 ${R},${n1(bt[1])} L${R},${n1(t[1])} Z"/>`;
                for (let k = 1; k < bands; k++) {
                    s += `<path class="f-band" d="${arc(bt[1] - (bt[1] - t[1]) * (k / bands))}"/>`;
                }
                s += `<ellipse class="f-t" cx="${n1(t[0])}" cy="${n1(t[1])}" rx="${n1(rx)}" ry="${n1(ry)}"/>`;
                if (opt.top) s += `<text class="iso-ft is-sub" x="${n1(t[0])}" y="${n1(t[1] + 2.2)}" text-anchor="middle" font-size="${n1(Math.min(6.5, (rx * 1.6) / (opt.top.length * 0.62)))}">${esc(opt.top)}</text>`;
                solids.push(s + '</g>');
                return api;
            },
            // A zone on the floor (a network, a session), named along its front edge.
            // `at` moves the name along the edge, clear of parts standing on it.
            plate(x, y, w, d, name, at) {
                const pts = [P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)];
                const start = at || 0.3;
                floor.push(poly(pts, 'iso-plate'));
                if (name) floor.push(faceText(toScreen(x + start, y + d - 0.45, 0), 'top', name, 7, (w - start - 0.3) * UNIT * 0.84, 'is-plate')); // 0.84: wider letter-spacing
                return api;
            },
            // A run of conveyor on the floor plus packets riding along it.
            pipe(points, opt) {
                opt = opt || {};
                const d = 'M' + points.map((q) => fmt(P(q[0], q[1], q[2] || 0))).join(' L');
                floor.push(`<path class="iso-pipe ${opt.cls || ''}" d="${d}"/>`);
                (opt.packets || []).forEach((offset) => {
                    floor.push(
                        `<g class="iso-packet ${opt.cls || ''}"><polygon points="0,-3.5 6,0 0,3.5 -6,0"/>` +
                        `<animateMotion dur="${opt.dur || CYCLE}s" begin="${(-offset).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></g>`
                    );
                });
                return api;
            },
            // Leader line from a point on the model to a caption.
            label(x, y, z, dx, dy, text, cls) {
                const a = P(x, y, z);
                const q = [a[0] + dx, a[1] + dy];
                const right = dx >= 0;
                const tx = q[0] + (right ? 4 : -4);
                const w = text.length * CHAR_W;
                grow(right ? tx + w : tx - w, q[1] - 8);
                grow(tx, q[1] + 4);
                notes.push(
                    `<g class="iso-note ${cls || ''}"><circle cx="${n1(a[0])}" cy="${n1(a[1])}" r="1.6"/>` +
                    line(a, q, 'iso-leader') +
                    `<text x="${n1(tx)}" y="${n1(q[1] + 3)}" text-anchor="${right ? 'start' : 'end'}">${esc(text)}</text></g>`
                );
                return api;
            },
            // Lines ruled across a top face: rows along x, cols along y.
            grid(x, y, z, w, d, rows, cols) {
                let s = '';
                for (let i = 1; i < rows; i++) {
                    const yy = y + (d * i) / rows;
                    s += line(toScreen(x, yy, z), toScreen(x + w, yy, z), 'f-rule');
                }
                for (let j = 1; j < cols; j++) {
                    const xx = x + (w * j) / cols;
                    s += line(toScreen(xx, y, z), toScreen(xx, y + d, z), 'f-rule');
                }
                return s;
            },
            viewBox(ratio) {
                const pad = 12;
                let x0 = b[0] - pad, y0 = b[1] - pad, x1 = b[2] + pad, y1 = b[3] + pad;
                if (ratio) {
                    const w = x1 - x0, h = y1 - y0;
                    if (w / h < ratio) { const nw = h * ratio; x0 -= (nw - w) / 2; x1 = x0 + nw; }
                    else { const nh = w / ratio; y0 -= (nh - h) / 2; y1 = y0 + nh; }
                }
                return [x0, y0, x1 - x0, y1 - y0].map(n1).join(' ');
            },
            layers() {
                return {
                    floor: `<g class="iso-floor">${floor.join('')}</g>`,
                    solids: `<g class="iso-solids">${solids.join('')}</g>`,
                    notes: `<g class="iso-notes">${notes.join('')}</g>`,
                };
            },
            svg(title, ratio) {
                const l = api.layers();
                // aria-label only: a <title> would pop up as a browser tooltip on hover.
                return `<svg class="iso" viewBox="${api.viewBox(ratio)}" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">` +
                    `${l.floor}${l.solids}${l.notes}</svg>`;
            },
        };
        return api;
    }

    // Short divider lines ruled across a face, between its bottom and top edges.
    function faceRules(face, count) {
        let out = '';
        for (let k = 1; k < count; k++) {
            const f = k / count;
            out += line(lerp(face[0], face[3], f), lerp(face[1], face[2], f), 'f-rule');
        }
        return out;
    }

    // A browser window: a title bar ruled across the top of its front face.
    const windowBar = ({ left }) =>
        line(lerp(left[3], left[0], 0.16), lerp(left[2], left[1], 0.16), 'f-rule');

    // Server rack: unit lines across the right face.
    const rack = (n) => ({ right }) => faceRules(right, n);

    // ── Project scenes (drawn from each repository's real layout) ──
    const scenes = {
        // Kit2Code/backend, docs/ARCHITECTURE.md. A submission and its
        // JudgeJob go into Postgres in one transaction; the worker claims
        // jobs from web-admin's /internal API and judges them in isolate.
        grader() {
            const s = Scene();
            s.plate(0.2, 4.3, 16.2, 3.6, 'JUDGE_NET · NO INTERNET · NO DATABASE ROUTE');

            s.pipe([[1.1, 1], [14, 1]], { packets: [0, 2] })
                .pipe([[10.4, 1.5], [1.1, 1.5]], { cls: 'is-back', packets: [1] })
                .pipe([[14, 1], [14, 6], [1.6, 6]], { packets: [0.6, 2.6] })
                .pipe([[2.2, 6.5], [14.6, 6.5], [14.6, 1.6]], { cls: 'is-back', packets: [1.4, 3.4] });

            s.box(0, 0.9, 0, 2.3, 0.22, 1.7, { left: 'BROWSER', lines: windowBar, note: 'Browser|Students sign in with Google and submit C, C++ or Python, up to 64 KB. Limits: one submission per 10 s, 3 waiting, 120 per hour.' })
                .box(3.1, 0.45, 0, 1.9, 1.2, 0.45, { top: 'TUNNEL', note: 'Cloudflare tunnel|cloudflared carries public traffic from Cloudflare to the edge, so the home router opens no ports.' })
                .box(5.8, 0, 0, 2.1, 2, 1.15, { left: 'EDGE', top: 'CADDY', note: 'Edge · Caddy|The single entry point. Routes each port to one role, sets the zone header, blocks /admin and /internal on the public port, and sets a strict Content-Security-Policy.' })
                .box(8.9, 0, 0, 2.5, 2, 1.6, { left: 'WEB', top: 'DJANGO', cls: 'is-signal', note: 'Web · public role|Django loading urls_public.py: the admin pages and the internal API are not in its URL configuration at all. Saves a Submission and its JudgeJob in one transaction.' })
                .cylinder(14, 1, 0, 1.15, 1.7, { top: 'POSTGRES', note: 'PostgreSQL|Users, problems, submissions, and the judge queue itself: the JudgeJob table, no Redis. Restarting the web roles loses nothing.' });

            for (let i = 0; i < 4; i++) {
                const x = 0.7 + i * 1.45;
                s.box(x + 0.3, 5.75, 0, 0.5, 0.5, 0.5, { cls: 'is-signal' })
                    .box(x, 5.45, 0, 1.1, 1.1, 1.1, { cls: 'is-glass', hot: 1.6 + i * 0.3, note: 'isolate boxes|isolate 2.7 in its own cgroup (grader-judge), boxes 100–109, so it never collides with the CMS isolate on the same server. Every program starts through box-exec with a seccomp filter.' });
            }
            s.box(7.4, 5, 0, 2.5, 2, 1.3, { left: 'WORKER', top: 'JUDGE SLOTS', lines: rack(3), note: 'Worker|Polls web-admin, claims a job with a 60 s lease, sends a heartbeat every 10 s and judges one job per slot. On judge_net only: no internet, no database password.' })
                .box(12.9, 5, 0, 2.5, 2, 1.6, { left: 'WEB-ADMIN', top: '/INTERNAL', note: 'Web-admin · admin role|The same Django image with GRADER_ROLE=admin. Its /internal API hands jobs to the worker (claim, heartbeat, progress, complete) behind a bearer token, never through the edge.' });

            s.label(1.1, 0.9, 1.7, -6, -30, 'SUBMIT · C / C++ / PYTHON')
                .label(14, 0.2, 1.7, 8, -26, 'SUBMISSION + JUDGEJOB QUEUE')
                .label(2.9, 5.45, 1.1, -10, -34, 'ISOLATE 2.7 · BOXES 100–109')
                .label(10.4, 6.5, 0, -30, 72, 'WORKER CLAIMS JOBS · 60 S LEASE · HEARTBEAT 10 S')
                .label(10.1, 2, 0, 12, 22, 'LIVE RESULTS · HTMX EVERY 2 S', 'is-key');
            return s.svg('Kit2Code Grader architecture: the browser submits through a Cloudflare tunnel and the Caddy edge to the public Django site, which stores the submission and its judge job in Postgres. The worker, on a network with no internet and no database route, claims jobs from web-admin\'s internal API, runs them in isolate boxes 100 to 109, and reports results back; the page polls with htmx every 2 seconds.', 16 / 9);
        },

        // cms-admin-helper-extension: the content script on the AWS tab,
        // the request queue in core/queue.ts, the background service worker.
        cms() {
            const s = Scene();
            s.plate(-0.6, -0.7, 10.9, 9.9, "ADMIN'S BROWSER · ONE AWS ADDRESS ONLY");

            s.pipe([[-2.4, 1], [0.6, 1]], { packets: [0.4] })
                .pipe([[4.6, 0.9], [12, 0.9]], { packets: [0, 1.4, 2.8] })
                .pipe([[12, 1.5], [4.6, 1.5]], { cls: 'is-back', packets: [0.7, 2.1, 3.5] })
                .pipe([[2, 1.2], [2, 5.6], [6.2, 5.6]], { cls: 'is-back', packets: [1.2] })
                .pipe([[4.3, 5.6], [4.3, 6.8], [8.6, 6.8]], { packets: [2.4] });

            s.box(-4.4, 0.1, 0, 2.2, 1.6, 0.28, { lines: () => s.grid(-4.4, 0.1, 0.28, 2.2, 1.6, 4, 3), note: 'Spreadsheet import|Paste from Excel or Google Sheets, or load a CSV or XLSX file. Every row is checked against CMS before anything is sent.' })
                .box(0.2, 0.75, 0, 4.4, 0.22, 2.1, { left: 'AWS TAB', lines: windowBar, note: 'AWS tab|The content script runs only on the one AWS address the admin entered, and adds a Helper item to the AWS menu.' })
                .box(2.6, 0.97, 0.2, 1.8, 0.16, 1.4, { left: 'HELPER', cls: 'is-signal', note: "Helper panel|Tracker, Import, Time, Tools and Log tabs, working through the admin's own logged-in session." })
                .box(5.8, 0.1, 0, 2.6, 1.8, 0.95, { left: 'QUEUE', top: '≤2 · 4/S', cls: 'is-brass', note: 'Request queue|core/queue.ts: every request to CMS passes through it. At most 2 at once and 4 starts per second, across all AWS tabs, with back-off when the server struggles.' })
                .box(11.6, 0, 0, 2.3, 2.2, 2.7, { left: 'AWS :8889', top: 'CMS V1.5', lines: rack(5), note: 'CMS v1.5 AdminWebServer|The extension submits the same forms an admin would and reads the HTML pages back, so the server needs no changes.' })
                .box(0.4, 4.6, 0, 3.4, 2, 1, { left: 'BACKGROUND', top: 'SERVICE WORKER', note: 'Background service worker|Stores the tracker cache, reads and writes XLSX, appends to the audit log one write at a time, and shows desktop notifications.' })
                .cylinder(6.9, 5.4, 0, 0.95, 1.15, { top: 'INDEXEDDB', bands: 2, note: 'Tracker cache · IndexedDB|A copy of the submission list per AWS address and contest. The first sync of 2,000 submissions takes about 15 s; later syncs usually need one request.' });
            [0, 0.16, 0.32].forEach((z) => s.box(8.6, 6.1, z, 1.3, 1.3, 0.1, { note: 'Audit log|Every change the extension makes in CMS, with time, targets and result. Exportable as CSV.' }));

            s.label(-3.3, 0.1, 0.28, -4, -30, 'EXCEL · SHEETS · CSV')
                .label(13.9, 0, 2.7, 14, -14, 'NO SERVER CHANGES')
                .label(8.4, 0.1, 0.95, 10, -36, 'FORMS OUT · HTML PAGES BACK')
                .label(7.85, 5.4, 0.55, 40, 8, 'TRACKER CACHE')
                .label(9.9, 6.1, 0.42, 14, 6, 'AUDIT LOG')
                .label(13.9, 2.2, 0, 14, 16, 'MEDIAN 171 MS UNDER LOAD', 'is-key');
            return s.svg('CMS Admin Helper architecture: rows from Excel, Sheets or CSV go into the Helper panel on the AWS tab. Every request passes one queue, at most 2 at once and 4 per second, to the CMS v1.5 AdminWebServer, which is not changed; the HTML pages that come back are parsed in the browser. A background service worker keeps the tracker cache in IndexedDB and the audit log.', 16 / 9);
        },

        // Aihack 2026 notes: four pretrained tabular models on the raw
        // application columns, rank-averaged into a probability of default.
        credit() {
            const s = Scene();
            const names = ['TABPFN-3.5', 'KUMO', 'LIMIX-2', 'DAE NN'];
            const lane = (i) => 0.85 + i * 3.1; // centre line of model i
            const modelNotes = [
                'TabPFN-3.5|A pretrained tabular foundation model, and the strongest single model: private AUC 0.6611.',
                'NVIDIA Kumo Tabular|Adding it to TabPFN-3.5 lifted the private AUC to 0.6620.',
                'LimiX-2|Built by teammate Kongpop Ariyapattanaporn. Adding it lifted the ensemble to 0.6628.',
                'Denoising autoencoder|A small neural network, the fourth member of the ensemble.',
            ];
            s.plate(-0.6, -0.6, 16.4, 12.2, 'PRIVATE COLAB SESSION · A100 / L4', 9.6);

            names.forEach((_, i) => {
                s.pipe([[1.8, lane(i)], [4, lane(i)]], { packets: [i * 0.3] })
                    .pipe([[6.6, lane(i)], [8.2, lane(i)], [8.2, 5.5], [9.2, 5.5]], { packets: [1.3 + i * 0.25] });
            });
            s.pipe([[12.2, 5.5], [13.2, 5.5]], { packets: [2.7] });

            s.box(0, 0, 0, 1.8, 11.8, 0.35, { lines: () => s.grid(0, 0, 0.35, 1.8, 11.8, 12, 3), note: 'Application data|Only what is known at application time, fed to the models as raw columns. The question: will this applicant default within 12 months?' });
            names.forEach((name, i) => {
                s.box(4, lane(i) - 0.65, 0, 2.6, 1.3, 0.9, { left: name, cls: i === 0 ? 'is-signal' : '', hot: 0.9 + i * 0.25, note: modelNotes[i] });
            });
            s.box(9.2, 4.7, 0, 3, 1.6, 0.85, { left: 'RANK AVG', cls: 'is-brass', note: "Rank average|The four models' predictions are turned into ranks and averaged. About 30 weight variants all scored within 0.001 AUC of each other." })
                .box(13.2, 4.8, 0, 2.4, 1.4, 1.25, { left: 'P(DEFAULT)', hot: 3, note: 'P(default)|The probability that the applicant defaults within 12 months. Private ROC-AUC 0.6628: 14th of 103 teams.' });

            s.label(0.9, 0, 0.35, -8, -22, 'APPLICATION DATA · RAW COLUMNS')
                .label(6.6, 0.2, 0.9, 14, -24, 'BEST SINGLE · AUC 0.6611')
                .label(5.3, 10.8, 0, 10, 28, 'SMALL DENOISING AUTOENCODER')
                .label(14.4, 4.8, 1.25, 12, -22, 'DEFAULT WITHIN 12 MONTHS')
                .label(15.6, 6.2, 0, 14, 16, 'ROC-AUC 0.6628 · 14TH / 103', 'is-key');
            return s.svg('Credit default model: raw application columns feed four models (TabPFN-3.5, NVIDIA Kumo Tabular, LimiX-2 and a small denoising autoencoder) in a private Colab session; their predictions are rank-averaged into the probability of default within 12 months. Private ROC-AUC 0.6628, 14th of 103.', 16 / 9);
        },

        // MiyaZaki1072/TaskMaker: problem.yaml checked by config/schema.ts,
        // rendered through templates/render.hbs; Chromium prints that same
        // page to PDF. Two containers, Postgres with no published port.
        taskmaker() {
            const s = Scene();
            s.plate(4.9, -0.6, 9.7, 8.4, 'HOME SERVER · DOCKER · POSTGRES HAS NO PORT');

            s.pipe([[1.1, 1], [8, 1]], { packets: [0, 1.3] })
                .pipe([[8, 1.6], [1.1, 1.6]], { cls: 'is-back', packets: [2.2] })
                .pipe([[10.6, 1], [15, 1]], { packets: [2, 3.2] })
                .pipe([[2.8, 6.2], [8.6, 6.2], [8.6, 2]], { packets: [0.8] })
                .pipe([[10.2, 2], [10.2, 5]], { cls: 'is-back', packets: [1.6] })
                .pipe([[13, 2], [13, 5.8], [15, 5.8]], { packets: [3] });

            s.box(0, 0.9, 0, 2.3, 0.22, 1.7, { left: 'EDITOR', lines: windowBar, note: 'Studio editor|Problem source on the left, the rendered problem updating live on the right. Edit, preview and validate in one dashboard, with no build step and no page reloads.' });
            [0, 0.12, 0.24].forEach((z, i) => s.box(3.2, 0.4, z, 1.6, 1.3, 0.1, {
                top: i === 2 ? 'PROBLEM.YAML' : '', hot: i === 2 ? 0.6 : null,
                note: "problem.yaml|One plain-text file per problem in a fixed structure, with its diagrams in the problem's assets/ folder. Whole problem sets move between installations as ZIP files.",
            }));
            s.box(5.6, 0.2, 0, 1.4, 1.6, 1, { left: 'ZOD', top: 'SCHEMA', cls: 'is-brass', hot: 1.2, note: 'Schema · zod|config/schema.ts is the contract: a file that passes it is guaranteed to render. Its error messages are plain English, since most authors are not programmers.' })
                .box(8, 0, 0, 2.6, 2, 1.6, { left: 'STUDIO', top: 'RENDER.HBS', cls: 'is-signal', hot: 1.8, note: 'Studio · Node + TypeScript|Renders every problem through one Handlebars template with KaTeX maths. TH Sarabun New and JetBrains Mono ship with the repo: no CDN, no network at render time.' })
                .box(11.6, 0, 0, 2.7, 2, 1.4, { left: 'CHROMIUM', top: 'PUPPETEER', lines: rack(3), hot: 2.4, note: 'Chromium · Puppeteer|Opens the same page the preview shows, waits until fonts, images and maths have finished rendering, then prints it to PDF. So the preview and the PDF cannot drift apart.' });
            [0, 0.12, 0.24, 0.36].forEach((z) => s.box(15, 0.4, z, 1.4, 1.2, 0.1, { hot: 3, note: 'PDF and booklet|One A4 PDF per problem, or every problem combined into one booklet with a cover page and a table of contents, for printing at the exam venue.' }));

            s.box(0.6, 5.4, 0, 2.2, 1.6, 0.28, { lines: () => s.grid(0.6, 5.4, 0.28, 2.2, 1.6, 5, 4), note: 'CMS ranking|The ranking file the CMS admin downloads, as txt or csv. Nothing is stored: the scoreboard is rebuilt from the uploaded text on every request.' })
                .cylinder(10.6, 5.8, 0, 1, 1.4, { top: 'POSTGRES', note: 'PostgreSQL 16|The one piece of durable state: problems, images and the session secret. No published port; only the studio container reaches it, on a private Docker network.' })
                .box(15, 4.6, 0, 1.8, 2.4, 0.14, { lines: () => s.grid(15, 4.6, 0.14, 1.8, 2.4, 4, 1), hot: 3.3, note: 'Scoreboard|Rows sorted by total and coloured by medal. Chromium cannot capture a very tall page in one shot, so it is captured in strips and joined into one PNG.' });

            s.label(1.1, 0.9, 1.7, -6, -30, 'WRITE · LIVE PREVIEW')
                .label(4, 0.4, 0.34, 4, -40, 'ONE PROBLEM.YAML PER TASK')
                .label(16.4, 0.4, 0.46, 10, -24, 'PDF · BOOKLET WITH COVER + TOC')
                .label(1.7, 7, 0, -10, 24, 'CMS RANKING · TXT / CSV')
                .label(16.8, 7, 0, 10, 14, 'SCOREBOARD PNG · MEDAL COLOURS')
                .label(9.6, 0, 1.6, 26, -46, 'ONE TEMPLATE · PREVIEW = PRINT', 'is-key');
            return s.svg('TaskMaker architecture: an author writes problem.yaml in the browser editor; the zod schema checks it and the studio renders it through one Handlebars template with KaTeX and Thai fonts, sending the live preview back. Chromium, through Puppeteer, prints that same page to PDFs and a booklet. A CMS ranking file becomes a medal-coloured scoreboard PNG. Studio and Postgres run as two Docker containers on a home server; Postgres has no published port.', 16 / 9);
        },
    };

    // ── Boot card: a filing cabinet drops in, its top drawer opens ──
    function bootCabinet() {
        const W = 3.2, D = 2.4, ROW = 1.1, PULL = 1.2; // PULL matches @keyframes iso-open
        // A handle across the middle of a front face, between two heights.
        const handleAt = (face, lo, hi) => {
            const m = lerp(lerp(face[0], face[1], 0.5), lerp(face[3], face[2], 0.5), (lo + hi) / 2);
            return line([m[0] - 9, m[1] - 5.2], [m[0] + 9, m[1] + 5.2], 'f-handle');
        };
        const shellLines = ({ left }) =>
            faceRules(left, 3) + handleAt(left, 0, 1 / 3) + handleAt(left, 1 / 3, 2 / 3);

        // One scene sizes the viewBox: the cabinet with the drawer pulled out.
        const sizing = Scene();
        sizing.box(0, 0, 0, W, D + PULL, ROW * 3);
        sizing.box(0.5, 1.0 + PULL, ROW * 3, 2.2, 0.12, 1.0);
        sizing.label(2.7, 1.0 + PULL, ROW * 3 + 1.0, 22, -4, 'FILE · FREYR');

        const part = (draw) => { const t = Scene(); draw(t); return t.layers(); };
        const shell = part((t) => t.box(0, 0, 0, W, D, ROW * 3, { lines: shellLines }));
        const drawer = part((t) => t
            .box(0.08, 0.3, ROW * 2 + 0.06, W - 0.16, D - 0.3, ROW - 0.06, {
                cls: 'is-signal',
                lines: ({ left }) => handleAt(left, 0, 1),
            }));
        const folder = part((t) => t.box(0.5, 1.0, ROW * 3, 2.2, 0.12, 1.0, { cls: 'is-brass' }));
        const note = part((t) => t.label(2.7, 1.0 + PULL, ROW * 3 + 1.0, 22, -4, 'FILE · FREYR', 'is-key'));
        return `<svg class="iso iso-boot" viewBox="${sizing.viewBox()}" aria-hidden="true">` +
            `<g class="boot-drop">${shell.solids}<g class="boot-open">` +
            `${drawer.solids}<g class="boot-folder">${folder.solids}</g></g></g>` +
            `<g class="boot-note">${note.notes}</g></svg>`;
    }

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Full-screen viewer: drag to pan, wheel or pinch to zoom, ─
    //    hover or tap a part to read what it does.
    const viewer = (() => {
        const MIN_ZOOM = 0.6; // fraction of the fitted view (zoomed out)
        const MAX_ZOOM = 6; // times the fitted view (zoomed in)
        const HINT_TITLE = 'Explore';
        const HINT_TEXT = 'Hover or tap a part to see what it does. Drag to move, scroll or pinch to zoom.';
        let root, stage, noteTitle, noteText, closeBtn;
        let svg = null, base = null, vb = null, lastFocus = null, picked = null;
        const pointers = new Map();
        let pinchDist = 0, moved = 0;

        function build() {
            root = document.createElement('div');
            root.className = 'iso-viewer';
            root.hidden = true;
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            root.setAttribute('aria-labelledby', 'isoViewerTitle');
            root.innerHTML =
                '<div class="iso-viewer-bar">' +
                '<p class="iso-viewer-title" id="isoViewerTitle"></p>' +
                '<p class="iso-viewer-hint">DRAG TO MOVE · SCROLL OR PINCH TO ZOOM</p>' +
                '<div class="iso-viewer-tools">' +
                '<button type="button" data-act="out" aria-label="Zoom out">−</button>' +
                '<button type="button" data-act="in" aria-label="Zoom in">+</button>' +
                '<button type="button" data-act="fit">FIT</button>' +
                '<button type="button" data-act="close" aria-label="Close diagram">✕</button>' +
                '</div></div>' +
                '<div class="iso-viewer-stage"></div>' +
                '<div class="iso-viewer-note" aria-live="polite"><strong></strong><span></span></div>';
            document.body.appendChild(root);
            stage = root.querySelector('.iso-viewer-stage');
            noteTitle = root.querySelector('.iso-viewer-note strong');
            noteText = root.querySelector('.iso-viewer-note span');
            closeBtn = root.querySelector('[data-act="close"]');

            root.querySelector('.iso-viewer-tools').addEventListener('click', (e) => {
                const act = e.target.closest('button')?.dataset.act;
                if (act === 'close') close();
                if (act === 'fit') fit();
                if (act === 'in') zoomAtCentre(1.4);
                if (act === 'out') zoomAtCentre(1 / 1.4);
            });
            stage.addEventListener('wheel', onWheel, { passive: false });
            stage.addEventListener('pointerdown', onDown);
            stage.addEventListener('pointermove', onMove);
            stage.addEventListener('pointerup', onUp);
            stage.addEventListener('pointercancel', onUp);
            stage.addEventListener('pointerover', (e) => {
                if (e.pointerType === 'mouse' && !pointers.size) pick(e.target.closest('[data-note]'));
            });
            stage.addEventListener('focusin', (e) => pick(e.target.closest('[data-note]')));
            // On the document, not the dialog: after a click on the drawing,
            // focus is no longer inside the dialog but Esc must still close it.
            document.addEventListener('keydown', (e) => {
                if (!root.hidden) onKey(e);
            });
        }

        function apply() {
            svg.setAttribute('viewBox', [vb.x, vb.y, vb.w, vb.h].map((n) => n.toFixed(2)).join(' '));
        }

        function fit() {
            vb = { ...base };
            apply();
        }

        // Screen point to drawing units, through the current viewBox.
        function toSvg(cx, cy) {
            const pt = svg.createSVGPoint();
            pt.x = cx; pt.y = cy;
            return pt.matrixTransform(svg.getScreenCTM().inverse());
        }

        function zoomAt(cx, cy, factor) {
            const p = toSvg(cx, cy);
            const w = Math.min(Math.max(vb.w / factor, base.w / MAX_ZOOM), base.w / MIN_ZOOM);
            const k = w / vb.w;
            vb = { x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w, h: vb.h * k };
            apply();
        }

        function zoomAtCentre(factor) {
            const r = stage.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
        }

        // Drawing units per screen pixel (the viewBox is fitted with "meet").
        function unitsPerPx() {
            const r = stage.getBoundingClientRect();
            return Math.max(vb.w / r.width, vb.h / r.height);
        }

        function panBy(dx, dy) {
            const u = unitsPerPx();
            vb.x -= dx * u;
            vb.y -= dy * u;
            apply();
        }

        function onWheel(e) {
            e.preventDefault();
            zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
        }

        function onDown(e) {
            try { stage.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            moved = 0;
            if (pointers.size === 2) pinchDist = spread();
            stage.classList.add('is-dragging');
        }

        function spread() {
            const [a, b] = [...pointers.values()];
            return Math.hypot(a.x - b.x, a.y - b.y);
        }

        function onMove(e) {
            const prev = pointers.get(e.pointerId);
            if (!prev) return;
            const now = { x: e.clientX, y: e.clientY };
            if (pointers.size === 1) {
                panBy(now.x - prev.x, now.y - prev.y);
                moved += Math.abs(now.x - prev.x) + Math.abs(now.y - prev.y);
                pointers.set(e.pointerId, now);
                return;
            }
            pointers.set(e.pointerId, now);
            const [a, b] = [...pointers.values()];
            const d = spread();
            if (pinchDist) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinchDist);
            pinchDist = d;
            moved = Infinity;
        }

        function onUp(e) {
            if (!pointers.has(e.pointerId)) return;
            pointers.delete(e.pointerId);
            if (pointers.size < 2) pinchDist = 0;
            if (!pointers.size) {
                stage.classList.remove('is-dragging');
                // A tap (no real drag) picks the part under it.
                if (moved < 6) pick(document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-note]'));
            }
        }

        function pick(part) {
            if (part && part === picked) return;
            picked?.classList.remove('is-picked');
            picked = part && stage.contains(part) ? part : null;
            picked?.classList.add('is-picked');
            noteTitle.textContent = picked ? picked.dataset.note : HINT_TITLE;
            noteText.textContent = picked ? picked.dataset.noteText : HINT_TEXT;
        }

        function onKey(e) {
            const step = 40;
            const keys = {
                Escape: close,
                '+': () => zoomAtCentre(1.25),
                '=': () => zoomAtCentre(1.25),
                '-': () => zoomAtCentre(0.8),
                '0': fit,
                ArrowLeft: () => panBy(step, 0),
                ArrowRight: () => panBy(-step, 0),
                ArrowUp: () => panBy(0, step),
                ArrowDown: () => panBy(0, -step),
            };
            if (keys[e.key] && !(e.key.startsWith('Arrow') && e.target.closest('button'))) {
                e.preventDefault();
                keys[e.key]();
                return;
            }
            if (e.key === 'Tab') {
                // Keep focus inside the dialog.
                const items = [...root.querySelectorAll('button, [tabindex="0"]')];
                const i = items.indexOf(document.activeElement);
                const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
                e.preventDefault();
                items[next].focus();
            }
        }

        function open(markup, title) {
            if (!root) build();
            lastFocus = document.activeElement;
            stage.innerHTML = markup;
            svg = stage.querySelector('svg');
            const [x, y, w, h] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
            base = { x, y, w, h };
            svg.querySelectorAll('[data-note]').forEach((part) => {
                part.setAttribute('tabindex', '0');
                part.setAttribute('aria-label', part.dataset.note);
            });
            root.querySelector('.iso-viewer-title').textContent = title;
            picked = null;
            pick(null);
            root.hidden = false;
            document.body.style.overflow = 'hidden';
            fit();
            if (reduced && svg.pauseAnimations) { svg.pauseAnimations(); svg.setCurrentTime(3.6); }
            closeBtn.focus();
        }

        function close() {
            if (!root || root.hidden) return;
            root.hidden = true;
            stage.innerHTML = '';
            svg = null;
            pointers.clear();
            document.body.style.overflow = '';
            lastFocus?.focus();
        }

        return { open };
    })();

    // ── Mount ───────────────────────────────────────────────────
    const boot = document.getElementById('bootIso');
    if (boot) boot.innerHTML = bootCabinet();

    const live = [];
    document.querySelectorAll('.exhibit-media[data-iso]').forEach((media) => {
        const draw = scenes[media.dataset.iso];
        if (!draw) return;
        media.insertAdjacentHTML('afterbegin', draw());
        media.classList.add('has-iso');
        const label = media.querySelector('.exhibit-label');
        if (label) label.textContent = 'ARCHITECTURE · CLICK TO EXPLORE';

        // The screenshot keeps its own button (main.js opens it in the lightbox).
        if (media.querySelector('img[data-lightbox]')) {
            media.insertAdjacentHTML('beforeend', '<button type="button" class="exhibit-shot">SCREENSHOT ↗</button>');
        }
        const name = media.closest('.project-card')?.querySelector('.project-name')?.textContent.trim() || 'Project';
        media.setAttribute('role', 'button');
        media.setAttribute('tabindex', '0');
        media.setAttribute('aria-label', `Explore the ${name} architecture diagram`);
        const explore = () => viewer.open(draw(), `${name} · architecture`);
        media.addEventListener('click', (e) => {
            if (!e.target.closest('.exhibit-shot')) explore();
        });
        media.addEventListener('keydown', (e) => {
            if (e.target === media && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                explore();
            }
        });

        const svg = media.querySelector('svg.iso');
        if (!svg || typeof svg.pauseAnimations !== 'function') return;
        svg.pauseAnimations();
        if (reduced) {
            svg.setCurrentTime(3.6); // the frame where every part is lit
            return;
        }
        live.push({ svg, card: media.closest('.project-card'), seen: false, running: false });
    });

    if (!live.length) return;

    // Run a diagram only while its card is the one on stage and on screen;
    // replay it from the start each time it comes back on stage.
    function sync() {
        live.forEach((m) => {
            const onStage = !m.card || getComputedStyle(m.card).visibility !== 'hidden';
            const run = m.seen && onStage;
            if (run && !m.running) { m.svg.setCurrentTime(0); m.svg.unpauseAnimations(); }
            if (!run && m.running) m.svg.pauseAnimations();
            m.running = run;
        });
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            const m = live.find((x) => x.svg === e.target);
            if (m) m.seen = e.isIntersecting;
        });
        sync();
    }, { threshold: 0.2 });
    live.forEach((m) => io.observe(m.svg));

    const mo = new MutationObserver(() => requestAnimationFrame(sync));
    live.forEach((m) => m.card && mo.observe(m.card, { attributes: true, attributeFilter: ['class'] }));
})();
