//Black hole backdrop ---------------------------------------------------------
//
//One character raster behind the whole page. Scroll is the camera: at the top
//the hole hangs small and high, off to one side of the hero card; by the footer
//it has drifted to centre and its horizon has swallowed the frame. Nothing here
//cuts — it is a single continuous move, the way the scroll-craft worldflight
//runs one camera across the whole track.
//
//Behind it is a field of fixed stars, lensed by the hole as the camera passes
//them: each one splits, brightens and throws a counter-image around the far
//side of the shadow when the drift brings it close. See the starfield block.
//
//The frame is built as one string and handed to one <pre>, so a frame costs a
//single text layout rather than tens of thousands of canvas glyph draws. Colour
//comes from a radial gradient clipped to that text, which is why the glyphs can
//run amber at the core and green at the rim without a second pass.

(function () {
    const layer = document.getElementById('blackhole');
    if (!layer) return;

    const world = layer.querySelector('.blackhole__world');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    //A lean needs something to lean away from. Touch has no hovering pointer,
    //so those readers keep the scroll camera exactly as it is.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

    //Ten levels, densest last. Index 0 is a space, so empty sky costs nothing
    //and the ramp stays a straight brightness scale.
    const RAMP = ' .:-=+*#%@';
    //The same ramp read backwards. The cursor ring composites over cells this
    //file has already written, so it has to be able to ask what is in one
    //before deciding whether it is brighter — and the ramp is ordered by
    //brightness, not by character code, so there is nothing to compare without
    //this. Built once: a 128-slot array beats a string scan per cell.
    const RAMP_LEVEL = (() => {
        const table = new Uint8Array(128);
        for (let i = 0; i < RAMP.length; i++) table[RAMP.charCodeAt(i)] = i;
        return table;
    })();
    const FRAME = 1000 / 30;

    //How far the pointer may push the hole, in the same units as the drift
    //below — where the opening offset is 1.45. Small on purpose: this is a
    //parallax lean on top of an authored camera move, not a second camera.
    const LEAN = 0.22;

    //The ring raised under the pointer over blank ground, in the same units.
    //RING_R is a little under a fifth of the shorter viewport edge; RING_W is
    //the Gaussian's width, and the thing that keeps it a line rather than a
    //disk. RING_V is deliberately high on the ramp: the glyph gradient is
    //centred on the hole, so a ring out on blank ground is coloured by the
    //gradient's outermost stop and has only that alpha to be seen through.
    const RING_R = 0.17;
    const RING_W = 0.022;
    const RING_V = 0.92;
    //Which elements count as blank ground. Everything a reader can actually use
    //is a descendant of one of these, so it is what elementFromPoint returns
    //instead and fails the test on its own — no maintenance as content is added
    //inside a section.
    const GROUND = 'body, .about-section, .projects-section, .background-section, .footer';

    //Cell geometry, rebuilt on resize. nx/ny hold each cell's position in
    //"units" (1 unit = half the shorter viewport edge) measured from the
    //viewport centre. The hole's own offset is subtracted per frame, so the
    //camera can drift without this being recomputed.
    let cols = 0, rows = 0, unitPx = 0;
    let cellW = 0, cellH = 0, viewW = 0, viewH = 0;
    let nx = null, ny = null, rowBuf = null, lines = null, sky = null;

    let raf = 0, last = 0, phase = 0;
    let pCur = 0, lastY = 0, spin = 0;
    let running = false, enabled = true;
    let glowX = -1, glowY = -1, glowR = -1;
    //Where the pointer asks the hole to be, and where it actually is. They are
    //separate so the hole trails the cursor instead of being welded to it — a
    //mass this size does not change direction the instant a mouse does.
    let leanTX = 0, leanTY = 0, leanX = 0, leanY = 0;

    //The cursor ring. Position in camera units, eased faster than the lean
    //above — this is attached to the cursor and should not feel heavy the way
    //a distant mass being dragged does. ringA is the amplitude the ring is
    //easing toward: 1 over blank ground, 0 anywhere else, so it fades rather
    //than cutting when the pointer crosses onto a card. clientX/Y are the raw
    //event coordinates, kept only so tick() can tell whether the pointer moved
    //since its last frame without re-deriving camera units to check.
    let ringTX = 0, ringTY = 0, ringX = 0, ringY = 0, ringA = 0;
    let pointerClientX = -1, pointerClientY = -1, pointerLive = false;
    let lastHitX = -1, lastHitY = -1, lastHitScrollY = -1, overBlank = false;

    //--- setup ---------------------------------------------------------------

    //Measured rather than assumed: which font actually wins depends on what
    //loaded, and a wrong advance width shears the whole raster into diagonals.
    function cellSize() {
        const probe = document.createElement('span');
        probe.textContent = '0'.repeat(100);
        probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
        world.appendChild(probe);
        const w = probe.getBoundingClientRect().width / 100;
        probe.remove();
        const cs = getComputedStyle(world);
        const h = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
        return { w: w > 0 ? w : 9, h: h > 0 ? h : 16 };
    }

    function layout() {
        const vw = layer.clientWidth;
        const vh = layer.clientHeight;
        if (!vw || !vh) return;

        const cell = cellSize();
        cols = Math.max(8, Math.ceil(vw / cell.w) + 1);
        rows = Math.max(6, Math.ceil(vh / cell.h) + 1);
        unitPx = Math.min(vw, vh) * 0.5;
        //Kept because the starfield works the other way round from this loop: it
        //holds positions and has to find their cells, rather than holding cells
        //and finding their positions.
        cellW = cell.w; cellH = cell.h;
        viewW = vw; viewH = vh;

        const n = cols * rows;
        nx = new Float32Array(n);
        ny = new Float32Array(n);
        sky = new Float32Array(n);
        rowBuf = new Uint16Array(cols);
        lines = new Array(rows);

        for (let y = 0; y < rows; y++) {
            const b = ((y + 0.5) * cell.h - vh / 2) / unitPx;
            const base = y * cols;
            for (let x = 0; x < cols; x++) {
                nx[base + x] = ((x + 0.5) * cell.w - vw / 2) / unitPx;
                ny[base + x] = b;
            }
        }
        glowX = glowY = glowR = -1;
        render();
    }

    function progress() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }

    //--- the starfield -------------------------------------------------------
    //
    //Sky behind the hole, and the only place its gravity is seen acting on
    //something other than its own disk. Each star is a point source behind a
    //point mass, which has a closed form: measure the star's true offset from
    //the hole as u, in units of the Einstein radius, and it splits into two
    //images — one outside that radius on the star's own side, one inside it on
    //the opposite side — magnified by
    //
    //    mu± = (u² + 2) / (2u √(u² + 4))  ±  ½
    //
    //So a star far from the hole keeps one image at mu ≈ 1 and a counter-image
    //far too faint to reach the ramp. One that drifts close brightens, throws a
    //second image around the far side, and the pair swings apart as the scroll
    //carries the hole past it. Nothing is animated here: the field is fixed in
    //the sky and the camera moves across it, so the lensing is a consequence of
    //the same scroll that drives everything else in this file.
    //
    //The Einstein radius is set to the photon ring rather than derived. It is
    //the radius the eye has already been told is where light bends, so arcs
    //forming there read as the hole doing it.
    const STAR_COUNT = 130;
    const starX = new Float32Array(STAR_COUNT);
    const starY = new Float32Array(STAR_COUNT);
    const starMag = new Float32Array(STAR_COUNT);
    (function seedStars() {
        //A fixed sequence rather than Math.random: a resize rebuilds every other
        //buffer in this file from scratch, and a sky that reshuffled when the
        //window changed shape would give the game away immediately.
        let seed = 0x9e3779b9;
        const next = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
        for (let j = 0; j < STAR_COUNT; j++) {
            //Wider than the tallest viewport is deep, so an ultra-wide screen
            //still reaches sky rather than running out of field at its edges.
            starX[j] = (next() * 2 - 1) * 3.0;
            starY[j] = (next() * 2 - 1) * 1.8;
            starMag[j] = 0.26 + next() * 0.34;
        }
    })();

    function stampSky(offX, offY, rE, rh, vig) {
        sky.fill(0);
        const halfW = viewW / 2;
        const halfH = viewH / 2;

        //Brightness competes for the cell rather than accumulating into it. Two
        //images landing on the same cell are still one point of light, and a
        //sum would put a hot spot exactly where the pair is about to merge.
        const place = (ux, uy, bright) => {
            const cx = Math.floor((ux * unitPx + halfW) / cellW);
            const cy = Math.floor((uy * unitPx + halfH) / cellH);
            if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
            const i = cy * cols + cx;
            if (bright > sky[i]) sky[i] = bright;
        };

        for (let j = 0; j < STAR_COUNT; j++) {
            const bx = starX[j] - offX;
            const by = starY[j] - offY;
            const b = Math.sqrt(bx * bx + by * by);
            //Lensing only ever pushes the primary image outward, so a star
            //already past the sky fade has no image that could survive it.
            if (b > vig) continue;

            const u = Math.max(1e-3, b / rE);
            const root = Math.sqrt(u * u + 4);
            const shared = (u * u + 2) / (2 * u * root);
            const dx = b > 1e-4 ? bx / b : 1;
            const dy = b > 1e-4 ? by / b : 0;

            //Capped, because the closed form runs to infinity at perfect
            //alignment and a ten-character ramp topped out long before that.
            const base = starMag[j];
            place(offX + dx * (b + rE * root) / 2, offY + dy * (b + rE * root) / 2,
                  base * Math.min(4, shared + 0.5));

            //The counter-image forms inside the Einstein radius, so on a close
            //enough pass it forms inside the shadow — where nothing comes out.
            const rM = (rE * root - b) / 2;
            if (rM > rh) {
                place(offX - dx * rM, offY - dy * rM, base * Math.min(4, shared - 0.5));
            }
        }
    }

    //--- the cursor ring -------------------------------------------------------
    //
    //Raised over blank ground under the pointer: the outer ring only, no filled
    //centre, so it reads as a second small gravity well rather than a spotlight.
    //
    //This composites over `lines` after the main loop has already written every
    //cell, rather than folding into that loop. Two reasons. First, the loop's
    //own vignette blanks a cell before anything else about it is decided, and
    //blank ground is mostly out past that line — a ring built into the loop
    //would be discarded exactly where it needs to show. Second, this only ever
    //touches a couple of dozen short rows around the cursor, against roughly
    //8,700 cells the main loop walks every frame regardless of where the
    //pointer is.
    function drawRing() {
        if (ringA < 0.02 || !unitPx) return;

        //Margin past the line itself for the Gaussian's tail, converted from
        //unit space to a cell span using cellW/cellH separately — the ring has
        //to stay round in real pixels, and the two can differ.
        const reach = RING_R + RING_W * 4;
        const centerCol = (ringX * unitPx + viewW / 2) / cellW;
        const centerRow = (ringY * unitPx + viewH / 2) / cellH;
        const colSpan = Math.ceil((reach * unitPx) / cellW);
        const rowSpan = Math.ceil((reach * unitPx) / cellH);

        const rowFrom = Math.max(0, Math.floor(centerRow - rowSpan));
        const rowTo = Math.min(rows - 1, Math.ceil(centerRow + rowSpan));
        const colFrom = Math.max(0, Math.floor(centerCol - colSpan));
        const colTo = Math.min(cols - 1, Math.ceil(centerCol + colSpan));

        for (let y = rowFrom; y <= rowTo; y++) {
            const base = y * cols;
            let chars = null; // split lazily: most rows in range end up untouched

            for (let x = colFrom; x <= colTo; x++) {
                const i = base + x;
                const ax = nx[i] - ringX;
                const ay = ny[i] - ringY;
                const r = Math.sqrt(ax * ax + ay * ay);
                const d = (r - RING_R) / RING_W;
                if (d < -4 || d > 4) continue;

                const v = RING_V * Math.exp(-d * d) * ringA;
                if (v <= 0) continue;
                const level = v >= 1 ? 9 : (v * 10) | 0;

                const existing = RAMP_LEVEL[lines[y].charCodeAt(x)];
                if (level <= existing) continue;

                if (!chars) chars = lines[y].split('');
                chars[x] = RAMP[level];
            }
            if (chars) lines[y] = chars.join('');
        }
    }

    //--- the frame -----------------------------------------------------------

    function render() {
        if (!cols) return;

        const p = pCur;
        const e = p * p * (3 - 2 * p);

        //Camera. `s` is closeness; every radius below is cut from it, so the
        //whole object scales as one thing and the disk never detaches from the
        //horizon it belongs to.
        const s = 0.42 + p * p * 1.50 + p * 0.45;
        const rh = s * 0.34;              // event horizon
        const rph = rh * 1.42;            // photon ring
        const rin = rh * 1.62;            // inner edge of the disk
        const rout = rh * 4.60;
        const span = rout - rin;
        const ringW = rh * 0.15;

        //The lensed halo. Light leaving the far side of the disk passes over the
        //top and under the bottom of the hole and bends back toward us, so the
        //far half does not disappear behind the shadow — it arrives wrapped
        //around it. This annulus is that second image, and it is the whole
        //difference between a band with a gap in it and the Gargantua
        //silhouette. Rays grazing closest to the shadow have swung furthest
        //around, so the disk's entire radial span piles up at the inner edge.
        const haloIn = rph;
        const haloOut = rph * 2.45;
        const haloSpan = haloOut - haloIn;

        //The tilt is just a vertical squash: un-squashing a cell's y puts it
        //back on the disk plane, and its orbital radius and azimuth fall out of
        //that directly. Flat and close to edge-on throughout — Gargantua is
        //viewed near the disk plane, not from above it.
        const kY = 0.12 + p * 0.20;

        //Drift. The hero card is opaque and owns the middle of the first
        //screen, so the hole starts out in the right margin — clear of both the
        //card and the navbar above it — and eases to dead centre by the footer.
        //Narrow viewports push it partly off the right edge, which is fine: a
        //hole entering frame reads better than one hidden behind a panel.
        //
        //The lean rides on top of that, and rides *against* the pointer: this
        //is parallax, the same camera the scroll drives, so moving your
        //viewpoint right has to shift a distant object left. Leaning into the
        //pointer instead would look like attraction, but it would drag the
        //bright core toward whatever is being read and — at the top of the
        //page — straight back over the hero card this offset exists to dodge.
        const offX = 1.45 * (1 - e) + leanX;
        const offY = -0.30 * (1 - e) + leanY;

        //Sky fade, measured from the hole rather than the viewport, so the
        //raster always dies out before it reaches the page's own text.
        const vig = 1.90 + p * 0.90;

        //Coming in close means the disk covers more of the frame, so it has to
        //give some brightness back — otherwise the footer reads through a full
        //screen of glyphs rather than past a distant one. The halo added below
        //covers more of the frame than the direct band alone did, so this
        //gives back more than before.
        const amp = 1 - 0.48 * p;

        //Shared disk shading — same falloff curve, same turbulence, same shear
        //rate — used for both the direct band and the lensed halo below, so the
        //two read as one spinning surface rather than as two unrelated layers
        //that happen to overlap.
        function diskRadial(R) {
            const u = (R - rin) / span;
            let radial = 1 - u;
            radial = radial * radial * radial;
            if (u < 0.06) radial *= u * 16.7;   // soften the inner lip
            return radial;
        }
        function diskBand(R, angle) {
            const u = (R - rin) / span;
            //Keplerian shear — inner orbits outrun outer ones. This is what
            //winds the striations into a spiral; a constant rate would turn
            //instead as one rigid spoked wheel.
            const q = rin / R;
            const a = angle + phase * q * Math.sqrt(q);
            return (0.58 + 0.42 * Math.sin(a * 3 + u * 13)) *
                   (0.74 + 0.26 * Math.sin(a * 7 - u * 5));
        }

        stampSky(offX, offY, rph, rh, vig);

        for (let y = 0; y < rows; y++) {
            const base = y * cols;
            for (let x = 0; x < cols; x++) {
                const i = base + x;
                const ax = nx[i] - offX;
                const ay = ny[i] - offY;
                const r = Math.sqrt(ax * ax + ay * ay);

                let fade = (vig - r) * 1.25;
                if (fade <= 0) { rowBuf[x] = 32; continue; }
                if (fade > 1) fade = 1;

                let v = 0;
                const dy = ay / kY;
                const R = Math.sqrt(ax * ax + dy * dy);
                const onDisk = R > rin && R < rout;

                if (onDisk) {
                    //Doppler beaming. One limb runs at the camera and outshines
                    //the other; without it a spinning disk reads as a still ring.
                    //Floored so the dim limb never flips negative and inverts.
                    const dopp = Math.max(0.06, 1 + 1.10 * ax / R);
                    v = diskRadial(R) * diskBand(R, Math.atan2(dy, ax)) * dopp * 1.30;
                }

                //The lensed sky, stamped before this loop ran. max rather than
                //+=, so a star lying over the disk simply loses to it instead of
                //punching a bright speck through a surface it sits behind.
                if (sky[i] > v) v = sky[i];

                if (r < rh) {
                    //Nothing leaves the horizon. The one exception is the near
                    //limb of the disk, which passes between us and the hole
                    //rather than behind it — ay > 0 is the half tipped forward.
                    if (!(onDisk && ay > 0)) v = 0;
                } else {
                    //The lensed halo — the far side of the disk, bent by gravity
                    //over the top and under the bottom of the hole rather than
                    //hidden behind it, so the second image wraps the shadow into
                    //a closed ring instead of a band with a gap in it. This is
                    //the one feature that makes the shape read as Gargantua.
                    //Rays grazing closest to the shadow have swung furthest
                    //around the disk, so its whole radial span piles up at the
                    //inner edge (t=0) and thins out toward the outer edge (t=1).
                    if (r > haloIn && r < haloOut) {
                        const t = (r - haloIn) / haloSpan;
                        const R2 = rin + t * t * (rout - rin);
                        const thin = (1 - t) * (1 - t);
                        const doppH = Math.max(0.06, 1 + 1.10 * ax / r);
                        //Turbulence and Doppler are floored together, as one
                        //product, not as two separate floors multiplied apart —
                        //two independent floors still compound down toward zero
                        //on the receding limb, which measured out as a real gap
                        //in the ring rather than its (much dimmer) far side.
                        //0.45 was the smallest floor that kept every angle of
                        //the ring's body above the render threshold across a
                        //full sweep of turning phases; the bright limb still
                        //reaches roughly double that on its own.
                        const mod = Math.max(0.45, diskBand(R2, Math.atan2(ay, ax)) * doppH);
                        const haloV = diskRadial(R2) * mod * thin * 2.2;
                        //max, not +=: where the halo and the direct band overlap
                        //near the disk's own left/right edge, adding them would
                        //weld a bright seam into the join.
                        if (haloV > v) v = haloV;
                    }

                    //Photon ring: light that orbited the hole on its way here.
                    const d = (r - rph) / ringW;
                    if (d > -3.2 && d < 3.2) {
                        const beam = 0.45 + 0.55 * ax / r;
                        v += 1.20 * Math.exp(-d * d) * (beam > 0.08 ? beam : 0.08);
                    }
                    //A little infalling haze, so the sky near the hole reads as
                    //something being pulled in rather than as flat black. Cubed
                    //and tied to the disk's own reach: a linear wave at this
                    //amplitude lit two thirds of the screen, which behind a page
                    //of text is not atmosphere, it is noise.
                    const reach = 1 - r / (rout * 1.5);
                    if (reach > 0) {
                        const hz = 0.5 + 0.5 * Math.sin(
                            ax * 8 - phase * 0.7 + Math.sin(ay * 6 + phase * 0.5) * 1.7);
                        v += 0.34 * hz * hz * hz * reach;
                    }
                }

                //Highlight knee, not a gamma. Raw disk brightness runs past 3
                //near the inner edge, which pinned whole regions to @ and % and
                //turned the disk into a wall over the page's text. v/(1+v) is
                //near-linear down low, so the faint outer line work survives
                //untouched, and only the top end gets pulled in. Squaring the
                //whole range instead erased the line work along with the wall.
                v = v > 0 ? 1.15 * v / (1 + v) * fade * amp : 0;
                rowBuf[x] = RAMP.charCodeAt(v <= 0 ? 0 : v >= 1 ? 9 : (v * 10) | 0);
            }
            lines[y] = String.fromCharCode.apply(null, rowBuf);
        }

        drawRing();
        world.textContent = lines.join('\n');

        //The glyph-colour gradient follows the hole, but only moves with
        //scroll — never with spin. Repainting a full-viewport gradient every
        //frame for a value that did not change is the one avoidable cost here.
        const gx = Math.round(layer.clientWidth / 2 + offX * unitPx);
        const gy = Math.round(layer.clientHeight / 2 + offY * unitPx);
        const gr = Math.round(rout * unitPx * 0.70);
        if (Math.abs(gx - glowX) > 2 || Math.abs(gy - glowY) > 2 || Math.abs(gr - glowR) > 2) {
            glowX = gx; glowY = gy; glowR = gr;
            layer.style.setProperty('--bh-x', gx + 'px');
            layer.style.setProperty('--bh-y', gy + 'px');
            layer.style.setProperty('--bh-glow', gr + 'px');
        }
    }

    //--- driving it ----------------------------------------------------------

    function tick(now) {
        raf = requestAnimationFrame(tick);
        if (now - last < FRAME) return;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;

        //Scrolling spins the disk up and it settles back to its own rate, so a
        //flick down the page shows as the world reacting rather than sliding.
        const y = window.scrollY;
        spin += Math.abs(y - lastY) / Math.max(1, window.innerHeight) * 7;
        lastY = y;
        spin *= 0.90;
        phase = (phase + dt * (0.34 + Math.min(4, spin))) % 100000;

        pCur += (progress() - pCur) * 0.12;
        //Slower than the scroll easing above, so the lean reads as weight being
        //moved rather than as the backdrop tracking the mouse.
        leanX += (leanTX - leanX) * 0.06;
        leanY += (leanTY - leanY) * 0.06;

        updateRingTarget(y);
        ringX += (ringTX - ringX) * 0.25;
        ringY += (ringTY - ringY) * 0.25;
        ringA += ((overBlank ? 1 : 0) - ringA) * 0.12;

        render();
    }

    //elementFromPoint forces a style flush, so this only runs when something
    //that could change its answer actually has: the pointer moved, or the page
    //scrolled a different element under a still cursor. Everywhere else in this
    //file a handler records and tick() computes — this keeps that shape rather
    //than hit-testing on every pointermove.
    function updateRingTarget(scrollY) {
        if (!pointerLive || !unitPx) { overBlank = false; return; }
        if (pointerClientX === lastHitX && pointerClientY === lastHitY && scrollY === lastHitScrollY) return;
        lastHitX = pointerClientX; lastHitY = pointerClientY; lastHitScrollY = scrollY;

        const el = document.elementFromPoint(pointerClientX, pointerClientY);
        overBlank = !!el && el.matches(GROUND);
        if (overBlank) {
            //The same conversion nx/ny were built with: a pixel offset from the
            //viewport centre, scaled by unitPx. Not the lean's -1..1 normalised
            //space — the ring has to land on the actual cell under the cursor,
            //not on a small parallax nudge. .blackhole is `position: fixed`, so
            //client coordinates are exactly the raster's own coordinates with no
            //scroll term to add.
            ringTX = (pointerClientX - viewW / 2) / unitPx;
            ringTY = (pointerClientY - viewH / 2) / unitPx;
        }
    }

    function start() {
        if (running || !enabled) return;
        running = true;
        last = performance.now();
        lastY = window.scrollY;
        raf = requestAnimationFrame(tick);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    //Reduced motion keeps the hole but drops the clock: it is still a camera
    //the reader drives, it just no longer turns on its own.
    function still() {
        pCur = progress();
        render();
    }

    //Normalised to the same units the camera works in, so LEAN is a cap in the
    //drift's own currency rather than a pixel count that means something
    //different on every screen.
    function onPointer(e) {
        leanTX = (1 - (e.clientX / window.innerWidth) * 2) * LEAN;
        leanTY = (1 - (e.clientY / window.innerHeight) * 2) * LEAN;
        //Raw client coordinates only, kept for tick()'s own hit-test to read.
        //elementFromPoint does not belong in a pointermove handler that can
        //fire far faster than the frame this file actually paints at.
        pointerClientX = e.clientX;
        pointerClientY = e.clientY;
        pointerLive = true;
    }

    //Pointer gone from the window: return to the scripted path rather than
    //holding whatever lean or ring the last frame happened to catch.
    function onPointerOut() {
        leanTX = leanTY = 0;
        pointerLive = false;
        overBlank = false;
    }

    function applyLean() {
        window.removeEventListener('pointermove', onPointer);
        document.removeEventListener('pointerleave', onPointerOut);
        //Reduced motion means the reader drives every move on the page. A hole
        //that slides because the mouse passed over it is exactly the motion
        //they asked not to have — and the ring is cursor-driven in exactly the
        //same way, so it stands down for the same reason. A touch device has
        //no hovering pointer, which is what both effects are built from.
        if (fine.matches && !motion.matches) {
            window.addEventListener('pointermove', onPointer, { passive: true });
            document.addEventListener('pointerleave', onPointerOut);
        } else {
            leanTX = leanTY = leanX = leanY = 0;
            ringTX = ringTY = ringX = ringY = ringA = 0;
            pointerLive = overBlank = false;
            lastHitX = lastHitY = lastHitScrollY = -1;
        }
    }

    function applyMotion() {
        window.removeEventListener('scroll', still);
        applyLean();
        if (motion.matches) {
            stop();
            window.addEventListener('scroll', still, { passive: true });
            still();
        } else if (!document.hidden) {
            start();
        }
    }

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 150);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (enabled && !motion.matches) start();
    });

    if (motion.addEventListener) motion.addEventListener('change', applyMotion);
    //A mouse plugged into a tablet flips this mid-session.
    if (fine.addEventListener) fine.addEventListener('change', applyLean);

    layout();
    //Fonts decide the cell's advance width, so the first measurement is only
    //provisional until they land.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    applyMotion();

    //Exposed so the terminal can switch it off — the raster is a backdrop, and
    //a reader who wants it gone should be able to say so.
    window.blackhole = {
        toggle() {
            enabled = !enabled;
            layer.hidden = !enabled;
            if (enabled) { layout(); applyMotion(); } else stop();
            return enabled;
        },
        get enabled() { return enabled; },
    };
})();
