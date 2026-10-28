# miyazaki1072.github.io

Personal site of **Thitiwut "Freyr" Sreewasut**, a Computer Engineering student at
Chulalongkorn University. Named for the Norse god, and dressed like it: runes,
carved wood and one green accent.

**[See it live →](https://miyazaki1072.github.io/)**

Plain HTML, CSS and JavaScript. No framework, no build step.

## What is on it

- **Hero:** photo, links, skills, and three highlights (TOI, NSC2024, Kit2Code), all in the first screen.
- **Quote:** one line from me, between two rows of runes that spell it out.
- **Projects:** a bookshelf. Click a book and it lifts off the shelf and opens to the details.
  Each project can link to a short devlog page in `projects/`.
- **Organizing:** Kit2Code, the contest group I founded, and its contests.
- **Background:** education and experience as a path of rune stones.
- **Contact:** a mead hall bar with one cup per link.
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
index.html       the page
projects/        devlog pages for the projects
style.css        all styling
js/index.js      page logic: terminal, rune mode, EN/TH, heatmap
js/motion.js     scroll entrances and the nav highlight (GSAP)
js/springs.js    hover springs (Motion)
js/shelf.js      the bookshelf: opening and closing a book
js/vendor/       GSAP and Motion, kept in the repo so the site runs offline
images/          photos and screenshots
scripts/         fetches GitHub contribution data at deploy time
```

## Adding a project

1. Add a screenshot to `images/` (a `.webp` about 800px wide).
2. Copy one `<article class="project-card book">` in the shelf in `index.html`
   and change its text, tags, image and links.
3. For a devlog page, copy `projects/taskmaker.html` and link to it from the card.

The shelf holds four books in one row. A fifth needs the shelf to scroll sideways.

## Credits

[GSAP](https://gsap.com/) and [Motion](https://motion.dev/). Fonts from Google Fonts:
[Almendra](https://fonts.google.com/specimen/Almendra) for headings and
[Noto Sans Runic](https://fonts.google.com/noto/specimen/Noto+Sans+Runic) for the runes.
The 🙏 cursor is from [Noto Color Emoji](https://github.com/googlefonts/noto-emoji) (Apache-2.0).

## License

MIT
