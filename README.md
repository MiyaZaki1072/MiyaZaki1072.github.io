# Personal Portfolio

The source for **[miyazaki1072.github.io](https://miyazaki1072.github.io/)** — Thitiwut
"Freyr" Sreewasut's personal portfolio, built with vanilla HTML, CSS, and JavaScript
(no frameworks, no build step).

**Recruiter or reviewer poking around this repo?** The code is here for reference, but
the site is meant to be seen running — → **[visit the live page](https://miyazaki1072.github.io/)**
for the terminal-styled hero, the scroll-driven black hole backdrop, the project
showcase, and the education/experience timeline.

---

## Features

- Scroll-driven ASCII black hole backdrop (`blackhole.js`) that drifts and grows as you
  scroll the page, rendered as a single `<pre>` raster for performance
- Profile picture switcher with a circular progress ring on hover
- Click the avatar to flip it to a Braille ASCII cat (one per photo), click again to flip back
- Scramble text animation when switching languages
- Full Thai / English translation toggle
- Smooth scroll navigation with a fixed navbar
- Project showcase with tag filtering, hover overlays, and a GitHub contribution heatmap
- Background section with an Education / Experience toggle across multiple tracks
  (education, volunteer, work, competitions & awards) and a photo lightbox linking out
  to each school's Facebook page
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
- **Vanilla JavaScript** — no dependencies, no frameworks
- **Google Fonts** — Space Grotesk (display), IBM Plex Sans + IBM Plex Sans Thai
  (body, one superfamily so the EN/TH toggle keeps a consistent voice),
  JetBrains Mono (terminal, code, and labels), Noto Sans Symbols 2 (the avatar's
  Braille cat — a 5.6KB subset, the only family here with Braille glyphs)
- **WebP images** — sized to their display box; the social card stays JPEG
  because link crawlers are unreliable with WebP

---

## License

MIT
