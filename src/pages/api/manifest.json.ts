import type { APIRoute } from "astro";

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
