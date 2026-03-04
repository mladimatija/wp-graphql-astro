/**
 * Tests for API error paths (response.ok === false, GraphQL errors).
 * Uses real api module with mocked fetch (no vi.mock of ../api).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function mockResponse(overrides = {}) {
	return {
		ok: true,
		headers: new Headers(),
		json: () => Promise.resolve({}),
		text: () => Promise.resolve(""),
		...overrides,
	};
}

const fetchMock = vi.fn();
let apiModule;

describe("API error paths", () => {
	beforeEach(async () => {
		vi.stubEnv("WORDPRESS_API_URL", "https://example.com/graphql");
		global.fetch = fetchMock;
		vi.resetModules();
		apiModule = await import("../api");
	});

	afterEach(() => {
		fetchMock.mockReset();
		if (typeof vi.unstubAllEnvs === "function") vi.unstubAllEnvs();
	});

	it("settingsQuery returns fromFallback when response.ok is false (e.g. 500)", async () => {
		// 5xx triggers retries with backoff, so mock all attempts
		fetchMock.mockResolvedValue(
			mockResponse({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				text: () => Promise.resolve("Server Error"),
			}),
		);

		const result = await apiModule.settingsQuery();

		expect(result.fromFallback).toBe(true);
		expect(result.data).toBeDefined();
		expect(result.data.generalSettings).toBeDefined();
		expect(result.data.generalSettings.title).toBeDefined();
	}, 12_000);

	it("settingsQuery returns fromFallback when GraphQL response has errors array", async () => {
		fetchMock.mockResolvedValueOnce(
			mockResponse({
				json: () =>
					Promise.resolve({
						data: null,
						errors: [{ message: "GraphQL error" }],
					}),
			}),
		);

		const result = await apiModule.settingsQuery();

		expect(result.fromFallback).toBe(true);
		expect(result.data).toBeDefined();
		expect(result.data.generalSettings).toBeDefined();
	});

	it("navQuery returns fromFallback when response.ok is false", async () => {
		fetchMock.mockResolvedValue(
			mockResponse({
				ok: false,
				status: 503,
				text: () => Promise.resolve("Unavailable"),
			}),
		);

		const result = await apiModule.navQuery();

		expect(result.fromFallback).toBe(true);
		expect(result.data).toBeDefined();
		expect(result.data.menus).toBeDefined();
		expect(Array.isArray(result.data.menus.nodes)).toBe(true);
	}, 12_000);

	it("getNodeByURI returns fallback post when fetch fails", async () => {
		fetchMock.mockResolvedValue(
			mockResponse({
				ok: false,
				status: 500,
				text: () => Promise.resolve("Server Error"),
			}),
		);

		const result = await apiModule.getNodeByURI("/some-post/");

		expect(result.nodeByUri).toBeDefined();
		expect(result.nodeByUri.__typename).toBe("Post");
		expect(result.nodeByUri.title).toBe("Fallback Post");
		expect(result.nodeByUri.id).toBe("post-fallback");
	}, 12_000);
});

describe("getAllUris integration (mocked fetch)", () => {
	beforeEach(async () => {
		vi.stubEnv("WORDPRESS_API_URL", "https://example.com/graphql");
		global.fetch = vi.fn();
		vi.resetModules();
		apiModule = await import("../api");
	});

	afterEach(() => {
		if (typeof vi.unstubAllEnvs === "function") vi.unstubAllEnvs();
	});

	it("getAllUris merges terms, categories, posts, pages and trims URIs", async () => {
		const fetchMock = global.fetch;
		// Terms + categories (first executeQuery)
		fetchMock.mockResolvedValueOnce(
			mockResponse({
				json: () =>
					Promise.resolve({
						data: {
							terms: { nodes: [{ uri: "/category/tech/" }] },
							categories: { nodes: [{ uri: "/uncategorized/" }] },
						},
					}),
			}),
		);
		// Posts (one page, hasNextPage false)
		fetchMock.mockResolvedValueOnce(
			mockResponse({
				json: () =>
					Promise.resolve({
						data: {
							posts: {
								nodes: [{ uri: "/hello-world/" }],
								pageInfo: { hasNextPage: false, endCursor: null },
							},
						},
					}),
			}),
		);
		// Pages (one page, hasNextPage false)
		fetchMock.mockResolvedValueOnce(
			mockResponse({
				json: () =>
					Promise.resolve({
						data: {
							pages: {
								nodes: [{ uri: "/about/" }],
								pageInfo: { hasNextPage: false, endCursor: null },
							},
						},
					}),
			}),
		);

		const result = await apiModule.getAllUris();

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(4);
		// URIs are trimmed (no leading/trailing slashes)
		const uris = result.map((r) => r.params.uri);
		expect(uris).toContain("category/tech");
		expect(uris).toContain("uncategorized");
		expect(uris).toContain("hello-world");
		expect(uris).toContain("about");
	});

	it("getAllUris returns fallback array when fetch fails", async () => {
		const fetchMock = global.fetch;
		fetchMock.mockResolvedValue(
			mockResponse({
				ok: false,
				status: 500,
				text: () => Promise.resolve("Server Error"),
			}),
		);

		const result = await apiModule.getAllUris();

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(5);
		const uris = result.map((r) => r.params.uri);
		expect(uris).toContain("example-post-1");
		expect(uris).toContain("example-post-2");
		expect(uris).toContain("about");
		expect(uris).toContain("contact");
		expect(uris).toContain("category/sample");
	}, 12_000);
});
