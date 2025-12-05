/**
 * Application constants
 * Centralized place for default values and configuration
 *
 * IMPORTANT: If you modify any constants here, also update constants.js
 * to maintain consistency for scripts that use the JS version.
 */

/**
 * Logging utility for the application
 * Logs will be displayed if:
 * 1. The app is running in development mode (import.meta.env.DEV)
 * 2. The PUBLIC_DEBUG environment variable is set to 'true'
 * 3. The message is an error log
 */

interface LogOptions {
	/**
	 * Force log to display regardless of environment
	 * @default false
	 */
	force?: boolean;

	/**
	 * Mark this as an error log (always displayed)
	 * @default false
	 */
	isError?: boolean;

	/**
	 * Log level (info, warn, error, debug)
	 * @default 'info'
	 */
	level?: "info" | "warn" | "error" | "debug";
}

/**
 * Conditionally log messages based on environment and options
 */
export const log = {
	/**
	 * Log an informational message (only in DEV or if DEBUG=true)
	 */
	info: (message: string | object, options: LogOptions = {}) => {
		if (shouldLog(options)) {
			console.info("[INFO]", message);
		}
	},

	/**
	 * Log a warning message (only in DEV or if DEBUG=true)
	 */
	warn: (message: string | object, options: LogOptions = {}) => {
		if (shouldLog({ ...options, level: "warn" })) {
			console.warn("[WARN]", message);
		}
	},

	/**
	 * Log an error message (always displayed)
	 */
	error: (message: string | object) => {
		// Error logs are always displayed
		console.error("[ERROR]", message);
	},

	/**
	 * Log a debug message (only in DEV or if DEBUG=true)
	 */
	debug: (message: string | object, options: LogOptions = {}) => {
		if (shouldLog({ ...options, level: "debug" })) {
			console.debug("[DEBUG]", message);
		}
	},

	/**
	 * Log an object with label (only in DEV or if DEBUG=true)
	 */
	dir: (label: string, obj: unknown, options: LogOptions = {}) => {
		if (shouldLog(options)) {
			console.group(label);
			console.dir(obj);
			console.groupEnd();
		}
	},
};

/**
 * Determine if a log should be displayed based on environment and options
 */
function shouldLog(options: LogOptions = {}): boolean {
	const { force = false, isError = false, level = "info" } = options;

	// Always show error logs
	if (isError || level === "error") {
		return true;
	}

	// Always show forced logs
	if (force) {
		return true;
	}

	// Check if we're in development mode
	const isDev =
		typeof import.meta.env !== "undefined" ? import.meta.env.DEV : false;

	// Check if debug is enabled via environment variable
	const isDebugEnabled =
		typeof import.meta.env !== "undefined"
			? import.meta.env.PUBLIC_DEBUG === "true"
			: false;

	// Show logs in development or when debugging is enabled
	return isDev || isDebugEnabled;
}

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
