# Debug scripts

Ad-hoc scripts for poking at the WordPress GraphQL endpoint and the local API
routes. They read auth from `.env` and are not part of the build.

- `test-manifest.js` - fire a raw GraphQL request at `WORDPRESS_API_URL` to
  check connectivity and auth.
- `test-api-route.js` - boot the Astro dev server and hit `/api/manifest.json`
  end-to-end.

Run from the repo root:

```bash
node scripts/debug/test-manifest.js
node scripts/debug/test-api-route.js
```
