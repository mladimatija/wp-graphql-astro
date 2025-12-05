# Headless WordPress with Astro and GraphQL

A headless WordPress site built with [Astro](https://astro.build/) and GraphQL. Fast, modern, and fully static.

## What's Inside

- Static site generation with Astro
- WordPress as a headless CMS via GraphQL
- Dark mode (respects system preferences)
- SEO metadata control
- Dynamic routing for WordPress content
- Image optimization and lazy loading
- View Transitions for smooth page changes
- PWA support with offline mode
- TypeScript for type safety
- Content Collections for local/hybrid content
- Accessibility utilities
- React components where needed
- Web Vitals performance monitoring
- Test suite powered by Vitest

## Requirements

### WordPress Setup

You'll need these WordPress plugins:

- [WPGraphQL](https://www.wpgraphql.com/docs/introduction) - GraphQL API for WordPress
- [Total Counts for WPGraphQL](https://github.com/builtbycactus/total-counts-for-wp-graphql) - Post count support
- [WPGraphQL Next-Previous Post](https://github.com/valu-digital/wp-graphql-next-previous-post) - Post navigation
- [JAMstack Deployments](https://github.com/crgeary/wp-jamstack-deployments) (optional) - Trigger rebuilds from WordPress

Pagination uses WPGraphQL's built-in cursor-based system.

### Environment Variables

Create a `.env` file with:

```env
WORDPRESS_API_URL=https://yoursitename.com/graphql
PUBLIC_DISQUS_EMBED_URL=https://siteid.disqus.com/embed.js
PUBLIC_X_SHARE_USER=your_x_handle
PUBLIC_SITE_URL=https://yoursitename.com
PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/collect # Optional - for Web Vitals data
PUBLIC_DEBUG=true # Optional - enable verbose logging in development
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # UI components
│   ├── __tests__/     # Component tests
│   ├── client/        # Client-side only components
│   ├── content-collections/ # Components for local content
│   ├── react/         # React components
│   ├── templates/     # Content type templates
├── content/           # Content collections
│   ├── authors/       # Author information
│   ├── components/    # Reusable content components
│   ├── config/        # Site configuration files
│   └── pages/         # Local markdown pages
├── layouts/           # Main layout wrappers
├── lib/               # Utilities and API functions
│   └── __tests__/     # API and utility tests
├── pages/             # Astro pages and routes
│   ├── api/           # API endpoints
│   ├── local/         # Local content routes
│   └── page/          # Pagination handling
└── styles/            # CSS styles
    ├── variables.css       # CSS custom properties
    ├── view-transitions.css # View Transitions API
    └── styles.css          # Main stylesheet
```

## Routing and Templates

The `[...uri].astro` component handles WordPress route paths with static pre-rendering:

1. At build time, `getAllUris` generates static paths for all content
2. For each path, the `[...uri].astro` component captures the URI
3. `getNodeByURI` fetches data from WordPress GraphQL
4. Content type is determined (Post, Page, Category, etc.)
5. The appropriate template is rendered
6. For categories and tags, pagination routes are also pre-generated

To add support for custom post types:

1. Add a GraphQL fragment for your post type in `api.ts`
2. Create a template component in the `templates` directory
3. Add a case to the switch statement in `[...uri].astro`

## Configuration

### Global Configuration

Settings are stored in `src/content/config/seo.md`:

```md
---
defaultTitle: "WP GraphQL Astro"
titleTemplate: "%s | WP GraphQL Astro"
description: "A modern headless WordPress implementation using Astro and GraphQL"
siteUrl: "https://wp-graphql-astro.netlify.app"
ogImage: "/images/og-image.jpg"
xHandle: "@wpgraphql"
xCardType: "summary_large_image"
showFeaturedImages: true
showFeaturedImagesOnPostCard: true
---
```

### Available Configuration Options

| Option                         | Type    | Description                                |
| ------------------------------ | ------- | ------------------------------------------ |
| `defaultTitle`                 | string  | Default page title                         |
| `titleTemplate`                | string  | Format for page titles                     |
| `description`                  | string  | Default meta description                   |
| `siteUrl`                      | string  | Base URL of the website                    |
| `ogImage`                      | string  | Default Open Graph image                   |
| `xHandle`                      | string  | X handle for cards                         |
| `xCardType`                    | string  | X card format                              |
| `showFeaturedImages`           | boolean | Show featured images on single posts/pages |
| `showFeaturedImagesOnPostCard` | boolean | Show featured images on post listings      |

## Pagination

Uses WPGraphQL's cursor-based pagination with `first` and `after` parameters:

```graphql
posts(first: $first, after: $after)
```

Category archives and complex scenarios fetch cursors on-demand to jump to specific pages.

## Data Fetching

### WordPress GraphQL API

Data fetching is centralized in `src/lib/api.ts` with key functions:

- `getNodeByURI`: Fetches content based on URI
- `getAllUris`: Used for static path generation
- `getPosts`/`getPostsByCategory`: Fetch post collections
- `settingsQuery`/`navQuery`: Fetch site settings and navigation

### Astro Content Collections

Local content lives in Content Collections:

- `pages` - Local markdown pages
- `authors` - Author info
- `components` - Reusable content bits

## Styling

- **variables.css** - CSS custom properties for theming
- **styles.css** - Main stylesheet
- **view-transitions.css** - View Transitions API support

## Deployment

Configured for Netlify out of the box:

1. Connect your repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables
5. Deploy

Works on other platforms too:

- **Vercel** - Swap in the Vercel adapter
- **Cloudflare** - Use the Cloudflare adapter
- **Node.js** - Use the Node adapter
- **Static hosting** - The build outputs plain HTML you can host anywhere

## Development Workflow

- Development: `npm run dev`
- Format code: `npm run format`
- Lint code: `npm run lint`
- Build: `npm run build`

## Testing

Tests run with Vitest:

```bash
# Run all Vitest tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Key test files:

- `/src/components/__tests__/` - Component tests
- `/src/lib/__tests__/` - API and utility tests

## Web Vitals Monitoring

Track Core Web Vitals in real-time:

- **Largest Contentful Paint (LCP)** - Loading performance
- **Cumulative Layout Shift (CLS)** - Visual stability
- **First Contentful Paint (FCP)** - When content first appears
- **Time to First Byte (TTFB)** - Server response time
- **Interaction to Next Paint (INP)** - Input responsiveness (replaces FID in web-vitals v5)

Enable monitoring with the `showWebVitals` prop:

```astro
---
import MainLayout from "../layouts/MainLayout.astro";
---

<MainLayout showWebVitals={true}>
  <!-- Page content -->
</MainLayout>
```

Metrics show up in a toggleable floating panel. It's on by default in dev mode.

The monitor shows color-coded ratings (good, needs improvement, poor) and adapts to your current theme.

## Logging

Centralized logging across the app:

- **Server/API** - `log` utility from `src/lib/constants.ts`
- **Client-Side** - `clientLog` in Astro components
- **Service Worker** - `swLog` for service worker context

Logs show in dev by default, hidden in production unless you set `PUBLIC_DEBUG=true`. Errors always show regardless of environment.

### Usage Examples

```typescript
// Server/API context
import { log } from "../lib/constants";
log.debug("Detailed information for debugging");
log.info("General information about operation");
log.warn("Warning that might need attention");
log.error("Critical error that requires action");

// Client-side context (in .astro files)
const clientLog = {
  debug: (msg) => isDev && console.log("[CLIENT DEBUG]", msg),
  info: (msg) => isDev && console.log("[CLIENT INFO]", msg),
  error: (msg, err) => console.error("[CLIENT ERROR]", msg, err || ""),
};

// Service worker context
swLog.info("Service worker information");
swLog.error("Service worker error", errorObject);
```

### Sending Data to Analytics

Add your analytics endpoint to `.env`:

```env
PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-service.com/collect
```

For production, set this in your deployment platform (Netlify dashboard, Vercel settings, etc.).

Customize the payload in `src/lib/webVitals.ts` if needed. Data gets sent via `navigator.sendBeacon()` with a `fetch()` fallback.

## PWA Configuration

The site supports Progressive Web App (PWA) capabilities with a dynamic manifest.json generator.

### PWA Manifest Generation

This project uses a build-time manifest generation approach for its Progressive Web App features:

1. The manifest.json is generated during the build process using data from WordPress (specifically looking for logo images)
2. The `fix-manifest.js` script fetches site data from WordPress GraphQL API
3. The generated manifest is placed in both `public/` and `dist/` directories
4. The service worker includes dynamically generated cache names based on site identity

#### WordPress Integration

The manifest generator fetches data from WordPress during the build process:

```graphql
{
  generalSettings {
    title # Used for manifest name
    description # Used for manifest description
    language # Used for manifest language
  }
  mediaItems(where: { search: "logo" }) {
    # Used for PWA icons
    nodes {
      mediaItemUrl
      mimeType
      mediaDetails {
        width
        height
      }
    }
  }
}
```

#### Fallback Mechanism

If WordPress data is unavailable during build time, the system falls back to default values:

```javascript
const DEFAULT_APP_NAME = "WP GraphQL Astro";
const DEFAULT_APP_SHORT_NAME = "WP Astro";
const DEFAULT_APP_DESCRIPTION =
  "A modern headless WordPress implementation using Astro and GraphQL";
const DEFAULT_THEME_COLOR = "#29aae1";
const DEFAULT_BG_COLOR = "#ffffff";
```

#### Dynamic Service Worker

The service worker is also generated during build time with dynamic cache names derived from:

1. PUBLIC_SITE_NAME environment variable (if available)
2. Hostname from PUBLIC_SITE_URL (if available)
3. WordPress site title (fetched from the API)
4. Default fallback value

This prevents cache collisions between different sites and includes a date-based version number for cache invalidation. You can manually generate the service worker by running:

```bash
npm run generate-sw
```

#### Build Scripts

Two main scripts handle PWA generation during build:

- **fix-manifest.js**: Generates the manifest.json with WordPress data
- **generate-service-worker.js**: Creates the service worker with dynamic cache names

Both scripts are automatically run during the build process.

### PWA Assets

Required PWA assets are located in the `/public` directory:

- `favicon.svg` - Vector icon used for app icons
- `logo.png` - 192x192 PNG icon
- `offline.html` - Offline fallback page

## API Routes

The application includes API routes:

- `/api/revalidate` - Webhook endpoint for triggering rebuilds (accepts POST requests with security token)
- `/api/manifest.json` - Route that redirects to the static manifest.json file

## Contact Form

The contact form uses Netlify Forms with spam protection:

- **Honeypot field** - Hidden `bot-field` to catch basic bots
- **reCAPTCHA v2** - Google's "I'm not a robot" checkbox

### Setup

The form works out of the box on Netlify. To enable reCAPTCHA:

1. Deploy to Netlify
2. Go to Site Settings → Forms
3. Enable reCAPTCHA spam filtering
4. Netlify handles the rest automatically

The form is in `src/components/ContactForm.astro` and gets embedded in posts/pages as needed.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
