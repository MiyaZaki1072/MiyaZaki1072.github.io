//Spring layer -----------------------------------------------------------------
//
//Motion (motion.dev) owns the moves that answer the pointer: the card
//spotlight and the stats counting up. GSAP in motion.js
//keeps the scroll entrances. The two never write the same card at once: every
//move here stands aside while GSAP still holds a card.
//
//Vendored under vendor/ for the same reason GSAP is: no build step, and the page
//still runs from a file:// copy with the network off. If vendor/motion.min.js is
//missing this returns on its first line and the cards simply sit still.

(function () {
    const { Motion } = window;
    if (!Motion) return;
    const { animate, motionValue, inView } = Motion;

    const cards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
    const grid = document.querySelector('.project-grid');
    if (!cards.length || !grid) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = () => reducedMotion.matches;

    //Before its trigger GSAP parks a card at opacity 0, and during its entrance
    //it is tweening it. Either way the card is not ours to write to yet.
    const gsapOwns = card =>
        card.style.opacity === '0' || Boolean(window.gsap && window.gsap.isTweening(card));

    const liftSpring = { type: 'spring', stiffness: 300, damping: 20 };
    const glideSpring = { type: 'spring', stiffness: 170, damping: 24 };
    const settleSpring = { type: 'spring', stiffness: 180, damping: 16 };
    const slideSpring = { type: 'spring', stiffness: 380, damping: 32 };
    const exitTween = { duration: 0.18, ease: 'easeIn' };

    //Every move on a card goes through one rig, so the lift and the filter's
    //slide compose into a single transform instead of overwriting each other's
    //inline style. At rest the rig takes its styles back off, which puts
    //style.css's own :hover lift in charge again. It only ever clears what it
    //wrote itself, so it cannot wipe a start state GSAP left on the card.
    const rigs = new Map(cards.map(card => {
        const v = {
            lift: motionValue(0),
            x: motionValue(0), y: motionValue(0), s: motionValue(1), o: motionValue(1),
        };
        let ownsTransform = false;
        let ownsOpacity = false;
        const render = () => {
            const lift = v.lift.get();
            const x = v.x.get(), y = v.y.get(), s = v.s.get(), o = v.o.get();
            const still = lift === 0 && x === 0 && y === 0 && s === 1;
            if (!still) {
                card.style.transform = `translate3d(${x}px, ${y - lift}px, 0) scale(${s})`;
                ownsTransform = true;
            } else if (ownsTransform) {
                card.style.transform = '';
                ownsTransform = false;
            }
            if (o !== 1) {
                card.style.opacity = String(o);
                ownsOpacity = true;
            } else if (ownsOpacity) {
                card.style.opacity = '';
                ownsOpacity = false;
            }
            //Off the CSS transform transition while the rig drives the card:
            //a 0.2s ease on a value rewritten every frame just drags behind it.
            card.classList.toggle('is-rigged', ownsTransform || ownsOpacity);
        };
        Object.values(v).forEach(value => value.on('change', render));
        return [card, v];
    }));

    //--- spotlight -------------------------------------------------------------

    //A mouse over a card lifts it a few pixels and trails a green spotlight
    //after the pointer: a lit stretch of the border and a faint wash inside.
    //The light follows on a spring rather than sitting under the cursor, which
    //is what makes it read as light and not as a second cursor. The card itself
    //stays flat. Mouse only: on touch a "hover" is the start of a tap.
    function cardSpotlight() {
        rigs.forEach((v, card) => {
            const layers = ['card-glare', 'card-edge'].map(name => {
                const span = document.createElement('span');
                span.className = name;
                span.setAttribute('aria-hidden', 'true');
                return span;
            });
            card.append(...layers);

            const gx = motionValue(50);
            const gy = motionValue(50);
            const paint = () => {
                card.style.setProperty('--glare-x', `${gx.get().toFixed(1)}%`);
                card.style.setProperty('--glare-y', `${gy.get().toFixed(1)}%`);
            };
            gx.on('change', paint);
            gy.on('change', paint);

            card.addEventListener('pointermove', e => {
                if (e.pointerType !== 'mouse' || calm() || !finePointer.matches) return;
                if (gsapOwns(card)) return;
                const rect = card.getBoundingClientRect();
                const px = ((e.clientX - rect.left) / rect.width) * 100;
                const py = ((e.clientY - rect.top) / rect.height) * 100;
                //On the way in the light starts where the pointer entered
                //instead of sliding over from wherever it last went out.
                if (!card.classList.contains('is-lit')) {
                    card.classList.add('is-lit');
                    gx.jump(px);
                    gy.jump(py);
                    animate(v.lift, 6, liftSpring);
                }
                animate(gx, px, glideSpring);
                animate(gy, py, glideSpring);
            });

            card.addEventListener('pointerleave', () => {
                if (!card.classList.contains('is-lit')) return;
                card.classList.remove('is-lit');
                animate(v.lift, 0, settleSpring);
            });
        });
    }

    //--- stats -----------------------------------------------------------------

    //The contribution numbers count up from zero the first time the block is
    //on screen. Like the grid wave in motion.js, the block only exists once its
    //data has arrived, so this waits for it to un-hide and does nothing if it
    //never does. Busiest is a weekday, not a count, and is left as written.
    //
    //The figures are parked at 0 the moment the data lands, not when the count
    //starts: the in-view callback trails the scroll by several frames, which
    //otherwise flashes the final number and then drops it. The real figure
    //waits in data-final, which is where the terminal reads it from meanwhile.
    //Already on screen when the data lands, there is nothing to reveal, so the
    //numbers are left alone.
    function countStats() {
        const block = document.getElementById('contributions');
        if (!block) return;

        const stats = () => ['contribTotal', 'contribCurrent', 'contribLongest'].map(id => {
            const el = document.getElementById(id);
            const match = el && el.textContent.match(/^([\d,]+)(.*)$/);
            return match && { el, target: Number(match[1].replace(/,/g, '')), suffix: match[2] };
        }).filter(Boolean);

        const onScreen = () => {
            const rect = block.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        };

        const arm = () => {
            if (calm() || onScreen()) return;
            const parked = stats();
            parked.forEach(({ el, suffix }) => {
                el.dataset.final = el.textContent;
                el.textContent = `0${suffix}`;
            });
            const stop = inView(block, () => {
                stop();
                parked.forEach(({ el, target, suffix }) => {
                    const land = () => {
                        el.textContent = el.dataset.final;
                        delete el.dataset.final;
                    };
                    if (calm()) {
                        land();
                        return;
                    }
                    animate(0, target, {
                        duration: 1.4,
                        ease: [0.16, 1, 0.3, 1],
                        onUpdate: n => { el.textContent = Math.round(n).toLocaleString() + suffix; },
                    }).finished.then(land);
                });
            }, { amount: 0.3 });
        };

        if (!block.hidden) {
            arm();
            return;
        }
        const watch = new MutationObserver(() => {
            if (block.hidden) return;
            watch.disconnect();
            arm();
        });
        watch.observe(block, { attributes: true, attributeFilter: ['hidden'] });
    }

    cardSpotlight();
    countStats();
})();
