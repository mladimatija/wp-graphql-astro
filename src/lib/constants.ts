/**
 * Application constants
 * Centralized place for default values and configuration
 * 
 * IMPORTANT: If you modify any constants here, also update constants.js
 * to maintain consistency for scripts that use the JS version.
 */

/**
 * Default application name
 * Used as fallback when WordPress title is not available
 */
export const DEFAULT_APP_NAME = "WP GraphQL Astro";

/**
 * Default application short name
 * Used for PWA manifest when not specified in WordPress
 */
export const DEFAULT_APP_SHORT_NAME = "WP Astro";

/**
 * Default application description
 * Used as fallback when WordPress description is not available
 */
export const DEFAULT_APP_DESCRIPTION = "A modern headless WordPress implementation using Astro and GraphQL";

/**
 * Default theme color
 * Used for PWA manifest theme_color
 */
export const DEFAULT_THEME_COLOR = "#29aae1";

/**
 * Default background color
 * Used for PWA manifest background_color
 */
export const DEFAULT_BG_COLOR = "#ffffff";

/**
 * Default PWA icons
 * Used for service worker and manifest
 */
export const DEFAULT_ICONS = [
  {
    src: "/favicon.svg",
    sizes: "48x48 72x72 96x96 128x128 256x256",
    type: "image/svg+xml",
    purpose: "any"
  },
  {
    src: "/logo.png",
    sizes: "192x192",
    type: "image/png"
  }
];