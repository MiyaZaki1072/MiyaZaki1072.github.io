# miyazaki1072.github.io

Personal site of **Thitiwut "Freyr" Sreewasut**, a Computer Engineering student at
Chulalongkorn University. Laid out as a TVA personnel record (Form PD-07):
form sheets, brass stamps and one green accent.

**[See it live →](https://miyazaki1072.github.io/)**

Plain HTML, CSS and JavaScript. No framework, no build step.

## What is on it

- **Overview:** the record's cover sheet, with my photo and status.
- **Personnel:** identity, academic and technical record. Click a skill tag to filter
  the projects by it.
- **Project Archives:** one exhibit per project, plus the GitHub contribution heatmap.
  The three featured projects show an animated diagram; click it to see the screenshot. Each project can link to a short devlog page in `projects/`.
- **Timeline:** education and experience.
- **Contact:** the communication terminal, with one cell per link.
- **Terminal:** click `>_` in the corner and type `help`. It has a small file system
  (`ls`, `cd`, `cat`, `tree`), themes, and a few Freyr commands (`sword`, `boar`, `alfheim`).
- **Hidden:** hold the photo, or type `freyr`, for rune mode.

## Run locally

Open `index.html` in a browser. For the GitHub heatmap, serve it over HTTP instead:

```bash
python -m http.server 8000
```

## Deploy

Pushing to `main` deploys to GitHub Pages through `.github/workflows/static.yml`.
The workflow also runs daily to refresh the contribution heatmap.

## Files

```
index.html                 the page
resume.pdf                 the résumé the print dialog downloads
projects/                  devlog pages, one per project
assets/
  css/style.css            all styling
  js/main.js               boot screen, navigation, project archive, skill filter,
                           lightbox, contribution calendar
  js/terminal.js           the >_ terminal, its games, and rune mode
  js/iso.js                isometric project diagrams and the boot-screen cabinet
  js/motion.js             sheet entrances and stamp thumps (IntersectionObserver)
  js/slip.js               the résumé print dialog
  images/                  portrait, favicon and social preview image
  images/projects/         project screenshots
  images/cat/              the terminal cat
data/contributions.json    GitHub heatmap data, written at deploy time
scripts/                   fetches that data (run by the deploy workflow)
```

Scripts load in this order: `motion.js`, `slip.js`, `iso.js`, `main.js`, `terminal.js`.
`terminal.js` uses `showToast()` from `main.js`, so keep `main.js` first.

## Adding a project

1. Add a screenshot to `assets/images/projects/` (a `.webp` about 800px wide).
2. Copy one `<article class="project-card">` in the Project Archives in `index.html`
   and change its text, tags, image and links.
3. For a devlog page, copy `projects/taskmaker.html` and link to it from the card.

Put your strongest projects first: the first exhibits are what a visitor sees first.

## Credits

Fonts from Google Fonts: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk),
[IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans),
[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono),
[JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) and
[Noto Sans Thai](https://fonts.google.com/noto/specimen/Noto+Sans+Thai).

## License

MIT
