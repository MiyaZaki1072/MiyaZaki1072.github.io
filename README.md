#  Personal Portfolio

A personal portfolio site built with vanilla HTML, CSS, and JavaScript.

---

## Features

- Profile picture switcher with a circular progress ring on hover
- Scramble text animation when switching languages
- Full Thai / English translation toggle
- Smooth scroll navigation with a fixed navbar
- Project showcase with hover overlays
- Education timeline
- Fully responsive — mobile, tablet, and desktop

---

## Project Structure

```
portfolio/
├── index.html          — page structure and content
├── style.css           — all styling and responsive breakpoints
├── index.js            — profile switcher and translation logic
└── images/
    ├── icon.png        — browser tab favicon
    ├── myface1.png     — profile photo (default)
    ├── myface2.png     — profile photo (alternate)
    └── MesosuemPic.png — project screenshot
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
