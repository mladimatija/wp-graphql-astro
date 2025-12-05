# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/mladimatija/wp-graphql-astro/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mladimatija/wp-graphql-astro/releases/tag/v1.0.0
