/**
 * Application constants - JS version for build scripts
 * Centralized place for default values and configuration
 *
 * IMPORTANT: This file should be kept in sync with constants.ts
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
export const DEFAULT_APP_DESCRIPTION =
  "A modern headless WordPress implementation using Astro and GraphQL";

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
    purpose: "any",
  },
  {
    src: "/logo.svg",
    sizes: "192x192",
    type: "image/svg+xml",
    purpose: "any",
  },
];

/**
 * A simple logging utility for scripts
 * Logs will be displayed if:
 * 1. The NODE_ENV is 'development'
 * 2. The DEBUG environment variable is set to 'true'
 * 3. The message is an error log
 */

// Helper function to determine if logging should be displayed
function shouldLog() {
  // Check if we're in development mode
  const isDev =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "development";

  // Check if debug is enabled via environment variable
  const isDebugEnabled =
    typeof process !== "undefined" &&
    process.env &&
    process.env.DEBUG === "true";

  // Show logs in development or when debugging is enabled
  return isDev || isDebugEnabled;
}

export const log = {
  info: (message) => {
    if (shouldLog()) {
      console.info("[INFO]", message);
    }
  },

  warn: (message) => {
    if (shouldLog()) {
      console.warn("[WARN]", message);
    }
  },

  error: (message) => {
    // Error logs are always displayed
    console.error("[ERROR]", message);
  },

  debug: (message) => {
    if (shouldLog()) {
      console.debug("[DEBUG]", message);
    }
  },

  dir: (label, obj) => {
    if (shouldLog()) {
      console.group(label);
      console.dir(obj);
      console.groupEnd();
    }
  },
};
