import type { APIRoute } from "astro";
import { log } from "../../lib/constants";

/** In-memory rate limit: max requests per window per key (IP). Reset after window ms. */
const REVALIDATE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const REVALIDATE_RATE_LIMIT_MAX = 10;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	const realIp = request.headers.get("x-real-ip");
	if (realIp) return realIp;
	return "unknown";
}

function isRateLimited(key: string): boolean {
	const now = Date.now();
	const entry = rateLimitStore.get(key);
	if (!entry) return false;
	if (now >= entry.resetAt) {
		rateLimitStore.delete(key);
		return false;
	}
	return entry.count >= REVALIDATE_RATE_LIMIT_MAX;
}

function consumeRateLimit(key: string): void {
	const now = Date.now();
	const entry = rateLimitStore.get(key);
	if (!entry || now >= entry.resetAt) {
		rateLimitStore.set(key, {
			count: 1,
			resetAt: now + REVALIDATE_RATE_LIMIT_WINDOW_MS,
		});
		return;
	}
	entry.count += 1;
}

/**
 * API endpoint to revalidate pages on-demand
 * Used by WordPress webhooks to trigger rebuilds when content changes
 *
 * POST: Accepts webhook requests with paths to revalidate
 * GET: Returns a friendly message explaining usage
 */
export const POST: APIRoute = async ({ request /*, locals*/ }) => {
	try {
		const clientKey = getClientKey(request);
		if (isRateLimited(clientKey)) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Too many requests; try again later",
				}),
				{
					status: 429,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Extract and validate the request body
		const body = await request.json();

		// Validate that request includes proper security token (never log the token)
		const receivedToken = request.headers.get("x-revalidate-token");
		const expectedToken = import.meta.env.REVALIDATE_TOKEN;

		if (!expectedToken || receivedToken !== expectedToken) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Unauthorized: Invalid token",
				}),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		consumeRateLimit(clientKey);

		// Get the post/page path that needs revalidation
		const paths = Array.isArray(body.paths)
			? body.paths
			: body.path
				? [body.path]
				: [];

		if (paths.length === 0) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "No paths to revalidate",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const normalizedPaths = paths.map((path: string) =>
			path.startsWith("/") ? path : `/${path}`,
		);

		// Optionally trigger a Netlify deploy (full rebuild) when build hook URL is set
		const buildHookUrl = import.meta.env.NETLIFY_BUILD_HOOK_URL;
		let buildTriggered = false;
		if (buildHookUrl) {
			try {
				const title = `Revalidate: ${normalizedPaths.slice(0, 3).join(", ")}${normalizedPaths.length > 3 ? "…" : ""}`;
				const url = new URL(buildHookUrl);
				url.searchParams.set("trigger_title", title);
				const hookRes = await fetch(url.toString(), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: "{}",
				});
				buildTriggered = hookRes.ok;
				if (!hookRes.ok) {
					log.error(
						`Netlify build hook failed: ${hookRes.status} ${hookRes.statusText}`,
					);
				}
			} catch (err) {
				log.error("Netlify build hook request failed: " + err);
			}
		} else {
			log.info(
				`Revalidate received ${normalizedPaths.length} path(s); set NETLIFY_BUILD_HOOK_URL to trigger a deploy.`,
			);
		}

		const revalidationResults = normalizedPaths.map((path) => ({
			path,
			success: true,
		}));

		return new Response(
			JSON.stringify({
				success: true,
				message: buildTriggered
					? "Revalidation triggered; deploy in progress"
					: "Revalidation acknowledged",
				buildTriggered,
				results: revalidationResults,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		log.error("Revalidation error: " + error);

		return new Response(
			JSON.stringify({
				success: false,
				message: "Revalidation failed",
				error: (error as Error).message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

/**
 * GET handler that explains how to use the revalidation endpoint
 */
export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			message:
				"This endpoint requires a POST request with a JSON body and proper authentication",
			usage: {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-revalidate-token": "your-token-here",
				},
				body: {
					paths: ["/path-to-revalidate", "/another-path"],
				},
			},
		}),
		{
			status: 405,
			headers: { "Content-Type": "application/json" },
		},
	);
};
