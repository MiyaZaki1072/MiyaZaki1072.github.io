//Grove tree generator ---------------------------------------------------------
//
//Writes the two tree drawings for the opening scene into index.html, between
//the <!-- grove:art:start --> and <!-- grove:art:end --> markers, and stamps
//each content slot (.grove-bio, .grove-slot) with its position and its reveal
//window. Run it after changing anything below:
//
//    node scripts/grove-svg.mjs
//
//The output is plain markup, so the site still has no build step: this only
//has to run when the tree's shape changes, never to serve the page.
//
//Everything is seeded, so the same input always writes the same tree. Every
//growable path carries data-grow-start / data-grow-end, a window on the 0–1
//scroll progress that js/grove.js turns into one scrubbed timeline. A child
//path starts on an exact point of its parent's curve, and its window opens only
//once the parent has been drawn to that point, so nothing grows out of thin air.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'index.html');

//mulberry32: small, fast and deterministic, which is all a twig needs.
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const r1 = n => Math.round(n * 10) / 10;
const r3 = n => Math.round(n * 1000) / 1000;

//--- curves ------------------------------------------------------------------

//One quadratic segment from p0 to p1, bowed sideways by `bend` × its length.
function quad(p0, p1, bend) {
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy);
    const c = [(p0[0] + p1[0]) / 2 - dy * bend, (p0[1] + p1[1]) / 2 + dx * bend];
    return { p0, c, p1, len };
}
function pointAt(q, t) {
    const u = 1 - t;
    return [
        u * u * q.p0[0] + 2 * u * t * q.c[0] + t * t * q.p1[0],
        u * u * q.p0[1] + 2 * u * t * q.c[1] + t * t * q.p1[1],
    ];
}
function angleAt(q, t) {
    const dx = 2 * (1 - t) * (q.c[0] - q.p0[0]) + 2 * t * (q.p1[0] - q.c[0]);
    const dy = 2 * (1 - t) * (q.c[1] - q.p0[1]) + 2 * t * (q.p1[1] - q.c[1]);
    return Math.atan2(dy, dx);
}
const dOf = q => `M${r1(q.p0[0])} ${r1(q.p0[1])}Q${r1(q.c[0])} ${r1(q.c[1])} ${r1(q.p1[0])} ${r1(q.p1[1])}`;

//--- one composition ---------------------------------------------------------

function compose(spec) {
    const rand = rng(spec.seed);
    const between = (a, b) => a + (b - a) * rand();
    const paths = [];
    const leaves = [];

    //A segment remembers its window so children can open theirs on it.
    function segment(cls, p0, p1, bend, width, start, end) {
        const q = quad(p0, p1, bend);
        q.start = start;
        q.end = end;
        paths.push({ cls, q, width });
        return q;
    }
    //Time at which a parent has been drawn out to t. The dash grows by arc
    //length, not by t, so a little slack keeps a child from leading its joint.
    const timeAt = (q, t) => q.start + t * (q.end - q.start) + 0.008;

    //A limb: several segments through gently jittered points, the width
    //tapering from w0 to w1 and the window shared out evenly.
    function limb(cls, from, to, { segs = 2, bend = 0.12, jitter = 0.06, w0, w1, start, end }) {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const len = Math.hypot(dx, dy);
        const pts = [from];
        for (let i = 1; i < segs; i++) {
            const t = i / segs;
            const off = (rand() - 0.5) * 2 * jitter * len;
            pts.push([from[0] + dx * t - (dy / len) * off, from[1] + dy * t + (dx / len) * off]);
        }
        pts.push(to);
        const out = [];
        const span = (end - start) / segs;
        for (let i = 0; i < segs; i++) {
            const w = w0 + (w1 - w0) * ((i + 0.5) / segs);
            const sign = i % 2 ? -1 : 1;
            out.push(segment(cls, pts[i], pts[i + 1], bend * sign, w, start + i * span, start + (i + 1) * span));
        }
        return out;
    }

    function leaf(q, t, side, sizeScale, latest) {
        const p = pointAt(q, t);
        const a = angleAt(q, t) * 180 / Math.PI + side * between(28, 55);
        const start = Math.min(timeAt(q, t), latest - 0.05);
        leaves.push({
            x: p[0], y: p[1], a, s: sizeScale * between(0.75, 1.25),
            tone: rand() < 0.5 ? 'a' : 'b',
            start, end: Math.min(start + 0.05, latest),
        });
    }

    const inside = (p, box) => p[0] > box[0] && p[0] < box[2] && p[1] > box[1] && p[1] < box[3];
    const blocked = p => p[0] < 16 || p[0] > spec.w - 16 || p[1] < 24 ||
        spec.keepClear.some(box => inside(p, box));

    //Twigs off a limb's segments: upward, alternating sides, a leaf or two each.
    function twigs(seg, count, { len, w, latest }) {
        for (let i = 0; i < count; i++) {
            const t = between(0.3, 0.9);
            const base = pointAt(seg, t);
            const side = i % 2 ? 1 : -1;
            let a = angleAt(seg, t) + side * between(0.45, 0.9);
            //Twigs reach for the light: anything heading downward is mirrored up.
            if (Math.sin(a) > 0.15) a = -a;
            const l = between(len * 0.6, len);
            const tip = [base[0] + Math.cos(a) * l, base[1] + Math.sin(a) * l];
            if (blocked(tip)) continue;
            const start = timeAt(seg, t);
            if (start > latest - 0.08) continue;
            const end = Math.min(start + between(0.06, 0.1), latest - 0.04);
            const twig = segment('grove-twig', base, tip, between(-0.22, 0.22), w, start, end);
            leaf(twig, 1, side, 1, spec.leavesBy);
            if (rand() < 0.75) leaf(twig, between(0.45, 0.7), -side, 0.85, spec.leavesBy);
            if (rand() < 0.4) leaf(twig, between(0.25, 0.4), side, 0.7, spec.leavesBy);
        }
    }

    //1. The faint roots that are there from the first frame. No window: these
    //are drawn by the stylesheet alone and never animate.
    const hints = spec.hints.map(([to, bend]) => quad(spec.base, to, bend));

    //2. Veins hugging the lettering, and the two shoots at either end of it.
    spec.veins.forEach(([from, to, bend, start, end]) => segment('grove-vein', from, to, bend, 1.4, start, end));
    spec.shoots.forEach(([from, to, bend, start, end]) => {
        const s = segment('grove-shoot', from, to, bend, 2.2, start, end);
        leaf(s, 1, bend > 0 ? 1 : -1, 0.9, 0.4);
        leaf(s, 0.6, bend > 0 ? -1 : 1, 0.75, 0.4);
    });

    //3. Roots, and a finer root off the outer half of each.
    spec.roots.forEach(([to, opts]) => {
        const segs = limb('grove-root', spec.base, to, { segs: 2, ...opts });
        const s = segs[1];
        const t = between(0.25, 0.5);
        const p = pointAt(s, t);
        const a = angleAt(s, t) + (to[0] < spec.base[0] ? -1 : 1) * between(0.35, 0.6);
        const l = s.len * between(0.5, 0.8);
        const tip = [p[0] + Math.cos(a) * l, Math.min(p[1] + Math.sin(a) * l, spec.h - 8)];
        const start = timeAt(s, t);
        segment('grove-root', p, tip, between(-0.15, 0.15), Math.max(1.2, opts.w1), start, Math.min(start + 0.08, 0.58));
    });

    //4. The trunk, segment by segment, so every junction is an exact endpoint.
    const trunk = [];
    let from = spec.base;
    spec.trunk.forEach(([to, width, start, end], i) => {
        trunk.push(segment('grove-trunk', from, to, i % 2 ? -0.03 : 0.03, width, start, end));
        from = to;
    });

    //5. Main branches out to each content slot, then the crown, then twigs.
    const mains = [];
    const limbs = [];
    [...spec.branches, ...spec.crown].forEach(([j, to, opts]) => {
        const at = trunk[j].end;
        const segs = limb('grove-branch', trunk[j].p1, to, { start: at, end: at + spec.branchDur, ...opts });
        limbs.push(segs);
        mains.push(...segs);
    });

    //6. Plaques hang from a branch that runs over them: a vine drops from the
    //point on the branch straight above each of the plaque's two ties, with a
    //pair of leaves where it is tied on. A vine starts no earlier than the
    //branch reaches that point, and is down just before its plaque shows.
    (spec.hangs || []).forEach(([branch, xs, topY]) => {
        xs.forEach((x, k) => {
            let best = null;
            limbs[branch].forEach(seg => {
                for (let i = 0; i <= 200; i++) {
                    const p = pointAt(seg, i / 200);
                    const d = Math.abs(p[0] - x);
                    if (!best || d < best.d) best = { d, seg, t: i / 200, p };
                }
            });
            const start = Math.max(timeAt(best.seg, best.t), 0.78);
            segment('grove-cord', best.p, [x, topY], k % 2 ? -0.06 : 0.06, 1.8, start, 0.84);
            leaf(best.seg, best.t, 1, 0.85, spec.leavesBy);
            leaf(best.seg, best.t, -1, 0.7, spec.leavesBy);
        });
    });
    mains.forEach(seg => twigs(seg, spec.twigsPerSeg, spec.twig));
    //The top of the trunk sprouts too, so the crown is not a bare pole.
    twigs(trunk[trunk.length - 1], spec.twigsPerSeg + 1, spec.twig);

    //Every branch tip has to be drawn before the card that hangs on it shows.
    const lastWood = Math.max(...paths.filter(p => p.cls === 'grove-branch').map(p => p.q.end));
    const firstCard = Math.min(...Object.values(SLOT_WINDOWS).map(w => w.start));
    if (lastWood >= firstCard) throw new Error(`branches finish at ${r3(lastWood)}, after the first card at ${firstCard}`);

    return { hints, paths, leaves };
}

//--- markup --------------------------------------------------------------------

function svgOf(name, spec, art) {
    const lines = [];
    lines.push(`<svg class="grove-art grove-art--${name}" viewBox="0 0 ${spec.w} ${spec.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">`);
    lines.push('    <g class="grove-hints">');
    art.hints.forEach(q => lines.push(`        <path d="${dOf(q)}"/>`));
    lines.push('    </g>');
    //Paint order: roots and veins first, then wood from thickest to finest.
    ['grove-root', 'grove-vein', 'grove-shoot', 'grove-trunk', 'grove-branch', 'grove-twig', 'grove-cord'].forEach(cls => {
        const group = art.paths.filter(p => p.cls === cls);
        if (!group.length) return;
        lines.push(`    <g class="${cls}s">`);
        group.forEach(({ q, width }) => lines.push(
            `        <path d="${dOf(q)}" stroke-width="${r1(width)}" data-grow-start="${r3(q.start)}" data-grow-end="${r3(q.end)}"/>`));
        lines.push('    </g>');
    });
    lines.push('    <g class="grove-leaves">');
    art.leaves.forEach(l => lines.push(
        `        <g transform="translate(${r1(l.x)} ${r1(l.y)}) rotate(${Math.round(l.a)}) scale(${r3(l.s * spec.leafSize)})"><use class="grove-leaf grove-leaf--${l.tone}" href="#grove-leaf-shape" data-grow-start="${r3(l.start)}" data-grow-end="${r3(l.end)}"/></g>`));
    lines.push('    </g>');
    lines.push('</svg>');
    return lines;
}

//--- the two compositions ------------------------------------------------------
//
//Coordinates are viewBox units. The HTML layers sit in a box with the same
//aspect ratio as the viewBox, so a slot at (x, y) here is at (x/w %, y/h %)
//there, and a link card always lands on its branch tip.

//When each content panel fades in. Shared by both drawings: the story's last
//beat is the same on a phone as on a desk.
const SLOT_WINDOWS = {
    bio:      { start: 0.85, end: 0.95 },
    email:    { start: 0.86, end: 0.94 },
    github:   { start: 0.875, end: 0.955 },
    linkedin: { start: 0.89, end: 0.97 },
    discord:  { start: 0.87, end: 0.95 },
    skills:   { start: 0.88, end: 0.96 },
};

//Wide: a broad canopy. The name sits low on the trunk, the bio and the tech
//stack hang off low branches either side, and the links ride the canopy tips.
const NAME_WIDE = [480, 540, 1120, 680];
const WIDE = {
    seed: 1072, w: 1600, h: 1000, leafSize: 1.15, leavesBy: 0.88, branchDur: 0.12,
    base: [800, 720],
    keepClear: [
        [NAME_WIDE[0] - 20, NAME_WIDE[1] - 30, NAME_WIDE[2] + 20, NAME_WIDE[3] + 20],
        [30, 415, 470, 1000],         //bio plaque
        [1130, 415, 1570, 1000],      //skills plaque
    ],
    slots: {
        //The two top cards sit low enough that the floating nav never covers
        //them, down to a 500px-tall window.
        //The plaques' top edges (style.css hangs them from there).
        bio:      [250, 418],
        email:    [290, 280],
        github:   [520, 165],
        linkedin: [1080, 165],
        discord:  [1310, 280],
        skills:   [1350, 418],
    },
    hints: [[[700, 860], 0.12], [[800, 900], 0.04], [[905, 850], -0.12]],
    veins: [
        [[NAME_WIDE[0] + 10, NAME_WIDE[1] + 30], [NAME_WIDE[0] + 230, NAME_WIDE[1] - 18], 0.18, 0.15, 0.26],
        [[NAME_WIDE[2] - 10, NAME_WIDE[1] + 30], [NAME_WIDE[2] - 230, NAME_WIDE[1] - 18], -0.18, 0.17, 0.28],
        [[NAME_WIDE[0] + 30, NAME_WIDE[3] + 6], [NAME_WIDE[0] + 260, NAME_WIDE[3] + 22], -0.12, 0.2, 0.31],
        [[NAME_WIDE[2] - 30, NAME_WIDE[3] + 6], [NAME_WIDE[2] - 260, NAME_WIDE[3] + 22], 0.12, 0.22, 0.33],
    ],
    shoots: [
        [[NAME_WIDE[0] - 6, NAME_WIDE[3]], [NAME_WIDE[0] - 70, NAME_WIDE[1] - 10], 0.2, 0.18, 0.32],
        [[NAME_WIDE[2] + 6, NAME_WIDE[3]], [NAME_WIDE[2] + 70, NAME_WIDE[1] - 10], -0.2, 0.2, 0.34],
    ],
    roots: [
        [[260, 940], { w0: 10, w1: 2.5, start: 0.3, end: 0.5, bend: 0.1 }],
        [[540, 990], { w0: 12, w1: 3, start: 0.31, end: 0.48 }],
        [[790, 995], { w0: 13, w1: 3, start: 0.3, end: 0.45, bend: 0.05 }],
        [[1070, 990], { w0: 12, w1: 3, start: 0.32, end: 0.49 }],
        [[1360, 930], { w0: 10, w1: 2.5, start: 0.31, end: 0.52, bend: -0.1 }],
    ],
    //[to, width, start, end]: junction j is the end of segment j.
    trunk: [
        [[796, 500], 22, 0.35, 0.42],
        [[806, 390], 16, 0.42, 0.47],
        [[800, 290], 12, 0.47, 0.52],
        [[796, 150], 8, 0.52, 0.58],
    ],
    //[junction, tip, options]. Each tip is the slot position above.
    branches: [
        //Out level over the plaques, past their far ties, from high enough on
        //the trunk that the vines they hang by are long enough to see.
        [1, [60, 350], { w0: 7, w1: 2.5, bend: 0.03 }],    //bio
        [1, [1540, 350], { w0: 7, w1: 2.5, bend: -0.03 }], //skills
        [1, [290, 280], { w0: 6, w1: 2.2 }],               //email
        [1, [1310, 280], { w0: 6, w1: 2.2, bend: -0.12 }], //discord
        [2, [520, 165], { w0: 6, w1: 2.2 }],               //github
        [2, [1080, 165], { w0: 6, w1: 2.2, bend: -0.12 }], //linkedin
    ],
    crown: [
        [3, [690, 70], { w0: 5, w1: 1.8 }],
        [3, [910, 70], { w0: 5, w1: 1.8, bend: -0.12 }],
    ],
    twigsPerSeg: 2,
    twig: { len: 120, w: 2, latest: 0.82 },
    //[branch index, the two ties' x, plaque top y]. Ties sit 30% of the
    //plaque's width (27% of 1600) either side of its centre.
    hangs: [
        [0, [120, 380], 418],
        [1, [1220, 1480], 418],
    ],
};

//Tall: a narrow tree for phones and portrait screens. The links sit two by
//two on the branches under the crown, the name rests on the trunk's base, and
//the bio and the tech stack fill the roots' ground.
const NAME_TALL = [110, 380, 490, 460];
const TALL = {
    seed: 2550, w: 600, h: 1100, leafSize: 0.95, leavesBy: 0.88, branchDur: 0.1,
    base: [300, 470],
    keepClear: [
        [NAME_TALL[0] - 10, NAME_TALL[1] - 20, NAME_TALL[2] + 10, NAME_TALL[3] + 20],
        [20, 480, 580, 1100],        //bio and skills panels
    ],
    slots: {
        email:    [140, 225],
        github:   [460, 225],
        linkedin: [140, 315],
        discord:  [460, 315],
        bio:      [300, 485],
        //The skills panel hangs from this point by its bottom edge (style.css),
        //clear of the bottom tab bar, so a long bio never pushes it off screen.
        skills:   [300, 995],
    },
    hints: [[[240, 550], 0.12], [[300, 570], 0.03], [[360, 545], -0.12]],
    veins: [
        [[NAME_TALL[0] + 6, NAME_TALL[1] + 22], [NAME_TALL[0] + 150, NAME_TALL[1] - 14], 0.18, 0.15, 0.26],
        [[NAME_TALL[2] - 6, NAME_TALL[1] + 22], [NAME_TALL[2] - 150, NAME_TALL[1] - 14], -0.18, 0.17, 0.28],
        [[NAME_TALL[0] + 20, NAME_TALL[3] + 6], [NAME_TALL[0] + 150, NAME_TALL[3] + 18], -0.12, 0.2, 0.31],
        [[NAME_TALL[2] - 20, NAME_TALL[3] + 6], [NAME_TALL[2] - 150, NAME_TALL[3] + 18], 0.12, 0.22, 0.33],
    ],
    shoots: [
        [[NAME_TALL[0] - 4, NAME_TALL[3]], [NAME_TALL[0] - 40, NAME_TALL[1] - 10], 0.2, 0.18, 0.32],
        [[NAME_TALL[2] + 4, NAME_TALL[3]], [NAME_TALL[2] + 40, NAME_TALL[1] - 10], -0.2, 0.2, 0.34],
    ],
    roots: [
        [[30, 700], { w0: 8, w1: 2, start: 0.3, end: 0.5, bend: 0.1 }],
        [[170, 900], { w0: 9, w1: 2.5, start: 0.31, end: 0.48 }],
        [[300, 1000], { w0: 10, w1: 2.5, start: 0.3, end: 0.46, bend: 0.04 }],
        [[430, 900], { w0: 9, w1: 2.5, start: 0.32, end: 0.49 }],
        [[570, 700], { w0: 8, w1: 2, start: 0.31, end: 0.52, bend: -0.1 }],
    ],
    trunk: [
        [[296, 345], 14, 0.35, 0.42],
        [[304, 250], 11, 0.42, 0.48],
        [[300, 160], 8, 0.48, 0.54],
        [[298, 60], 5, 0.54, 0.59],
    ],
    branches: [
        [0, [140, 315], { w0: 6, w1: 2.2 }],               //linkedin
        [0, [460, 315], { w0: 6, w1: 2.2, bend: -0.12 }],  //discord
        [1, [140, 225], { w0: 5, w1: 2 }],                 //email
        [1, [460, 225], { w0: 5, w1: 2, bend: -0.12 }],    //github
    ],
    crown: [
        [2, [185, 90], { w0: 4, w1: 1.6 }],
        [2, [415, 90], { w0: 4, w1: 1.6, bend: -0.12 }],
    ],
    twigsPerSeg: 1,
    twig: { len: 80, w: 1.6, latest: 0.82 },
};

//--- write ---------------------------------------------------------------------

const wide = compose(WIDE);
const tall = compose(TALL);

const art = [
    //One leaf for both drawings. No fill here: each <use> brings its own, so
    //one shape can come in two greens.
    '<svg class="grove-defs" width="0" height="0" aria-hidden="true" focusable="false">',
    '    <defs><path id="grove-leaf-shape" d="M0 0C5 -7 17 -9 26 0C17 9 5 7 0 0Z"/></defs>',
    '</svg>',
    ...svgOf('wide', WIDE, wide),
    ...svgOf('tall', TALL, tall),
];

let html = readFileSync(INDEX, 'utf8');
const START = '<!-- grove:art:start -->';
const END = '<!-- grove:art:end -->';
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a < 0 || b < a) throw new Error(`index.html is missing the ${START} … ${END} markers`);
const indent = html.slice(html.lastIndexOf('\n', a) + 1, a);
html = html.slice(0, a + START.length) + '\n' +
    art.map(line => indent + line).join('\n') + '\n' + indent + html.slice(b);

//Each slot: wide position as --x/--y, tall as --tx/--ty, in percent of the box.
//Only the three attributes this script owns are rewritten, right after
//data-slot; anything else on the tag (tabindex, say) is left alone.
for (const [key, win] of Object.entries(SLOT_WINDOWS)) {
    const [wx, wy] = WIDE.slots[key];
    const [tx, ty] = TALL.slots[key];
    const style = `--x:${r1(wx / WIDE.w * 100)};--y:${r1(wy / WIDE.h * 100)};--tx:${r1(tx / TALL.w * 100)};--ty:${r1(ty / TALL.h * 100)}`;
    const re = new RegExp(`data-slot="${key}"(?: style="[^"]*")?(?: data-grow-start="[^"]*")?(?: data-grow-end="[^"]*")?`);
    if (!re.test(html)) throw new Error(`index.html has no element with data-slot="${key}"`);
    html = html.replace(re, `data-slot="${key}" style="${style}" data-grow-start="${win.start}" data-grow-end="${win.end}"`);
}

writeFileSync(INDEX, html);

const count = x => `${x.paths.length} paths, ${x.leaves.length} leaves`;
console.log(`grove: wide ${count(wide)} · tall ${count(tall)}`);
