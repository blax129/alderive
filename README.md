# Alderive Properties

Responsive English and Spanish rental application website with Netlify receipt storage.

## Run and test

- Install dependencies: `npm ci`
- Receipt and HTTP validation tests: `npm test`
- Static preview: `python3 -m http.server 8765`
- Browser QA (requires Playwright and its Chromium browser): `node tests/browser-qa.cjs` and `node tests/browser-flows.cjs` while the static preview runs. Set `CHROME_PATH` to use an installed Chrome executable. Results/screenshots are written to ignored `output/qa/`.

Browser tests intercept external services and never send real applications, emails, or payment screenshots. They cover screen widths 320, 390, 768, and 1440, English/Spanish routes, receipt states and printing, application/receipt storage failures, and verification text safety.

## Deploy

Import this repository into Netlify using `netlify.toml`. The receipt endpoint requires Netlify Functions and Netlify Blobs; GitHub Pages alone cannot run it. Set `OWNER_PASSWORD` in the Netlify environment before using `admin.html`. Keep it out of client code and Git.

Public client configuration for EmailJS and unsigned Cloudinary uploads is in `script.js`; the application email configuration is in `apply.html`. Formspree handles application and feedback delivery. Verify allowed domains, EmailJS templates/services, and the Cloudinary unsigned upload preset on the deployed domain.

## Verification limits

Local receipt/HTTP tests and mocked browser flows pass. A deployed URL and service access are still required to verify production Netlify storage, OWNER_PASSWORD configuration, Cloudinary uploads, Formspree delivery, and actual EmailJS delivery. No live applications or emails were sent by the tests.

Spanish home content is in `es.html`; application, payment, confirmation, receipt, verification, and admin screens share their translated content with English. Spanish redirect routes preserve query parameters.
