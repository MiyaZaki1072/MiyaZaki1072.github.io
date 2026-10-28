//Bookshelf ---------------------------------------------------------------------
//Picking a book lifts its cover off the shelf, flies it to the middle of the
//page, then swings the cover open onto the page behind it. The details on that
//page are a copy of the card's own .project-info, so the card stays the single
//source of truth and the terminal keeps reading it.
//
//The flight is a FLIP: measure the book on the shelf and the book in the stage,
//start the stage book where the shelf book is, and let a CSS transition carry
//it to the middle. Nothing here needs a library, so it runs from file:// too.

(function () {
    const stage = document.getElementById('bookStage');
    const stageBook = document.getElementById('stageBook');
    const page = document.getElementById('stagePage');
    const front = document.getElementById('stageFront');
    const closeBtn = document.getElementById('bookClose');
    const books = Array.from(document.querySelectorAll('.book'));
    if (!stage || !stageBook || !books.length) return;

    const FLY = 520;
    const SWING = 920;
    const lean = 'rotateY(-16deg)';

    let active = null;
    let timers = [];

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

    //Where the shelf book sits, as a transform on the stage book at its resting
    //place. Centres rather than corners because the book scales about its middle.
    function fromShelf(book) {
        const src = book.querySelector('.book-pick').getBoundingClientRect();
        const dst = stageBook.getBoundingClientRect();
        const scale = src.width / dst.width;
        const dx = (src.left + src.width / 2) - (dst.left + dst.width / 2);
        const dy = (src.top + src.height / 2) - (dst.top + dst.height / 2);
        return `translate(${dx}px, ${dy}px) scale(${scale}) ${lean}`;
    }

    function open(book) {
        if (active) return;
        active = book;
        clearTimers();

        front.replaceChildren(book.querySelector('.book-cover').cloneNode(true));
        page.replaceChildren(book.querySelector('.project-info').cloneNode(true));
        page.scrollTop = 0;
        stage.setAttribute('aria-label', book.querySelector('.project-title')?.textContent.trim() || 'Project');
        //--cover is set per book on the shelf, so the stage needs its own copy.
        stage.style.setProperty('--cover', getComputedStyle(book).getPropertyValue('--cover'));
        stage.hidden = false;
        stage.classList.remove('is-on', 'is-open');
        document.documentElement.classList.add('stage-open');
        closeBtn.focus({ preventScroll: true });

        if (reducedMotion.matches) {
            book.classList.add('is-out');
            stage.classList.add('is-on', 'is-open');
            return;
        }

        //Measure at rest, park the stage book on the shelf, then let go.
        stageBook.style.transition = 'none';
        stageBook.style.transform = 'none';
        const start = fromShelf(book);
        stageBook.style.transform = start;
        stageBook.getBoundingClientRect();
        stageBook.style.transition = '';

        book.classList.add('is-out');
        stage.classList.add('is-on');
        stageBook.style.transform = 'none';
        //Cleared, not left at 'none': the open state sets its own transform.
        later(() => {
            stageBook.style.transform = '';
            stage.classList.add('is-open');
        }, FLY);
    }

    function finish(book) {
        stage.hidden = true;
        stage.classList.remove('is-on', 'is-open');
        stageBook.style.transform = '';
        stageBook.style.transition = '';
        front.replaceChildren();
        page.replaceChildren();
        document.documentElement.classList.remove('stage-open');
        book.classList.remove('is-out');
        book.querySelector('.book-pick').focus({ preventScroll: true });
        active = null;
    }

    function close() {
        if (!active) return;
        const book = active;
        clearTimers();
        stage.classList.remove('is-open');

        if (reducedMotion.matches) {
            finish(book);
            return;
        }

        //Shut the cover, then carry the book back to the shelf.
        later(() => {
            stageBook.style.transition = 'none';
            stageBook.style.transform = 'none';
            const back = fromShelf(book);
            stageBook.getBoundingClientRect();
            stageBook.style.transition = '';
            stageBook.style.transform = back;
            stage.classList.remove('is-on');
            later(() => finish(book), FLY);
        }, SWING);
    }

    books.forEach(book => {
        book.querySelector('.book-pick').addEventListener('click', () => open(book));
    });

    closeBtn.addEventListener('click', close);
    stage.querySelector('.stage-scrim').addEventListener('click', close);

    document.addEventListener('keydown', e => {
        if (!active) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
            return;
        }
        if (e.key !== 'Tab') return;
        //Keep Tab inside the open book.
        const focusable = Array.from(stage.querySelectorAll('a[href], button')).filter(el => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
})();
