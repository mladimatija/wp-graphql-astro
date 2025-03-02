# Headless WordPress with Astro and GraphQL

A modern headless WordPress implementation using [Astro](https://astro.build/) and GraphQL.

## Features

- Static site generation with Astro
- WordPress content management through GraphQL
- Responsive design with SCSS
- Dark mode support
- SEO optimization
- Dynamic routing for WordPress content
- Image optimization
- View Transitions for smooth navigation
- PWA support with offline capabilities
- TypeScript integration
- Content Collections for local/hybrid content management
- Accessibility enhancements

## Requirements

### WordPress Setup

Your WordPress installation needs these plugins:

- [WPGraphQL](https://www.wpgraphql.com/docs/introduction) - GraphQL API for WordPress
- [Total Counts for WPGraphQL](https://github.com/builtbycactus/total-counts-for-wp-graphql) - Adds total post counts
- [WPGraphQL Next-Previous Post](https://github.com/valu-digital/wp-graphql-next-previous-post) - Adds navigation between posts
- [WPGraphQL Offset Pagination](https://github.com/valu-digital/wp-graphql-offset-pagination) - **REQUIRED** for pagination
- [JAMstack Deployments](https://github.com/crgeary/wp-jamstack-deployments) (optional) - For automatic builds

### Environment Variables

Create a `.env` file with:

```env
WORDPRESS_API_URL=https://yoursitename.com/graphql
PUBLIC_DISQUS_EMBED_URL=https://siteid.disqus.com/embed.js
PUBLIC_X_SHARE_USER=your_twitter_handle
PUBLIC_SITE_URL=https://yoursitename.com
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
│   └── templates/     # Content type templates
├── content/           # Content collections
│   ├── authors/       # Author information
│   ├── components/    # Reusable content components
│   ├── config/        # Site configuration files
│   └── pages/         # Local markdown pages
├── layouts/           # Main layout wrappers
├── lib/               # Utilities and API functions
├── pages/             # Astro pages and routes
│   └── page/          # Pagination handling
└── styles/            # SCSS styles
    ├── abstracts/     # Functions and variables
    ├── common/        # Global styles
    └── config/        # Style configuration
```

## Routing and Templates

The `[...uri].astro` component handles WordPress route paths:

1. A route is requested (e.g., `/blog/my-post/`)
2. The `[...uri].astro` component captures the URI
3. `getNodeByURI` fetches data from WordPress GraphQL
4. Content type is determined (Post, Page, Category, etc.)
5. The appropriate template is rendered

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
twitterHandle: "@wpgraphql"
twitterCardType: "summary_large_image"
showFeaturedImages: true
showFeaturedImagesOnPostCard: true
---
```

### Available Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `defaultTitle` | string | Default page title |
| `titleTemplate` | string | Format for page titles |
| `description` | string | Default meta description |
| `siteUrl` | string | Base URL of the website |
| `ogImage` | string | Default Open Graph image |
| `twitterHandle` | string | Twitter handle for cards |
| `twitterCardType` | string | Twitter card format |
| `showFeaturedImages` | boolean | Show featured images on single posts/pages |
| `showFeaturedImagesOnPostCard` | boolean | Show featured images on post listings |

## Pagination

The app uses WPGraphQL Offset Pagination for handling pagination in the WordPress GraphQL API. The implementation in `src/lib/api.js` uses the `offsetPagination` argument:

```graphql
posts(where: { offsetPagination: { offset: $offset, size: $first } })
```

This requires the WPGraphQL Offset Pagination plugin.

## Data Fetching

### WordPress GraphQL API

Data fetching is centralized in `src/lib/api.ts` with key functions:

- `getNodeByURI`: Fetches content based on URI
- `getAllUris`: Used for static path generation
- `getPosts`/`getPostsByCategory`: Fetch post collections
- `settingsQuery`/`navQuery`: Fetch site settings and navigation

### Astro Content Collections

Local content uses Astro's Content Collections for hybrid content strategy:

- `pages`: Local markdown pages
- `authors`: Author information
- `components`: Reusable content components

## Styling

The project uses SCSS with a structured approach:

- **Abstracts**: Reusable functions and mixins
- **Common**: Global styles
- **Config**: Variables and configuration

## Deployment

The project is configured for Netlify:

1. Connect your repository
2. Set build command to `npm run build`
3. Set publish directory to `dist`
4. Add your environment variables

The project can also be deployed on Vercel, GitHub Pages, or any static site host.

## Development Workflow

- Development: `npm run dev`
- Format code: `npm run format`
- Lint code: `npm run lint`
- Build: `npm run build`

## Testing

### Component Testing with Vitest

Unit and component tests are written with Vitest for fast, reliable testing:

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

The application includes built-in Web Vitals monitoring to track Core Web Vitals metrics:

- **Largest Contentful Paint (LCP)**: Measures loading performance
- **First Input Delay (FID)**: Measures interactivity
- **Cumulative Layout Shift (CLS)**: Measures visual stability
- **First Contentful Paint (FCP)**: Measures when content first appears
- **Time to First Byte (TTFB)**: Measures server response time

Web Vitals monitoring can be enabled with the `showWebVitals` prop on the MainLayout component:

```astro
---
import MainLayout from "../layouts/MainLayout.astro";
---

  <!-- Page content -->
</MainLayout>
```

Metrics are automatically collected and displayed in a floating panel that can be toggled. In development mode, this is enabled by default.

### Configuring Analytics Endpoint

To send Web Vitals data to your analytics service:

1. Create or update your `.env` file to include your analytics endpoint:

```env
# Add this to your existing .env file
PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-service.com/collect
```

2. For production environments, add this to your deployment configuration:
   - **Netlify**: Add as an environment variable in the Netlify dashboard
   - **Vercel**: Add in the Environment Variables section of your project settings
   - **GitHub Pages**: Use GitHub Actions secrets

3. Optionally, you can customize the analytics payload in `src/lib/webVitals.js` to match your analytics provider's requirements.

The Web Vitals data will be automatically sent to the configured endpoint using the `navigator.sendBeacon()` API when available, with a fallback to `fetch()` for older browsers.

## License

This project is licensed under the MIT License - see the LICENSE file for details.