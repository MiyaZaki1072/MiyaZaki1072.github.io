//Motion layer -----------------------------------------------------------------
//
//GSAP owns the entrances and the scroll-driven moves. Every other file keeps the
//behaviour it already had: blackhole.js still runs its own camera, index.js
//still owns the language scramble and the Education/Experience cascade, and the
//scroll rail still measures a page whose height nothing here changes — no
//pinning, so scrollHeight is exactly what it was.
//
//The library is vendored under vendor/ rather than pulled from a CDN, which
//keeps the two properties this project was built with: no build step, and it
//still runs from a file:// copy with the network off.
//
//Nothing here is load-bearing. If those two files are missing or blocked this
//block returns on its first line and the page renders as it always did — which
//is why no start state for any of this lives in style.css. Every hidden state is
//written from JS, after GSAP is known to be present, and cleared again once the
//move that needed it has finished.

(function () {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    //style.css hands its own entrances over on this class, and only on it.
    document.documentElement.classList.add('is-gsap');

    //style.css draws the timeline's spine as .timeline-track::before, which no
    //tween can reach, so a real element takes its place: same 1px, same spot,
    //but now something scaleY can draw down the track.
    //
    //This runs before the motion check, not inside it. The .is-gsap rule stands
    //that pseudo-element down the moment the class above lands, so the
    //replacement has to exist by then whether or not anything will ever animate
    //it — under reduced motion the rails are simply drawn full height and never
    //touched again. Every track gets one, hidden column included, so the two
    //renderings never disagree about where the spine comes from.
    document.querySelectorAll('.timeline-track').forEach(track => {
        if (track.querySelector(':scope > .timeline-rail')) return;
        const rail = document.createElement('span');
        rail.className = 'timeline-rail';
        rail.setAttribute('aria-hidden', 'true');
        track.prepend(rail);
    });

    //A ten-line stand-in for SplitText. The section prompts are the only text on
    //the page that needs per-character control, and they are static one-line
    //strings that no dictionary rewrites. Anything the EN/TH toggle touches is
    //deliberately left whole: scrambleText() in index.js writes straight to
    //those nodes and would drop the spans on the first press.
    function splitChars(el) {
        const text = el.textContent;
        el.textContent = '';
        return Array.from(text).map(char => {
            const span = document.createElement('span');
            span.className = 'split-char';
            span.textContent = char;
            el.appendChild(span);
            return span;
        });
    }

    //--- the moves ------------------------------------------------------------

    //The hero prints itself the way a shell prints a banner: the card, then the
    //portrait, then each line under it in the order you would read them.
    function heroBoot() {
        const card = document.querySelector('.about-inner');
        if (!card) return;

        const avatar = card.querySelector('.avatar-wrap');
        const lines = card.querySelectorAll('.text-section > *');

        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => gsap.set([card, avatar, ...lines], { clearProps: 'all' }),
        });
        tl.from(card, { opacity: 0, y: 26, duration: 0.7 })
            .from(avatar, { opacity: 0, scale: 0.88, duration: 0.7, ease: 'back.out(1.6)' }, 0.1)
            .from(lines, { opacity: 0, y: 14, duration: 0.5, stagger: 0.07 }, 0.2);
    }

    //The prompt above each section types itself out, then the heading arrives
    //under it — the same two-beat the hero opens with, one step quieter.
    function sectionHeaders() {
        document.querySelectorAll('.section-header').forEach(header => {
            const tag = header.querySelector('.section-tag');
            const title = header.querySelector('.section-title');

            const tl = gsap.timeline({
                scrollTrigger: { trigger: header, start: 'top 85%', once: true },
            });
            //Near-zero duration per character: the stagger is the animation, and
            //a fade on each one would blur the cursor-stepping-along feel.
            if (tag) {
                tl.from(splitChars(tag), {
                    opacity: 0, duration: 0.02, stagger: 0.035, ease: 'none', clearProps: 'opacity',
                });
            }
            if (title) {
                tl.from(title, { opacity: 0, y: 18, duration: 0.55, ease: 'power3.out', clearProps: 'all' }, 0.15);
            }
        });
    }

    //Staggered so the eye travels the grid in reading order as the section
    //enters, and tilted a few degrees off the horizontal so they arrive as one
    //group settling rather than four independent fades.
    function projectCards(cleanups) {
        const cards = gsap.utils.toArray('.project-card[data-tags]');
        if (!cards.length) return;

        gsap.set(cards, {
            opacity: 0, y: 28, rotateX: 8,
            transformPerspective: 800, transformOrigin: 'center top',
        });
        const settle = targets => gsap.set(targets, { clearProps: 'all' });

        const triggers = ScrollTrigger.batch(cards, {
            start: 'top 92%',
            once: true,
            onEnter: group => gsap.to(group, {
                opacity: 1, y: 0, rotateX: 0,
                duration: 0.6, ease: 'power3.out', stagger: 0.09,
                onComplete: () => settle(group),
            }),
        });

        //The tag filter hides and shows these cards with a class, and the filter
        //bar sits above the grid: a card can be filtered out while it is still
        //below the fold, never having crossed its trigger line. It would come
        //back holding the start state with nothing left to play it. So the first
        //touch of the filter ends the reveal outright — triggers off, inline
        //state gone — for the same reason the old CSS version stripped its
        //classes on animationend.
        const bar = document.querySelector('.filter-bar');
        if (!bar) return;
        const drop = () => {
            triggers.forEach(trigger => trigger.kill());
            settle(cards);
        };
        bar.addEventListener('click', drop, { once: true });
        cleanups.push(() => bar.removeEventListener('click', drop));
    }

    //The spine of each timeline draws downward as you scroll past it and each
    //dot pops as the line reaches it, so the track reads as being walked rather
    //than as already having been there.
    function timelineRails(cleanups) {
        const tracks = gsap.utils.toArray('.timeline-track');
        if (!tracks.length) return;

        tracks.forEach(track => {
            //A track inside the hidden column has no layout to measure, so every
            //trigger built against it would be positioned against a zero-height
            //parent. It also already has an entrance: setMode() in index.js runs
            //its own cascade over those items the moment it reveals them. Leave
            //the rail drawn and leave the column alone.
            const rail = track.querySelector(':scope > .timeline-rail');
            if (!rail || track.closest('.timeline-columns[hidden]')) return;

            gsap.fromTo(rail, { scaleY: 0 }, {
                scaleY: 1,
                ease: 'none',
                scrollTrigger: { trigger: track, start: 'top 80%', end: 'bottom 65%', scrub: 0.4 },
            });

            track.querySelectorAll('.timeline-item').forEach(item => {
                const dot = item.querySelector('.timeline-dot');
                const content = item.querySelector('.timeline-content');
                const tl = gsap.timeline({
                    scrollTrigger: { trigger: item, start: 'top 88%', once: true },
                });
                if (dot) {
                    tl.from(dot, { scale: 0, duration: 0.4, ease: 'back.out(2.2)', clearProps: 'all' });
                }
                if (content) {
                    tl.from(content, { opacity: 0, x: -14, duration: 0.45, ease: 'power3.out', clearProps: 'all' }, 0.05);
                }
            });
        });

        //The switch swaps which column has layout at all and re-runs that
        //column's own entrance, so from the first press the timeline belongs to
        //index.js again: triggers gone, inline state cleared, rails simply drawn.
        const toggle = document.getElementById('bgToggle');
        if (!toggle) return;
        const hand = () => {
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.trigger && trigger.trigger.closest('.timeline')) trigger.kill();
            });
            gsap.set('.timeline-dot, .timeline-content, .timeline-rail', { clearProps: 'all' });
        };
        toggle.addEventListener('click', hand, { once: true });
        cleanups.push(() => toggle.removeEventListener('click', hand));
    }

    //The year of commits draws itself in as the block enters, one column of days
    //after another, left to right. `amount` rather than `each` so the sweep
    //takes the same second and a bit whether the calendar came back with 300
    //cells or 371.
    //
    //The cells do not exist when this file runs: they are built from a fetch, and
    //on a first deploy or in local dev that fetch has nothing to return and the
    //block stays hidden forever. So this waits for the block to un-hide rather
    //than for the DOM to be ready, and does nothing at all if it never does.
    function contribWave(cleanups) {
        const block = document.getElementById('contributions');
        if (!block) return;

        const build = () => {
            const cells = block.querySelectorAll('.contrib-cell');
            if (!cells.length) return;
            gsap.from(cells, {
                opacity: 0,
                scale: 0.35,
                transformOrigin: 'center',
                duration: 0.45,
                ease: 'power2.out',
                stagger: { amount: 1.1, from: 'start' },
                clearProps: 'all',
                scrollTrigger: { trigger: block, start: 'top 85%', once: true },
            });
        };

        if (!block.hidden) {
            build();
            return;
        }
        const watch = new MutationObserver(() => {
            if (block.hidden) return;
            watch.disconnect();
            build();
        });
        watch.observe(block, { attributes: true, attributeFilter: ['hidden'] });
        cleanups.push(() => watch.disconnect());
    }

    //One lit block behind the nav, travelling between the links. It rests behind
    //whichever section you are in, follows the pointer while it is over the bar,
    //and returns when the pointer leaves.
    //
    //The travel is two beats, not one: the block first stretches to span both the
    //link it is leaving and the link it is going to, then collapses onto the
    //target. A single tween of x and width reads as a rectangle sliding; the
    //stretch reads as a selection being dragged, which is the gesture this bar is
    //imitating.
    function navHighlight(cleanups) {
        const navbar = document.querySelector('.navbar');
        const links = navbar ? [...navbar.querySelectorAll('.nav-link')] : [];
        if (!links.length) return;

        const block = document.createElement('span');
        block.className = 'nav-indicator';
        block.setAttribute('aria-hidden', 'true');
        navbar.prepend(block);
        //style.css only stands the CSS hover fill down once this class is on the
        //bar, so under reduced motion — where none of this is built — the links
        //keep the fill they have always had.
        navbar.classList.add('has-indicator');

        const activeLink = () => navbar.querySelector('.nav-link.active') || links[0];
        const boxOf = (link) => {
            const box = link.getBoundingClientRect();
            return { x: box.left - navbar.getBoundingClientRect().left, width: box.width };
        };

        let travel = null;
        function slideTo(link, instant) {
            const target = boxOf(link);
            if (travel) travel.kill();
            if (instant) {
                gsap.set(block, { x: target.x, width: target.width, opacity: 1 });
                return;
            }
            //The span both boxes share, so the stretch never shrinks past either
            //end of the trip.
            const fromX = gsap.getProperty(block, 'x');
            const fromWidth = gsap.getProperty(block, 'width');
            const left = Math.min(fromX, target.x);
            const right = Math.max(fromX + fromWidth, target.x + target.width);

            travel = gsap.timeline()
                .to(block, { x: left, width: right - left, duration: 0.18, ease: 'power2.out' })
                .to(block, { x: target.x, width: target.width, duration: 0.3, ease: 'power3.out' });
        }

        slideTo(activeLink(), true);

        const enter = (e) => slideTo(e.currentTarget, false);
        const leave = () => slideTo(activeLink(), false);
        links.forEach(link => {
            link.addEventListener('pointerenter', enter);
            cleanups.push(() => link.removeEventListener('pointerenter', enter));
        });
        navbar.addEventListener('pointerleave', leave);

        //The scrollspy in index.js moves .active as you pass each section, and it
        //says so by writing a class. Watching for that keeps the two in step
        //without either file having to know the other exists.
        const spy = new MutationObserver(() => {
            if (!navbar.matches(':hover')) slideTo(activeLink(), false);
        });
        links.forEach(link => spy.observe(link, { attributes: true, attributeFilter: ['class'] }));

        //A resize relays the bar out from scratch, and there is no travel to
        //show for it — the block belongs wherever the active link now is.
        const settle = () => slideTo(activeLink(), true);
        window.addEventListener('resize', settle, { passive: true });

        cleanups.push(() => {
            navbar.removeEventListener('pointerleave', leave);
            window.removeEventListener('resize', settle);
            spy.disconnect();
            navbar.classList.remove('has-indicator');
            block.remove();
        });
    }

    //--- driving it -----------------------------------------------------------

    //One matchMedia for the whole file. Reduced motion is not a branch inside
    //each move here: the callback simply never builds them, and GSAP reverts
    //every tween and start state it did build if the preference changes later.
    //That is the same contract the rest of the site keeps by re-reading its
    //matchMedia rather than sampling it once at load.
    gsap.matchMedia().add({
        motion: '(prefers-reduced-motion: no-preference)',
    }, (context) => {
        if (!context.conditions.motion) return;

        const cleanups = [];
        heroBoot();
        sectionHeaders();
        projectCards(cleanups);
        timelineRails(cleanups);
        contribWave(cleanups);
        //Not gated on a pointer: the block marks which section you are in, which
        //is worth having on a phone too. Only the hover half of it needs one, and
        //pointerenter simply never fires there.
        navHighlight(cleanups);

        return () => cleanups.forEach(fn => fn());
    });

    //Three things change the page's height after the first layout: the fonts
    //land, the images decode, and the contribution block un-hides itself when
    //its data arrives. None of them fires resize, so without these ScrollTrigger
    //would go on using start positions it measured against a shorter page.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    if (document.fonts) document.fonts.ready.then(refresh);

    const contrib = document.getElementById('contributions');
    if (contrib) {
        const watch = new MutationObserver(() => {
            if (contrib.hidden) return;
            watch.disconnect();
            refresh();
        });
        watch.observe(contrib, { attributes: true, attributeFilter: ['hidden'] });
    }
})();
