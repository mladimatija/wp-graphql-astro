# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mladimatija/wp-graphql-astro/releases/tag/v1.0.0
