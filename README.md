# Personal Portfolio

The source for **[miyazaki1072.github.io](https://miyazaki1072.github.io/)** — Thitiwut
"Freyr" Sreewasut's personal portfolio, built with vanilla HTML, CSS, and JavaScript
(no frameworks, no build step). One library, GSAP, is vendored in for the motion
layer — see [Motion](#motion).

**Recruiter or reviewer poking around this repo?** The code is here for reference, but
the site is meant to be seen running — → **[visit the live page](https://miyazaki1072.github.io/)**
for the terminal-styled hero, the scroll-driven black hole backdrop, the project
showcase, and the education/experience timeline.

---

## Features

- Scroll-driven ASCII black hole backdrop (`blackhole.js`) that drifts and grows as you
  scroll the page, rendered as a single `<pre>` raster for performance, over a field of
  fixed stars that the hole lenses as it passes them — each one brightens, splits, and
  throws a counter-image around the far side of the shadow. A second, whole black hole —
  shadow, photon ring, tilted disk and lensed halo — rises under the pointer wherever it
  hovers true blank ground, never over a card or panel. Take it near the big one and the
  two merge: it is pulled off the cursor, spirals in trailing a stream of matter, and the
  light left over leaves as one expanding ring. Carry the pointer back out and a new one
  forms
- GSAP motion layer (`motion.js`) — the hero prints itself line by line, section prompts
  type themselves out, project cards arrive as a staggered batch, each timeline's spine
  draws itself as you scroll past it, the contribution heatmap fills in column by column,
  and one lit block travels between the nav links — see [Motion](#motion)
- Profile picture switcher with a circular progress ring on hover
- Click the avatar to flip it to a Braille ASCII cat (one per photo), click again to flip back
- Scramble text animation when switching languages
- Full Thai / English translation toggle
- Smooth scroll navigation with a fixed navbar
- Project showcase with tag filtering, hover overlays, and a GitHub contribution heatmap
- Background section with an Education / Experience toggle across multiple tracks
  (education, volunteer, work, competitions & awards) and a photo lightbox linking out
  to each school's Facebook page. Both tracks are dealt the same panel, so the switch
  never changes the height of the page under you
- Interactive terminal widget with tab-completion, command history, did-you-mean
  suggestions, commands that drive the page, and three games it always wins —
  see [The terminal](#the-terminal)
- Fully responsive — mobile, tablet, and desktop
- Honours `prefers-reduced-motion` — animations and text scrambling are skipped

---

## Project Structure

```
portfolio/
├── index.html          — page structure and content
├── style.css           — all styling and responsive breakpoints
├── index.js            — profile switcher, translation, timeline, and terminal logic
├── blackhole.js        — scroll-driven ASCII black hole backdrop
├── motion.js           — GSAP entrances and scroll-driven moves
├── vendor/             — GSAP 3.13.0, core + ScrollTrigger, vendored not CDN
└── images/
    ├── icon.png             — browser tab favicon
    ├── og-card.jpg          — social share card (og:image / twitter:image)
    ├── myface1.webp         — profile photo (default)
    ├── myface2.webp         — profile photo (alternate)
    ├── MesosuemPic.webp     — project screenshot
    ├── SeriesTracker.webp   — project screenshot
    ├── cat-terminal.webp    — cat perched on the terminal widget
    └── education/           — photos shown in the background timeline lightbox
```

---

## Running Locally

No install or build step needed. Just open `index.html` in your browser directly, or use a local server for a cleaner experience:

```bash
# Using the VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Or using Node.js
npx serve .

# Or using Python
python -m http.server 8000
```

---

## Motion

`motion.js` holds every GSAP-driven move on the page. Two rules shape the whole file.

**The library is vendored, not linked.** `vendor/gsap.min.js` and
`vendor/ScrollTrigger.min.js` are pinned copies of GSAP 3.13.0. A CDN would have kept
the no-build-step property while quietly giving up the other one this project has always
had: the page opens from a local copy with the network off.

**Nothing in it is load-bearing.** The file returns on its first line if either global is
missing, so a deleted `vendor/` costs the motion and never the content. That is also why
no start state for any of this lives in `style.css` — every hidden state is written from
JS, after GSAP is known to be present, and cleared again once its move has finished. The
CSS entrances stay in charge until `motion.js` adds `.is-gsap` to `<html>`, which it does
only once both globals have answered.

| move | what it does |
|---|---|
| hero boot | the card, the portrait, then each line under it, in the order you would read them |
| section prompts | `> ls ~/projects` types itself out a character at a time, and the heading arrives under it |
| project cards | a staggered batch, tilted a few degrees so the grid arrives as one group settling |
| timeline spine | draws downward on scroll, each dot popping as the line reaches it |
| contribution wave | the year of commits draws itself in column by column, left to right |
| nav highlight | one lit block travelling between the links, stretching across the gap as it goes |

**Reduced motion is not a branch inside each move.** The whole set is built inside one
`gsap.matchMedia()` keyed on `prefers-reduced-motion`, so under it the callback simply
never runs — and if the preference changes mid-visit GSAP reverts every tween and start
state it had written.

**There is no pinning, and there will not be.** Pinning changes `scrollHeight`, and two
things on this page measure that themselves: the scroll rail's percentage readout, and
the black hole's camera, which maps scroll progress to how far the hole has drifted. The
Education / Experience switch is held to the same rule from the CSS side — both tracks
share one grid cell, so the panel is always as tall as the longer of the two.

Four handoffs between this file and `index.js` are worth knowing about, because each one
exists to stop two systems claiming the same element:

- **The tag filter.** The first touch of the filter bar ends the card reveal outright —
  triggers killed, inline state cleared. A card can be filtered out while still below the
  fold, and would otherwise come back holding a start state with nothing left to play it.
- **The Education / Experience switch.** The first press hands the timeline back to
  `index.js`, which already runs its own cascade over a column when it reveals it.
- **The EN/TH toggle.** Nothing the dictionary rewrites is ever split into characters.
  `scrambleText` writes straight to those nodes and would drop the spans on first press.
- **The scrollspy.** It already says which section you are in by moving an `active` class
  along the nav. The highlight block watches for that rather than measuring scroll a
  second time, so the two can never disagree about which link is lit.

## The terminal

Click the `>_` button in the bottom-right corner. Tab completes, `↑`/`↓` walk the history,
`^C` cancels, `^L` clears, `esc` closes, and a typo gets a suggestion rather than a shrug.

| command | what it does |
|---|---|
| `help` | the list below, generated from the command table |
| `whoami` / `about` | name, status, and areas of interest |
| `skills` | the tech stack, read off the page |
| `projects [tag]` | projects, optionally filtered — the tag completes on `Tab` |
| `education` | academic background |
| `contact` | email / discord / github |
| `contrib` | the GitHub heatmap, redrawn in ASCII |
| `game` | pick one of three games |
| `goto <section>` | scrolls the page to `about`, `projects`, `background`, or `top` |
| `lang [en\|th]` | flips the page language, scramble animation and all |
| `open <link>` | opens `github`, `discord`, or an `email` draft |
| `blackhole` | toggles the backdrop |
| `matrix` | four seconds of rain |
| `neofetch` | system info, such as it is |
| `cowsay <text>` | the cat says it for you |
| `clear` / `exit` | clear the screen / close the panel |

There is one more that `help` will not tell you about.

**Adding a command is one row.** `COMMANDS` in `index.js` is a table of
`{ name, args, help, run }`, and `help`, tab-completion, and the did-you-mean suggestion all
read it. They used to keep separate copies of the list, which drifted — `about` and `sudo`
were live commands that `help` never mentioned. A row marked `hidden: true` is skipped by
help and by completion but still runs.

### The games are rigged

All three. That is the feature, not a bug, and two of them own up to it when they win:

| game | how the house wins | where |
|---|---|---|
| `21` | misère subtraction game — the multiples of four are the losing seats, so it just steps to the next one (`4 - total % 4`) | `computerTurn` |
| `rps` | it claims to have locked its move in first. It has not; it answers **after** you pick | `rpsAnswer` |
| `guess` | there is no number. It holds a range and every answer keeps the larger half alive, so seven guesses can never close it | `guessAnswer` |

Losing at `21` costs you an internship, per the house rules.

---

## The avatar's ASCII cats

Clicking the avatar flips it to a Braille dot-art cat. There is one per profile photo,
held in `index.js` as `ASCII_CAT_1` (green photo) and `ASCII_CAT_2` (amber photo), so
holding to swap while the ASCII is showing morphs between them.

Each cell is 2×4 dots, so the two grids are really one-bit bitmaps:

| constant | grid | effective |
|---|---|---|
| `ASCII_CAT_1` | 90 × 45 | 180 × 180 dots |
| `ASCII_CAT_2` | 50 × 25 | 100 × 100 dots |

A coarser grid reads better at this size, not worse: at a 280px avatar `ASCII_CAT_2`
gets 2.8px per dot against `ASCII_CAT_1`'s 1.6px, so its dots stay distinct instead of
antialiasing into grey.

To change either, just replace its template literal — **no CSS edit is needed.** The cell
size is measured off the art at runtime and written to `--ascii-w` / `--ascii-rows`, which
is why the two different grids both fill the same circle.

Two things must hold or the drawing will skew: **every row the same width**, and **Braille
characters only** (`U+2800`–`U+28FF`, using `⠀` U+2800 for blank cells rather than a normal
space). Keeping the grid at 2:1 columns-to-rows keeps the art square in the circle.

Noto Sans Symbols 2 is loaded for these because JetBrains Mono has no Braille glyphs at
all; its Braille subset is 5.6KB and every glyph in it advances a uniform 0.7em, which is
what holds the columns aligned.

---

## Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, grid, flexbox, keyframe animations
- **Vanilla JavaScript** — no framework, no build step
- **GSAP 3.13.0** — core and ScrollTrigger, the project's only dependency, vendored
  under `vendor/` rather than loaded from a CDN
- **Google Fonts** — Space Grotesk (display), IBM Plex Sans + IBM Plex Sans Thai
  (body, one superfamily so the EN/TH toggle keeps a consistent voice),
  JetBrains Mono (terminal, code, and labels), Noto Sans Symbols 2 (the avatar's
  Braille cat — a 5.6KB subset, the only family here with Braille glyphs)
- **WebP images** — sized to their display box; the social card stays JPEG
  because link crawlers are unreliable with WebP

---

## License

MIT
