/**
 * Application constants
 * Centralized place for default values and configuration.
 * Static values are defined in constants.json (single source of truth).
 */

import constantsData from "./constants.json";

/** Re-export static constants from JSON (single source of truth) */
export const DEFAULT_APP_NAME = constantsData.DEFAULT_APP_NAME;
export const DEFAULT_APP_SHORT_NAME = constantsData.DEFAULT_APP_SHORT_NAME;
export const DEFAULT_APP_DESCRIPTION = constantsData.DEFAULT_APP_DESCRIPTION;
export const DEFAULT_THEME_COLOR = constantsData.DEFAULT_THEME_COLOR;
export const DEFAULT_BG_COLOR = constantsData.DEFAULT_BG_COLOR;
export const DEFAULT_ICONS = constantsData.DEFAULT_ICONS as Array<{
	src: string;
	sizes: string;
	type: string;
	purpose: string;
}>;

/**
 * Logging utility for the application (Astro/Vite context)
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

function shouldLog(options: LogOptions = {}): boolean {
	const { force = false, isError = false, level = "info" } = options;

	if (isError || level === "error") return true;
	if (force) return true;

	const isDev =
		typeof import.meta.env !== "undefined" ? import.meta.env.DEV : false;
	const isDebugEnabled =
		typeof import.meta.env !== "undefined"
			? import.meta.env.PUBLIC_DEBUG === "true"
			: false;

	return isDev || isDebugEnabled;
}

export const log = {
	info: (message: string | object, options: LogOptions = {}) => {
		if (shouldLog(options)) console.info("[INFO]", message);
	},

	warn: (message: string | object, options: LogOptions = {}) => {
		if (shouldLog({ ...options, level: "warn" }))
			console.warn("[WARN]", message);
	},

	error: (message: string | object) => {
		console.error("[ERROR]", message);
	},

	debug: (message: string | object, options: LogOptions = {}) => {
		if (shouldLog({ ...options, level: "debug" }))
			console.debug("[DEBUG]", message);
	},

	dir: (label: string, obj: unknown, options: LogOptions = {}) => {
		if (shouldLog(options)) {
			console.group(label);
			console.dir(obj);
			console.groupEnd();
		}
	},
};
