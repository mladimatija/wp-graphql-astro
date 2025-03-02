import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.PUBLIC_SITE_URL,
  output: process.env.NETLIFY || process.env.NODE_ENV === 'production' ? "server" : "static", // Use server rendering in production, static for local preview
  integrations: [
    react(), 
    sitemap({
      filter: (page) => !page.includes('/success') && !page.includes('/404')
    })
  ],
  vite: {
    build: {
      // Improve chunk size warnings threshold
      chunkSizeWarningLimit: 1000,
      // Reduce the size of the _astro directory in the output
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'darkmode': ['darkmode-js'],
          }
        }
      }
    },
    ssr: {
      // Avoid ssr externalization to ensure compatibility
      noExternal: ['react-icons']
    },
    // Optimize CSS
    css: {
      devSourcemap: true,
    }
  },
  // View Transitions is now a standard feature in Astro v5
  viewTransitions: true,
  // Image optimization configuration aligned with Astro v5
  image: {
    domains: [],
    remotePatterns: [{ protocol: "https" }],
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  
  // Add Netlify adapter for production, but only when deploying to Netlify
  adapter: process.env.NETLIFY ? netlify() : undefined
});
