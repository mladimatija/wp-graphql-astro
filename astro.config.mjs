import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config

// https://astro.build/config
import netlify from "@astrojs/netlify/functions";

// https://astro.build/config
export default defineConfig({
  output: "static",
  integrations: [react(), sitemap()],
  adapter: netlify()
});