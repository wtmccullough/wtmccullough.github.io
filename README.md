# wtmccullough.github.io

Personal portfolio site for Will McCullough: policy data analysis for campaigns, public offices, and advocacy organizations.

Plain HTML/CSS/JS, no build step. GitHub Pages serves it from `main`.

- `index.html`: all page content
- `styles.css`: design tokens, layout, and the scroll-driven ballot animations
- `script.js`: contact form handling and a scroll-spy fallback for browsers without `animation-timeline`
- `assets/docs/`: PDFs linked from the page
- `assets/img/`: project figures

## Contact form

The form posts to Formspree (form ID `xgaognld`, set in the `action` attribute in `index.html`). Submissions are emailed to the address on the Formspree account and kept in the Formspree dashboard. `script.js` sends the form in the background and shows the result in place; without JavaScript the form posts directly and Formspree shows its own confirmation page.

## Local preview

    python3 -m http.server 8000

Then open http://localhost:8000.
