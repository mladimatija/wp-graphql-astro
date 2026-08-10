# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2026-08-10

Two framework majors (Astro 7, ESLint 10), a Web Vitals correctness fix for
client-side routing, and a rebuilt CI security gate.

### Added

- `scripts/audit-ci.js` and the `audit:ci` npm script — a CI security gate that runs `npm audit --omit=dev` against an explicit advisory allowlist. Each entry carries a reason and an expiry date, and an expired entry fails the build, so an advisory with no upstream patch can be documented and revisited instead of silencing the audit wholesale or downgrading the dependency that pulls it in
- `reportSoftNavs` Web Vitals reporting (opt-in as of web-vitals v6), so metrics are collected on every `<ClientRouter />` navigation rather than only the initial page load
- `EXPECTED_METRIC_COUNT` / `METRICS_TIMEOUT_MS` constants and a `getMetricPath()` helper in `src/lib/webVitals.ts`
- Dependabot `ignore` rules for `eslint-plugin-astro` and `astro-eslint-parser`, both held at 1.x, so it stops opening weekly PRs that cannot pass CI

### Changed

- Migrated to Astro 7 — `astro` 6.3.5 → 7.2.0, `@astrojs/netlify` 7 → 8, `@astrojs/react` 5 → 6, and the `vite` override 7.3.2 → 8.0.13
- Migrated to ESLint 10 — `eslint` 9.39.4 → 10.8.1 and `@eslint/js` 9 → 10; `eslint.config.js` required no changes
- `web-vitals` 5 → 6; `src/lib/webVitals.ts` now uses the library's `MetricType` and `ReportOpts` types instead of untyped callback parameters
- Web Vitals metrics attribute to the path in `metric.navigationURL` rather than `window.location.pathname`, which is unreliable once a metric can arrive after the visitor has navigated away
- `getWebVitalsMetrics()` counts distinct metric names instead of callback invocations, and resolves on a 5s deadline as well as on completion
- CI's `npm audit --production` step replaced by `npm run audit:ci` (also drops the flag npm has deprecated in favour of `--omit=dev`)
- `overrides` pruned from 12 entries to 3 (`sharp`, `vite`, and an `eslint-plugin-import` → `eslint` peer fix)
- `actions/checkout` and `actions/setup-node` 6 → 7
- Dependency bumps: `react` / `react-dom` 19.2.6 → 19.2.8, `tailwindcss` and `@tailwindcss/vite` 4.3.0 → 4.3.3, `@testing-library/jest-dom` 6 → 7, `postcss-html` 1 → 2, `vitest` 4.1.6 → 4.1.10, `typescript-eslint` 8.59.4 → 8.66.0, `stylelint` 17.11.1 → 17.14.1, `prettier` 3.8.3 → 3.9.6, `@astrojs/sitemap` 3.7.2 → 3.7.3, `@fortawesome/*` 7.2.0 → 7.3.1, plus commitlint, postcss, cssnano, globals, lint-staged and autoprefixer patch bumps
- Regenerated service worker; cache keys move to `matijaculjak-com-*-v20260810`

### Fixed

- Web Vitals are now reported across soft navigations. With `<ClientRouter />` handling most navigations, only the first page of a session was ever measured
- `getWebVitalsMetrics()` no longer resolves with a partial result. It decremented a counter per callback, but CLS fires repeatedly as shifts accumulate and every metric re-reports per soft navigation, so five invocations did not mean five distinct metrics. It also had no deadline, so it could never settle when INP never arrived (no interaction) — it now resolves with whatever it has after 5s

### Removed

- `eslint-plugin-react` — declared in `devDependencies` but never imported by `eslint.config.js` and referenced nowhere else. Its `eslint ^9.7` peer cap made it look like a hard ESLint 10 blocker; it was dead weight
- 8 `overrides` entries verified to have no effect on resolution: `lodash` and `uuid` (no longer in the dependency tree at all), `yaml`, the four `@opentelemetry/*` entries, and the scoped `esbuild` overrides under `@netlify/edge-bundler` and `@netlify/zip-it-and-ship-it`. All now resolve at or above their floors naturally — removing them left `package-lock.json` byte-identical

### Security

- `sharp` held at `>=0.35.0` via `overrides`. `@netlify/images` → `ipx` declares `sharp: ^0.34.3`, which resolves to a build inheriting libvips CVE-2026-33327, CVE-2026-33328, CVE-2026-35590 and CVE-2026-35591
- CI now fails on any production advisory except two allowlisted `image-size` DoS advisories, GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq. Neither has a patched release at any version, and neither is reachable here: the only import sits in `@netlify/dev-utils`'s test helpers, and `@netlify/blobs` imports just `HTTPServer` from that module. The allowlist entries expire 2026-11-30

### Documentation

- `ESLINT.md` recording the ESLint 10 migration, why `eslint-plugin-astro` and `astro-eslint-parser` are pinned, and a watch list of upstream signals that unblock each pin
- README points at `ESLINT.md` from the linting section

### Known limitations

- `.astro` files are not linted by ESLint. `astro-eslint-parser@1.4.0` depends on the old Go `@astrojs/compiler`, while Astro 7 moved to the Rust compiler, so parsing fails on every `.astro` file. The fix needs `astro-eslint-parser@3.x`, which is gated behind `eslint-plugin-astro@3.x` and an unsatisfiable `eslint-plugin-jsx-a11y` peer set. CSS inside `.astro` files is still linted by Stylelint

## [1.4.0] - 2026-05-19

### Added

- `getTopLevelTaxonomies()` GraphQL helper that returns category and tag slugs with post counts in a single round-trip (replaces N+1 `getNodeByURI` calls in `[slug]/page/[page]` static-path generation)
- `node` prop on `MainLayout` and `Footer` so the resolved WordPress node is passed down from each page instead of being re-fetched per component
- `src/templates/` directory for build-time template sources (`offline.html`, `seo.md`); generated outputs are now gitignored and regenerated on every build
- `predev` and `prepreview` npm scripts so branding-generated files always exist before Astro starts
- `MANIFEST_LOGO_SEARCH` environment variable to parametrize the PWA manifest media lookup (replaces a hardcoded site-specific search term in `fix-manifest.js`)
- `public/robots.txt`
- `scripts/debug/` directory housing the relocated WordPress / API connectivity scripts plus a README
- Service worker `SW_SET_DEBUG` postMessage hook for toggling debug logging from a client page

### Changed

- `getNodeByURI` no longer hardcodes `bypassCache = true`; the in-memory cache TTL governs freshness for build and runtime alike
- Per-taxonomy paginated routes (`category/[slug]/page/[page]`, `tag/[slug]/page/[page]`, `[slug]/page/[page]`) now use real post counts to generate only the pages that actually exist, instead of a fixed 1..5 sweep
- `Pagination` computes its own `lastPage` defensively and suppresses "Next" on the final page (was reading a hardcoded `lastPage: 10` placeholder)
- `PostCard` strips HTML before slicing the excerpt so the preview isn't dominated by raw markup
- `PostMeta` server-renders dates in deterministic `en-US` long form and rehydrates the date to the visitor's locale via a small client script
- `Navigation` matches the active link using a normalized `Astro.url.pathname` check (handles trailing slashes; no longer relies on a brittle substring match against `Astro.params.uri`)
- `index.astro` fetches `readingSettingsPostsPerPage` so the homepage page-size and pagination math agree with `/page/2/`
- `process-templates.js` reads from `src/templates/` and writes to canonical (gitignored) locations instead of mutating source-controlled files
- `netlify.toml` runs `npm run build` so `build:branding`, `fix-manifest`, and `generate-service-worker` execute in CI
- `lint:js` covers root-level `*.js` and `scripts/**` in addition to `src/**`
- `postcss.config.cjs` gates `cssnano` on `NODE_ENV === "production"` so dev HMR isn't slowed by minification
- `.nvmrc` pinned to `v24` (LTS) instead of `v25.2.1`
- README Node and Astro badges read versions live from npm so they don't drift
- `test-manifest.js` and `test-api-route.js` moved to `scripts/debug/`; the originals at the repo root are stubs that print "MOVED" and exit non-zero

### Fixed

- `/api/revalidate` and `/api/manifest.json` ship as real server functions (`export const prerender = false`); with `output: "static"` they were previously prerendered, so the revalidate POST handler was never deployed
- Service worker no longer calls `localStorage.getItem` — unavailable in worker scope, it threw a `ReferenceError` and aborted SW activation in non-dev origins
- Eliminated three duplicate `getNodeByURI` calls per page render (page + `MainLayout` + `Footer` now share a single fetch)
- Removed `Astro.redirect("/404")` from every prerendered route; it produced an HTML meta-refresh under `output: "static"` instead of a real 404. Unknown URIs are filtered upstream in `getStaticPaths`; the residual edge case sets `Astro.response.status = 404` with an inline fallback
- `Header` demotes the homepage tagline from `<h1>` to `<h2>` so the page has a single top-level heading (the logo `<h1>` stays)
- `Navigation` guards against an empty primary menu so `menus.nodes[0]` doesn't throw
- `MainLayout` no longer emits an empty `<title>` after `<SEO />` (was producing two `<title>` elements)
- Removed the silently-ignored `viewTransitions` block from `astro.config.mjs` (View Transitions are configured by `<ClientRouter />` in `MainLayout`)

### Removed

- Unused `NewsletterSignup` content-collection component (no importers; the previous body destructured `component.data.data` incorrectly and would have thrown if used)

### Documentation

- `src/templates/README.md` documenting the new template sources
- `scripts/debug/README.md` for the relocated debug scripts

## [1.3.0] - 2026-03-12

### Added

- `centered` prop on `PostMeta` to apply `justify-center` only on single post template

### Changed

- Migrated to Astro 6.0 with Content Layer API, Zod 4, and Vite 7
- Updated content collections to use `glob()` loaders and `astro/zod`
- Replaced `entry.slug` with `entry.id` and `page.render()` with `render(page)`
- Removed `manualChunks` for Astro 6 / Vite 7 compatibility
- Standardized error logging to use template literals across api, fix-manifest, revalidate, Web Vitals, and service worker scripts
- Regenerated web app manifest and service worker

## [1.2.0] - 2026-03-09

### Added

- JSON-LD structured data for posts and breadcrumbs
- Fetch timeout and retry handling for WordPress API requests
- Pagination support for `getAllUris`
- Fallback banner when cached settings or navigation data is shown
- Expanded test coverage for API error paths, `getAllUris`, and revalidation flows

### Changed

- Migrated more component styling to Tailwind utilities and shared design tokens
- Consolidated shared constants into `constants.json` as a single source of truth
- Refined single post, navigation, footer, pagination, and related UI styling
- Updated project docs for environment setup, Node engine requirements, required WordPress plugins, and styling architecture
- Updated the declared Node.js version requirement in `package.json`
- Upgraded dependencies and migrated related tooling and config files
- Updated header intro copy
- Stopped rendering the post modified datetime
- Bumped the package version to `1.2.0`
- Marked the package as publishable by setting `private` to `false`
- Regenerated the web app manifest
- Refreshed generated service worker cache names and build timestamp

### Fixed

- Improved navigation accessibility and burger icon alignment
- Return a 404 page when a WordPress node is missing
- Improved stale-cache behavior for settings and navigation fallbacks
- Fixed 404 image handling, revalidate build hook setup, and Astro site environment usage
- Switched newsletter signup to Netlify Forms and removed service worker sync to unavailable APIs

### Security

- Documented `REVALIDATE_TOKEN`
- Added rate limiting for the revalidation endpoint
- Avoided logging secrets in revalidation flows

### Documentation

- Bumped LICENSE copyright to 2026

## [1.1.0] - 2025-12-05

### Added

- GitHub Actions CI/CD pipeline for automated testing and building
- GitHub Actions dependency review workflow for security scanning
- Pull request template for standardized PR descriptions
- EditorConfig for consistent coding styles across editors
- Prettier configuration file (.prettierrc) with Astro plugin support
- Husky for automated git hooks
- lint-staged for running linters on staged files only
- commitlint for enforcing conventional commit messages
- Status badges in README (CI, License, Node version, Astro version)
- CSS custom properties in variables.css
- Native CSS stylesheets (styles.css, view-transitions.css)
- Netlify reCAPTCHA integration to contact form
- .nvmrc file for Node.js version specification

### Changed

- Migrated from SCSS to native CSS
- Removed sass, postcss-scss, and stylelint-config-recommended-scss dependencies
- Converted all SCSS variables to CSS custom properties
- Updated all components to use standard CSS instead of SCSS
- Updated README with comprehensive badges and improved formatting
- Upgraded all dependencies to latest versions:
  - Astro 5.16
  - React 19.2
  - FontAwesome v7
  - Vitest v4
  - Web Vitals v5
- Applied Prettier formatting across the entire codebase

### Fixed

- Pagination now fetches all posts for correct page count generation

### Removed

- SCSS preprocessor and related dependencies (sass, postcss-scss, stylelint-config-recommended-scss)
- SCSS files (variables.scss, rem.scss, view-transitions.scss, styles.scss)

## [1.0.0] - 2025-12-04

### Added

- Static site generation with Astro
- WordPress headless CMS integration via GraphQL
- Dark mode support (respects system preferences)
- SEO metadata control
- Dynamic routing for WordPress content
- PWA support with service worker
- Web Vitals monitoring
- Comprehensive test suite (46 tests)
- Contact form with spam protection
- Post pagination
- Featured images support
- Author information display
- View Transitions API support

### Changed

- Switched to static site generation
- Updated CSS color syntax to modern format
- Switched logo from PNG to SVG

[unreleased]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mladimatija/wp-graphql-astro/releases/tag/v1.0.0
