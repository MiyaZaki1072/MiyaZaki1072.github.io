# Personal Portfolio

A personal portfolio site built with vanilla HTML, CSS, and JavaScript.

---

## Features

- Profile picture switcher with a circular progress ring on hover
- Scramble text animation when switching languages
- Full Thai / English translation toggle
- Smooth scroll navigation with a fixed navbar
- Project showcase with tag filtering and hover overlays
- Background section with an Education / Experience timeline toggle and photo lightbox
- Interactive terminal widget (`help`, `whoami`, `skills`, `projects [tag]`, `education`, `contact`, `game`, `clear`)
- Fully responsive — mobile, tablet, and desktop

---

## Project Structure

```
portfolio/
├── index.html          — page structure and content
├── style.css           — all styling and responsive breakpoints
├── index.js            — profile switcher, translation, timeline, and terminal logic
└── images/
    ├── icon.png             — browser tab favicon
    ├── myface1.png          — profile photo (default)
    ├── myface2.png          — profile photo (alternate)
    ├── MesosuemPic.png      — project screenshot
    ├── SeriesTracker.png    — project screenshot
    ├── catimage.png         — terminal easter egg asset
    ├── cat-terminal.png     — terminal easter egg asset
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

## Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, grid, flexbox, keyframe animations
- **Vanilla JavaScript** — no dependencies, no frameworks
- **Google Fonts** — JetBrains Mono, IBM Plex Sans Thai

---

## License

MIT
