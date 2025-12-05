/**
 * View Transitions API Utilities
 *
 * These functions help with using the View Transitions API in Astro components
 * by providing helper functions to generate transition attributes.
 */

/**
 * Generate the view transition name for an element
 *
 * @param name The transition name to apply
 * @param id Optional unique identifier to make the transition name unique
 * @returns An object with the style attribute containing the view-transition-name
 */
export function transitionName(
	name: string,
	id?: string | number,
): { style: string } {
	return {
		style: `view-transition-name: ${id ? `${name}-${id}` : name};`,
	};
}

/**
 * Add View Transitions API support for a specific page element
 * This creates a transition group for the element
 *
 * @param element The element name for transition (e.g., 'header', 'hero', 'content')
 * @param id Optional unique identifier for this element
 * @returns HTML attribute object with transition name
 */
export function pageTransition(
	element: string,
	id?: string | number,
): { style: string } {
	return transitionName(element, id);
}

/**
 * Checks if the browser supports the View Transitions API
 *
 * @returns Boolean indicating if the View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
	return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Helper for getting the full class list for an element that needs transitions
 *
 * @param baseClasses Base CSS classes to apply
 * @param transitionType Optional transition type (e.g., 'fade', 'slide')
 * @returns String of combined CSS classes
 */
export function getTransitionClasses(
	baseClasses: string,
	transitionType?: string,
): string {
	if (!supportsViewTransitions() || !transitionType) {
		return baseClasses;
	}

	return `${baseClasses} transition-${transitionType}`;
}

/**
 * Constants for common transition names
 */
export const TRANSITIONS = {
	ROOT: "root",
	HEADER: "header",
	CONTENT: "content",
	HERO: "hero",
	FOOTER: "footer",
	IMAGE: "image",
	CARD: "card",
};
