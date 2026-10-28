//Spring layer -----------------------------------------------------------------
//
//Motion (motion.dev) owns the moves that answer the pointer: the card lift,
//the tag preview, and the stats counting up. GSAP in motion.js
//keeps the scroll entrances. The two never write the same card at once: every
//move here stands aside while GSAP still holds a card.
//
//Vendored under js/vendor/ for the same reason GSAP is: no build step, and the page
//still runs from a file:// copy with the network off. If js/vendor/motion.min.js is
//missing this returns on its first line and the cards simply don't move.

(function () {
    const { Motion } = window;
    if (!Motion) return;
    const { animate, motionValue, inView } = Motion;

    //Every card that lifts on hover: the projects, the three highlights
    //and the two Background columns. The tag preview only ever touches the
    //projects.
    //The books are not lifted here: a card is the book plus its plank, so
    //lifting it raised the whole shelf. The book lifts itself in CSS.
    const surfaces = Array.from(document.querySelectorAll('.project-card:not(.book), .timeline-col'));
    const cards = Array.from(document.querySelectorAll('.project-card[data-tags]'));
    const grid = document.querySelector('.project-grid');
    if (!surfaces.length) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = () => reducedMotion.matches;
    //The checks every pointer effect makes before it moves anything.
    const mouseOnly = e => e.pointerType === 'mouse' && !calm() && finePointer.matches;

    //Before its trigger GSAP parks a card at opacity 0, and during its entrance
    //it is tweening it. Either way the card is not ours to write to yet.
    const gsapOwns = card =>
        card.style.opacity === '0' || Boolean(window.gsap && window.gsap.isTweening(card));

    const liftSpring = { type: 'spring', stiffness: 300, damping: 20 };
    const settleSpring = { type: 'spring', stiffness: 180, damping: 16 };

    //The lift goes through one value per card so the hover and the tag
    //preview never overwrite each other's inline transform. At rest the rig
    //takes its style back off, and it only ever clears what it wrote itself,
    //so it cannot wipe a start state GSAP left on the card.
    const rigs = new Map(surfaces.map(card => {
        const v = { lift: motionValue(0) };
        let ownsTransform = false;
        v.lift.on('change', () => {
            const lift = v.lift.get();
            if (lift !== 0) {
                card.style.transform = `translate3d(0, ${-lift}px, 0)`;
                ownsTransform = true;
            } else if (ownsTransform) {
                card.style.transform = '';
                ownsTransform = false;
            }
            //Off the CSS transform transition while the rig drives the card:
            //a 0.2s ease on a value rewritten every frame just drags behind it.
            card.classList.toggle('is-rigged', ownsTransform);
        });
        return [card, v];
    }));

    //--- lift -------------------------------------------------------------------

    //A mouse over a card lifts it a few pixels on a spring, and lets it settle
    //when it leaves. Mouse only: on touch a "hover" is the start of a tap.
    function cardLift() {
        rigs.forEach((v, card) => {
            //The Background columns are tall; a full 6px lift reads as a jump.
            const lift = card.matches('.timeline-col') ? 3 : 6;
            card.addEventListener('pointerenter', e => {
                if (!mouseOnly(e) || gsapOwns(card)) return;
                card.classList.add('is-lit');
                animate(v.lift, lift, liftSpring);
            });
            card.addEventListener('pointerleave', () => {
                if (!card.classList.contains('is-lit')) return;
                card.classList.remove('is-lit');
                animate(v.lift, 0, settleSpring);
            });
        });
    }

    //--- tag preview -----------------------------------------------------------

    //Pointing at a hero tag lights the projects built with it and dims the rest.
    function tagPreview() {
        if (!grid || !cards.length) return;
        const triggers = document.querySelectorAll('.skills-block button.skill-tag[data-tech]');

        const lift = (card, target, options) => {
            const rig = rigs.get(card);
            if (!rig || calm() || gsapOwns(card) || card.classList.contains('is-lit')) return;
            animate(rig.lift, target, options);
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

    cardLift();
    tagPreview();
    countStats();
})();
