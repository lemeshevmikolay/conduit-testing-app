# Visual regression tests

The Cypress visual suite covers the home feed, sign-in, registration, article detail, editor, profile, favorites, and settings at desktop (`1280×720`), tablet (`768×720`), and mobile (`390×720`) viewports. It also captures feed loading, the signed-in account menu, and login validation at each size. Footer intro and resource-card layouts are captured at all three sizes, with the default and next QA-tip states captured on desktop.

API responses and dates are fixed by the test, and CSS motion is disabled before capture. Footer captures hide the route's `<main>` content in the test document so each image focuses on the footer rather than unrelated page height or scroll position. The capture uses a local system font stack because Google Fonts load inconsistently in headless runs; font-family choice is excluded while font size, line height, wrapping, and geometry remain tested. Ionicons glyphs are omitted because their third-party CDN font is also inconsistent. Screenshots are compared with `pixelmatch`; differences above `0.1%` fail the run. Override the threshold with `VISUAL_DIFF_THRESHOLD` when a browser environment has known rendering variance.

Run comparisons with:

```sh
npm run test:visual
```

Baselines live in `tests/visual/baselines/`. Actual screenshots, pixel difference images, `report.json`, and an HTML report linking baseline, actual, and difference images are written to `.tmp/visual/`.

Refresh baselines only after reviewing the report and deciding that the changed appearance is expected:

```sh
npm run test:visual:baseline
```

The standard visual test command never writes baseline images.
