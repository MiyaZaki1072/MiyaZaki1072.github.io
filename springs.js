//Spring layer -----------------------------------------------------------------
//
//Motion (motion.dev) owns the moves that answer the pointer: the card
//spotlight, the filter reshuffle, the tag preview, and the stats counting up. GSAP in motion.js
//keeps the scroll entrances. The two never write the same card at once: every
//move here stands aside while GSAP still holds a card.
//
//Vendored under vendor/ for the same reason GSAP is: no build step, and the page
//still runs from a file:// copy with the network off. If vendor/motion.min.js is
//missing this returns on its first line, window.animateProjectFilter is never
//defined, and index.js toggles the cards the way it always did.

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
    let flipping = false;

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
                if (flipping || gsapOwns(card)) return;
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

    //--- filter ----------------------------------------------------------------

    //index.js decides which cards match and hands over commit(), the class
    //change that makes it so. This wraps that change in a FLIP: the leaving
    //cards shrink out first, then the grid reflows and every card that stayed
    //springs from where it was to where it now sits, then the arrivals fade in.
    //
    //A new filter mid-move does not queue behind the old one. settle() jumps
    //the move in flight to its end state, and the new one starts from there, so
    //no card can be stranded half-faded however fast the tags are clicked.
    let settleFlip = null;

    window.animateProjectFilter = async (next, commit) => {
        if (settleFlip) settleFlip();

        const shown = card => !card.classList.contains('is-hidden');
        const leaving = cards.filter(card => shown(card) && !next.get(card));
        const entering = cards.filter(card => !shown(card) && next.get(card));
        //A hero tag can filter the grid before its entrance ever ran. Those
        //cards are below the fold anyway, so they just snap.
        if (calm() || (!leaving.length && !entering.length) || cards.some(gsapOwns)) {
            commit();
            return;
        }

        const live = [];
        const run = (value, target, options) => {
            const controls = animate(value, target, options);
            live.push(controls);
            return controls.finished;
        };
        const settle = () => {
            live.forEach(controls => controls.stop());
            commit();
            rigs.forEach(v => {
                v.x.jump(0); v.y.jump(0); v.s.jump(1); v.o.jump(1);
            });
            flipping = false;
            settleFlip = null;
        };
        settleFlip = settle;
        flipping = true;

        //The spotlight stands down for the move: a card lifted under the
        //pointer while it slides reads as the slide going wrong.
        rigs.forEach((v, card) => {
            card.classList.remove('is-lit');
            v.lift.jump(0);
        });

        await Promise.all(leaving.flatMap(card => {
            const v = rigs.get(card);
            return [run(v.o, 0, exitTween), run(v.s, 0.92, exitTween)];
        }));
        if (settleFlip !== settle) return;

        const first = new Map(cards
            .filter(card => shown(card) && next.get(card))
            .map(card => [card, card.getBoundingClientRect()]));
        commit();
        leaving.forEach(card => {
            const v = rigs.get(card);
            v.o.jump(1); v.s.jump(1);
        });

        const moves = [];
        first.forEach((before, card) => {
            const after = card.getBoundingClientRect();
            const dx = before.left - after.left;
            const dy = before.top - after.top;
            if (!dx && !dy) return;
            const v = rigs.get(card);
            v.x.jump(dx); v.y.jump(dy);
            moves.push(run(v.x, 0, slideSpring), run(v.y, 0, slideSpring));
        });
        entering.forEach((card, i) => {
            const v = rigs.get(card);
            v.o.jump(0); v.s.jump(0.92);
            const delay = 0.06 * i + (moves.length ? 0.08 : 0);
            moves.push(
                run(v.o, 1, { duration: 0.32, ease: 'easeOut', delay }),
                run(v.s, 1, { ...slideSpring, delay }),
            );
        });

        await Promise.all(moves);
        if (settleFlip !== settle) return;
        flipping = false;
        settleFlip = null;
    };

    //--- tag preview -----------------------------------------------------------

    //Pointing at a tag lights the projects built with it and dims the rest: a
    //preview of what clicking it would filter to. The filter chips sit right
    //above the grid, so that is where it shows; the hero tags do the same for
    //whatever part of the grid is on screen.
    function tagPreview() {
        const triggers = document.querySelectorAll(
            '#filterTags .skill-tag, .skills-block button.skill-tag[data-tech]'
        );

        const lift = (card, target, options) => {
            if (calm() || flipping || gsapOwns(card) || card.classList.contains('is-lit')) return;
            animate(rigs.get(card).lift, target, options);
        };

        const show = tech => {
            let any = false;
            cards.forEach(card => {
                const hit = tagsOf(card).includes(tech);
                card.classList.toggle('is-linked', hit);
                if (hit) any = true;
                lift(card, hit ? 6 : 0, liftSpring);
            });
            grid.classList.toggle('is-previewing', any);
        };

        const hide = () => {
            grid.classList.remove('is-previewing');
            cards.forEach(card => {
                if (!card.classList.contains('is-linked')) return;
                card.classList.remove('is-linked');
                lift(card, 0, settleSpring);
            });
        };

        triggers.forEach(btn => {
            const tech = btn.dataset.tech;
            if (!tech) return;
            btn.addEventListener('pointerenter', e => {
                if (e.pointerType === 'mouse') show(tech);
            });
            btn.addEventListener('pointerleave', hide);
            btn.addEventListener('focus', () => show(tech));
            btn.addEventListener('blur', hide);
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
    tagPreview();
    countStats();
})();
