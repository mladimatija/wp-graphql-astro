import type { APIRoute } from "astro";

// Run as a server function so the redirect emits a real HTTP 307,
// instead of being prerendered to a static body at build time.
export const prerender = false;

/**
 * This route redirects to the static manifest.json file
 */
export const GET: APIRoute = async () => {
	return new Response(null, {
		status: 307, // Temporary redirect
		headers: {
			Location: "/manifest.json",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
