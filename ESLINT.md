# ESLint 10 Migration

Migrated 2026-08-10, from ESLint 9.39.5 to 10.8.1.

`eslint.config.js` required **no changes**. The work was entirely in
`package.json`: two version bumps, one removal, and one peer override.

## What changed

```jsonc
// devDependencies
"eslint":      "^9.39.5"  ->  "^10.8.1"
"@eslint/js":  "^9.39.4"  ->  "^10.0.1"
"eslint-plugin-react": "^7.37.4"  ->  removed

// overrides
"eslint-plugin-import": { "eslint": "^10.0.0" }
```

`typescript-eslint`, `eslint-plugin-astro`, `astro-eslint-parser` and `globals`
were left untouched.

Net lockfile effect was a cleanup: 7 packages upgraded, 4 added, 36 removed.
Dropping `eslint-plugin-react` took `prop-types`, `jsx-ast-utils`,
`es-iterator-helpers` and friends with it; ESLint 10 removing eslintrc support
dropped `@eslint/eslintrc` and its `ajv` / `minimatch` subtree.

## Why each decision

### `eslint-plugin-react` was removed, not upgraded

It was declared in `devDependencies` but never imported by `eslint.config.js`
and referenced nowhere else in the repo. Its peer range caps at `eslint ^9.7`,
so it _looked_ like a hard blocker — but it was dead weight. Deleting it removed
the blocker for free.

If React-specific linting is wanted later, add it back only once it supports
ESLint 10, and actually wire it into `eslint.config.js`.

### `eslint-plugin-import` is overridden, not replaced

Version 2.32.0 is the latest release and still declares:

```
"eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9"
```

That cap is **stale metadata, not a functional incompatibility**. Verified by
installing it against ESLint 10 and running the project's real config over
`src/**/*.{js,ts}`: clean, exit 0. The `overrides` entry exists purely to stop
npm failing the install with `ERESOLVE`.

**Caveat:** the override silences npm's only warning signal here. If a future
`eslint@10.x` release changes rule APIs, it will surface as a lint crash rather
than an install error. Preferred exit, in order:

1. Upstream ships ESLint 10 support — then drop the override entirely.
2. Migrate to `eslint-plugin-import-x` (see below).

### `eslint-plugin-import-x` was evaluated and deferred

The maintained fork explicitly supports `eslint ^10.0.0`. It is **not** a
drop-in. Migrating it requires:

- Rewriting `settings["import/resolver"]`. The fork's Rust resolver rejects the
  current `node.alias` object shape with
  `Failed to get Array length on NapiResolveOptions.alias`.
- Renaming the rule prefix throughout `eslint.config.js` (`import/*` ->
  `import-x/*`).
- Renaming two inline directives:
  - `src/scripts/process-templates.js:17`
  - `src/scripts/generate-service-worker.js:14`

Worth doing eventually, but it is a separate migration and was not a
prerequisite for ESLint 10.

## Pinned dependencies — do not bump

### `eslint-plugin-astro` (held at 1.7.0) and `astro-eslint-parser` (held at 1.4.0)

Versions 2.x and 3.x of `eslint-plugin-astro` declare peers:

```
"eslint": ">=10.0.0",
"eslint-plugin-jsx-a11y": ">=6.10.2",
"@typescript-eslint/parser": ">=8.61.0"
```

But `eslint-plugin-jsx-a11y`'s **latest** release _is_ 6.10.2, and it caps at
`eslint ^9`. So the plugin demands a companion that does not support the ESLint
version the plugin itself demands. This is an unsatisfiable peer set — npm fails
with `ERESOLVE`. No lockfile refresh or `--legacy-peer-deps` workaround makes
this correct; it needs an upstream release.

`astro-eslint-parser` is pinned for the same reason: 3.0.0 is pulled in by
`eslint-plugin-astro@3.x`, which is blocked.

Both are listed under `ignore` in `.github/dependabot.yml` so Dependabot does
not open PRs that fail CI every week.

### Second, independent gate: Node

`eslint-plugin-astro@3.1.0` declares:

```
"engines": { "node": "^22.22.3 || ^24.16.0 || >=26.3.0" }
```

That range **excludes the Node 25 line**, which is what this project runs both
locally and in CI (`.github/workflows/ci.yml` -> `node-version: [25.x]`). Even
once jsx-a11y unblocks, moving to `eslint-plugin-astro@3.x` will also require
Node 26, or dropping back to Node 24 LTS.

## Known limitation: `.astro` files are not linted

This predates the ESLint 10 migration and is unaffected by it. Two independent
causes:

1. **The glob doesn't include them.** `lint:js` runs
   `eslint "src/**/*.{js,ts}" "*.js" "scripts/**/*.{js,ts}"` — no `.astro`
   pattern. The entire `astro` block in `eslint.config.js` is therefore dead
   configuration.
2. **The parser can't read them.** Running `npx eslint src/pages/index.astro`
   directly fails with `1:2 Parsing error: Expression expected` on every
   `.astro` file. `astro-eslint-parser@1.4.0` depends on the old Go compiler
   (`@astrojs/compiler ^2 || ^3`), but Astro 7 moved to the Rust compiler.

Fixing #2 requires `astro-eslint-parser@3.x` (which uses
`@astrojs/compiler-rs`), and that is gated behind the jsx-a11y deadlock above.
Fix #1 only after #2, or the lint script will start failing.

CSS inside `.astro` files _is_ still linted, by Stylelint via `lint:css`.

## Watch list

| Signal                                           | Unblocks                                                |
| ------------------------------------------------ | ------------------------------------------------------- |
| `eslint-plugin-jsx-a11y` ships ESLint 10 support | `eslint-plugin-astro@3.x`, and with it `.astro` linting |
| `eslint-plugin-import` ships ESLint 10 support   | Removing the `overrides` entry                          |
| Moving off Node 25 (to 24 LTS or 26+)            | The other half of the `eslint-plugin-astro@3.x` upgrade |

## ESLint 10 breaking changes relevant to this repo

Compliance was verified before migrating:

- **Node**: requires `^20.19.0 || ^22.13.0 || >=24`. `package.json` declares
  `>=24` and CI runs 25.x. Satisfied.
- **eslintrc removed**: no `.eslintrc*` files exist; already on flat config.
- **`eslint-env` comments now error**: none present in the codebase.
- **Three rules added to `eslint:recommended`** — `no-unassigned-vars`,
  `no-useless-assignment`, `preserve-caught-error`. Currently zero violations.
  New code can trip them; `preserve-caught-error` in particular wants
  `{ cause }` when rethrowing inside a `catch`.
- **Config lookup changed** to resolve upward from each linted file's directory.
  This matters because `lint-staged` passes absolute paths — verified working
  via the `.husky/pre-commit` path with `--fix`.
- Not applicable here, but removed in v10: `FlatESLint` / `LegacyESLint`
  classes, `context.getCwd()` / `getFilename()`, several `SourceCode` methods.

## Verification performed

- `npm install` resolves with no `ERESOLVE` and no peer warnings.
- `npm ls eslint` shows every consumer deduped onto a single `eslint@10.8.1`,
  with no stray v9 in the tree.
- `npm run lint` passes (`lint:css` and `lint:js`), exit 0.
- `npm test` — 60/60 passing.
- `lint-staged`'s absolute-path `eslint --fix` invocation passes and produces no
  source changes.
