# Headless WordPress built with Astro and GraphQL, hosted on Netlify

This project is meant to be a flexible starting point for people interested in using [Astro](https://astro.build/) with WordPress as a headless CMS. If you want some additional resources to help get you started, check out the blog post and video linked below.

[✍️ Read the step-by-step tutorial](https://developers.wpengine.com/blog/building-a-headless-wordpress-site-with-astro)
[📹 Watch the video](https://www.youtube.com/watch?v=BcoxZZIfESI)

## Requirements

- [WordPress](https://wordpress.org/)
- [WPGraphQL](https://www.wpgraphql.com/docs/introduction)
- [Total Counts for WPGraphQL](https://github.com/builtbycactus/total-counts-for-wp-graphql)
- [WPGraphql Next-Previous Post](wp-graphql-next-previous-post)
- [JAMstack Deployments](https://github.com/crgeary/wp-jamstack-deployments) (optional, automatic publish to Netlify on post/page/settings updates)
- Environment Variables

Add a variable to your `.env` and then hit `npm run dev`:

* `WORDPRESS_API_URL = https://yoursitename.com/graphql`
* `PUBLIC_DISQUS_EMBED_URL = https://siteid.disqus.com/embed.js`
* `PUBLIC_TWITTER_SHARE_USER = your_twitter_handle`
* `PUBLIC_SITE_URL = https://yoursitename.com`

## Routing and Templates

This starter project leans into the WordPress CMS routing capabilities and uses a `getNodeByUri` query in WPGraphQL to handle any route path that WordPress knows about. This allows you to handle all WordPress content types using the `[...uri].astro` component. From there, Astro parses the `uri` and uses that to call `getNodeByURI` from `api.js` to fetch data about that resource from the CMS. Once data is returned, we look at the content type and then dynamically resolve a content template from the `templates` directory.

### Adding Content Types

This project comes with built in support for Post, Page, Tag, and Category types, but could easily be extended for custom post types or other native content types. To add support for a custom post type you would do the following:

1. Add a GraphQL fragment for your post type to `getNodeByURI` from `api.js`
2. Add an Astro component as a template
3. Add a case to the switch statement in `[...uri].astro` to catch the content type and resolve the template

### Overriding Default Routing

Since routes using [rest parameters in Astro](https://docs.astro.build/en/core-concepts/routing/#rest-parameters) come last in the [route priority order](https://docs.astro.build/en/core-concepts/routing/#route-priority-order), you can easily override this catch-all routing pattern by creating a more specific route to handle a given path.

For example, if you want the path `/category/food-trucks` to be handled by a different Astro component, you can add a corresponding file to the `pages` directory to override the default `...uri` route.

## Menus

By default, the menu assigned to the `Primary` menu location will be used for your header menu.

## Headless WordPress Hosting with Netlify

This project was intended to be hosted on Netlify, and it utilizes Netlify's Forms feature to that end. You can easily out out of that by removing `netlify` and `netlify-honeypot` attributes from the contact from and by deleting the `netlify.toml` file.

## TODO / nice to have

* Clean up GraphQL schema in `api.js`, leave only properties that are in use,
* pagination on archive pages (e.g. /category/slug/page/3),
* Tailwind.
