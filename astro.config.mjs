import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://matijaculjak.com",
  output: "static",
  integrations: [react(), sitemap()],
});