import "dotenv/config";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// Fallback for CI when PUBLIC_SITE_URL is not set (e.g. forks, PRs)
const siteUrl = process.env.PUBLIC_SITE_URL || "https://example.com";
export default defineConfig({
	site: siteUrl,
	output: "static", // Changed from server to static for build-time rendering
	integrations: [
		react(),
		sitemap({
			filter: (page) => !page.includes("/success") && !page.includes("/404"),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		build: {
			chunkSizeWarningLimit: 1000,
		},
		ssr: {
			// Avoid ssr externalization to ensure compatibility
			noExternal: ["react-icons"],
		},
		// Optimize CSS
		css: {
			devSourcemap: true,
		},
	},
	// View Transitions is now a standard feature in Astro v5
	viewTransitions: {
		// Enable support for the View Transitions API
		// This adds support for :view-transition-* pseudo-classes
		handleViewTransitions: true,
		persist: ["dark-mode"],
	},
	// Image optimization configuration aligned with Astro v5
	image: {
		domains: [],
		remotePatterns: [{ protocol: "https" }],
		service: {
			entrypoint: "astro/assets/services/sharp",
		},
	},

	// Add Netlify adapter for all environments
	adapter: netlify(),
});
