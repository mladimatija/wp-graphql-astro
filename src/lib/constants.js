/**
 * Application constants - Node scripts (process-templates, generate-service-worker)
 * Static values are loaded from constants.json (single source of truth).
 * Log utility uses process.env for Node context.
 */

import constantsData from "./constants.json" with { type: "json" };

/** Re-export static constants from JSON */
export const DEFAULT_APP_NAME = constantsData.DEFAULT_APP_NAME;
export const DEFAULT_APP_SHORT_NAME = constantsData.DEFAULT_APP_SHORT_NAME;
export const DEFAULT_APP_DESCRIPTION = constantsData.DEFAULT_APP_DESCRIPTION;
export const DEFAULT_THEME_COLOR = constantsData.DEFAULT_THEME_COLOR;
export const DEFAULT_BG_COLOR = constantsData.DEFAULT_BG_COLOR;
export const DEFAULT_ICONS = constantsData.DEFAULT_ICONS;

function shouldLog() {
	const isDev =
		typeof process !== "undefined" &&
		process.env &&
		process.env.NODE_ENV === "development";
	const isDebugEnabled =
		typeof process !== "undefined" &&
		process.env &&
		process.env.DEBUG === "true";
	return isDev || isDebugEnabled;
}

export const log = {
	info: (message) => {
		if (shouldLog()) console.info("[INFO]", message);
	},
	warn: (message) => {
		if (shouldLog()) console.warn("[WARN]", message);
	},
	error: (message) => {
		console.error("[ERROR]", message);
	},
	debug: (message) => {
		if (shouldLog()) console.debug("[DEBUG]", message);
	},
	dir: (label, obj) => {
		if (shouldLog()) {
			console.group(label);
			console.dir(obj);
			console.groupEnd();
		}
	},
};
