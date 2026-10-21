# wtmccullough.github.io

Personal portfolio site for Will McCullough: policy data analysis for campaigns, public offices, and advocacy organizations.

Plain HTML/CSS/JS, no build step. GitHub Pages serves it from `main`.

- `index.html`: all page content
- `styles.css`: design tokens, layout, and the scroll-driven ballot animations
- `script.js`: contact form handling and a scroll-spy fallback for browsers without `animation-timeline`
- `assets/docs/`: PDFs linked from the page
- `assets/img/`: project figures

## Contact form

The form posts to Formspree. To turn it on, create a form at formspree.io and replace `YOUR_FORM_ID` in `index.html` with the form's ID. Until then, the submit button is disabled and the form points visitors to LinkedIn.

## Local preview

    python3 -m http.server 8000

Then open http://localhost:8000.
