# Template sources

Files in this directory are processed by `src/scripts/process-templates.js`
during `npm run build:branding` (which runs as part of `prebuild` /
`predev` / `prepreview`).

Placeholders like `${APP_NAME}` and `${APP_DESCRIPTION}` get substituted with
values from `src/lib/constants.json`, and the result is written to its
canonical location (`public/offline.html`, `src/content/config/seo.md`).

The generated outputs are gitignored - edit these template sources instead.
