# miyazaki1072.github.io

The personal site of **Thitiwut "Freyr" Sreewasut**, a Computer Engineering student at
Chulalongkorn University: 2× Thailand Olympiad in Informatics (TOI) bronze, NSC2024
finalist, and founder of the Kit2Code contest group.

**→ [See it live](https://miyazaki1072.github.io/)**. The site is meant to be seen
running; this repo is the source.

Plain HTML, CSS and JavaScript, with no framework and no build step. It opens straight
from a local copy, even offline.

---

## What's on the page

- **Hero:** name, photo, highlights, and contact links (Email, GitHub, LinkedIn, then
  Codeforces, Instagram, Facebook, LINE and Discord). Click a skill to jump to the projects
  built with it.
- **Highlights:** the two TOI bronze medals, the NSC2024 final, and Kit2Code.
- **Projects:** TaskMaker, CMS Admin Helper, Mesosuem and Series Tracker, with a tag filter
  that combines tags.
- **GitHub activity:** a contribution heatmap, generated at deploy time.
- **Organizing:** Kit2Code, the contest group I founded for POSN Computer students, its
  tools, and a log of the contests it has run.
- **Background:** education and experience side by side, with photo pop-ups for each school.
- **Terminal:** the `>_` button in the corner opens a working terminal (see below).
- **Backdrop:** a scroll-driven ASCII black hole drawn on one `<canvas>`. A second, small
  one follows the pointer over empty space and merges into the big one if you bring it close.

The site works on phones, tablets and desktops. With **reduced motion** turned on, every
animation and text scramble is skipped.

---

## Project structure

```
.
├── index.html            page structure and content
├── style.css             all styling; design tokens live in :root at the top
├── js/
│   ├── index.js          page logic: translation, filter, timeline, terminal, rune mode
│   ├── motion.js         GSAP scroll entrances
│   ├── springs.js        Motion spring effects that answer the pointer
│   ├── blackhole.js      the ASCII black hole backdrop
│   └── vendor/           GSAP 3.13.0 + plugins, Motion 13.4.4 (pinned copies, no CDN)
├── images/               photos, project screenshots, share card, sprites
├── data/                 contributions.json, written at deploy time (not edited by hand)
├── scripts/
│   └── fetch-contributions.mjs   builds data/contributions.json from the GitHub API
├── .github/workflows/
│   └── static.yml        deploys to GitHub Pages on push, and daily for the heatmap
├── sitemap.xml
└── robots.txt
```

---

## Running locally

Open `index.html` in a browser. That's all; nothing needs installing.

A local server is closer to the real site. Opened as a file, the browser blocks the
contributions fetch, so the heatmap stays hidden:

```bash
python -m http.server 8000
# or
npx serve .
```

## Deployment

Every push to `main` runs `.github/workflows/static.yml`. It fetches the contribution
calendar with `scripts/fetch-contributions.mjs` (the GitHub GraphQL API needs a token, which
can never ship in a public page) and publishes the repo to GitHub Pages. The same workflow
also runs once a day, so the heatmap stays current without a push.

---

## How the motion works

Animation is split across three files, and none of it is load-bearing. Each file checks
for its library on the first line and returns if it's missing, so the page still works,
just without movement.

- **`js/motion.js`: GSAP, for scroll entrances.** The hero types itself in line by line,
  section titles rise in, project cards arrive in a staggered batch, timeline spines draw
  downward, and the heatmap fills column by column. Everything is built inside one
  `gsap.matchMedia()` keyed on `prefers-reduced-motion`, so under reduced motion none of it
  runs. There is no scroll pinning, because pinning changes the page height, which both the
  scrollspy and the black hole measure.
- **`js/springs.js`: Motion, for pointer effects.** Cards lift and trail a spotlight under
  the mouse. The tag filter animates cards out and springs the rest into place (a FLIP
  animation). Hovering a tag highlights its projects, and the contribution stats count up.
  The filter itself is decided in `index.js`; `springs.js` only animates the result.
- **`js/blackhole.js`: the backdrop.** A character raster drawn with one `fillText` per row
  at 30 fps, over a field of stars that the hole bends as it passes them. The terminal's
  `blackhole` command turns it off.

---

## The terminal

Click `>_` in the bottom-right corner.
- **Keys:** `Tab` completes, `↑`/`↓` walk the history, `^C` cancels, `^L` clears, `Esc` closes.
- **Typos:** you get a "did you mean" suggestion.

| command | what it does |
|---|---|
| `help` | lists the commands |
| `whoami` / `about` | name, school and status |
| `skills` | the tech stack, read off the page |
| `projects [tag]` | the projects, optionally filtered by a tag (`Tab` completes it) |
| `education` | academic background |
| `contact` | every contact link |
| `contrib` | the GitHub heatmap, redrawn in ASCII |
| `goto <section>` | scrolls to `about`, `projects`, `organizing`, `background` or `top` |
| `lang [en\|th]` | switches the hero between English and Thai |
| `open <link>` | opens `github`, `linkedin`, `codeforces`, `instagram`, `facebook`, `line`, `discord` or an `email` draft |
| `game` | three games, all rigged so the house wins |
| `blackhole` | turns the backdrop off or on |
| `matrix` | four seconds of rain |
| `neofetch` | system info, such as it is |
| `cat` | meet the cat that used to be my avatar |
| `cowsay <text>` | the cat says it for you |
| `clear` / `exit` | clear the screen / close the panel |

A few more commands exist that `help` won't list.

**Adding a command takes one row.** `COMMANDS` in `js/index.js` is a table of
`{ name, args, help, run }` entries. `help`, tab completion and "did you mean" all read
from it. Rows marked `hidden: true` still run, but stay out of `help` and completion.

---

## Something hidden

Freyr is also the name of a Norse god. Hold the photo in the hero for a couple of seconds.
The praying-hands cursor is the hint.

Every lore line it shows is quoted from public-domain translations: the Prose Edda
(Brodeur, 1916) and the Poetic Edda (Bellows, 1923). The nickname uses the Viking Age
runestone spelling; everything else uses the usual modern letter-to-rune mapping, so it's
a gimmick rather than a historical spelling.

---

## Credits

- [GSAP](https://gsap.com/) 3.13.0 (with ScrollTrigger, CustomEase, CustomWiggle,
  Physics2D and ScrambleText) and [Motion](https://motion.dev/) 13.4.4, vendored under
  `js/vendor/`.
- Fonts from Google Fonts:
  - JetBrains Mono for headings, labels and the terminal.
  - IBM Plex Sans and IBM Plex Sans Thai for body text.
  - Noto Sans Runic for runes, loaded with only the glyphs used.
- The praying-hands cursor is the 🙏 from
  [Noto Color Emoji](https://github.com/googlefonts/noto-emoji) (Apache-2.0), saved as two
  32px PNGs.

## License

MIT
