# miyazaki1072.github.io

Personal site of **Thitiwut "Freyr" Sreewasut**, Computer Engineering student at
Chulalongkorn University.

**[See it live →](https://miyazaki1072.github.io/)**

Plain HTML, CSS and JavaScript. No framework, no build step.

## Run locally

Open `index.html` in a browser, or start a local server (needed for the GitHub heatmap):

```bash
python -m http.server 8000
```

## Deploy

Pushing to `main` deploys to GitHub Pages via `.github/workflows/static.yml`.
The workflow also runs daily to refresh the contribution heatmap.

## Files

```
index.html     the page
projects/      project case studies
style.css      all styling
js/            page logic, animations, vendored GSAP + Motion
images/        photos and screenshots
scripts/       fetches GitHub contribution data at deploy time
```

Tip: click `>_` in the corner for a terminal, and type `help`.

## Credits

[GSAP](https://gsap.com/), [Motion](https://motion.dev/), and the 🙏 cursor from
[Noto Color Emoji](https://github.com/googlefonts/noto-emoji) (Apache-2.0).

## License

MIT
