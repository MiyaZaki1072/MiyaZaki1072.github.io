//The grove -------------------------------------------------------------------
//
//The opening scene: FREYR wakes, a tree grows up behind it, and the bio and
//links arrive on its branches. Scroll is the only clock. Everything here is one
//GSAP timeline of length 1, scrubbed by one ScrollTrigger, so a scroll position
//always means exactly one frame: scrolling back up undoes the growth, and a
//reload half way down lands on the frame that belongs there. Nothing is
//triggered once, nothing runs on a timer, and nothing is random at run time —
//the tree's shape and every element's window (data-grow-start / -end) were
//written into index.html by scripts/grove-svg.mjs.
//
//Same contract as motion.js: style.css draws the finished tree, and every
//hidden start state is written from here, after GSAP is known to be present.
//No GSAP, reduced motion, or too short a screen to hold the scene, and this
//builds nothing: the visitor gets the complete tree as plain content.

(function () {
    const { gsap, ScrollTrigger } = window;
    const grove = document.getElementById('grove');
    if (!gsap || !ScrollTrigger || !grove) return;
    gsap.registerPlugin(ScrollTrigger);

    //Past this point the bio and links are showing and can take focus.
    const REVEAL_AT = 0.86;
    //The tall composition. Same query as the tall block in style.css.
    const TALL = '(max-width: 900px), (max-aspect-ratio: 4/5)';

    const skip = grove.querySelector('.grove-skip');
    const bio = grove.querySelector('.grove-bio');
    //Everything that arrives in the scene as a whole: the two panels and the
    //link cards. Each carries its own data-grow window.
    const panels = [...grove.querySelectorAll('.grove-bio, .grove-skills, .grove-slot')];
    //What can take focus in them: the links, the skill tags, and the résumé
    //link once it has an href.
    const controls = [...grove.querySelectorAll('.grove-bio a, .grove-links a, .grove-skills button')];
    const windowOf = el => [parseFloat(el.dataset.growStart), parseFloat(el.dataset.growEnd)];

    gsap.matchMedia().add({
        motion: '(prefers-reduced-motion: no-preference)',
        //A landscape phone has no room for a sticky scene and the panels on
        //it, so it gets the finished tree to scroll past instead.
        roomy: '(min-height: 500px)',
        tall: TALL,
    }, (context) => {
        const { motion, roomy, tall } = context.conditions;
        if (!motion || !roomy) return;

        grove.classList.add('grove-live');
        const art = grove.querySelector(tall ? '.grove-art--tall' : '.grove-art--wide');

        const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
        //Pins the timeline's length to 1, so its time is the scroll progress.
        tl.to({}, { duration: 1 }, 0);

        //Wood, roots and veins draw along their length. Lengths are in viewBox
        //units, which a resize never changes, so measuring once per build is
        //enough. The gap is two caps longer than the path and the offset one
        //cap past it, so neither round cap shows before the stroke does.
        art.querySelectorAll('path[data-grow-start]').forEach(path => {
            const [start, end] = windowOf(path);
            const len = path.getTotalLength();
            const cap = parseFloat(path.getAttribute('stroke-width')) || 2;
            tl.fromTo(path,
                { strokeDasharray: `${len} ${len + 2 * cap}`, strokeDashoffset: len + cap },
                { strokeDashoffset: 0, duration: end - start },
                start);
        });

        //Leaves unfold from the stem: the shape's left middle is the point it
        //is attached at.
        art.querySelectorAll('.grove-leaf').forEach(leaf => {
            const [start, end] = windowOf(leaf);
            tl.fromTo(leaf,
                { scale: 0.15, opacity: 0, transformOrigin: '0% 50%' },
                { scale: 1, opacity: 1, duration: end - start, ease: 'power1.out' },
                start);
        });

        //The content arrives last, each card after its branch tip is drawn.
        //style.css places these with `translate`, a property of its own, so the
        //y here never fights it.
        panels.forEach(el => {
            const [start, end] = windowOf(el);
            tl.fromTo(el,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: end - start, ease: 'power1.out' },
                start);
        });

        //A control that cannot be seen cannot be tabbed to either. Only the
        //change is written, so a scroll that stays on one side costs nothing.
        let grown = null;
        function setGrown(on) {
            if (on === grown) return;
            grown = on;
            controls.forEach(el => (on ? el.removeAttribute('tabindex') : el.setAttribute('tabindex', '-1')));
            grove.classList.toggle('is-grown', on);
        }

        const trigger = ScrollTrigger.create({
            trigger: grove,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            animation: tl,
            onUpdate: self => setGrown(self.progress >= REVEAL_AT),
            onRefresh: self => setGrown(self.progress >= REVEAL_AT),
        });
        setGrown(trigger.progress >= REVEAL_AT);

        //Straight to the last frame, and focus to the bio, so the next Tab is
        //the first link rather than whatever comes after the grove.
        function skipToEnd(e) {
            e.preventDefault();
            window.scrollTo({ top: trigger.end, behavior: 'instant' });
            ScrollTrigger.update();
            bio.focus({ preventScroll: true });
        }
        if (skip) skip.addEventListener('click', skipToEnd);

        //The page is taller now than when motion.js measured its triggers.
        ScrollTrigger.refresh();

        return () => {
            if (skip) skip.removeEventListener('click', skipToEnd);
            trigger.kill();
            tl.kill();
            controls.forEach(el => el.removeAttribute('tabindex'));
            grove.classList.remove('grove-live', 'is-grown');
        };
    });
})();
