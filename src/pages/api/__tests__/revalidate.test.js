/**
 * Tests for /api/revalidate: token validation, invalid body, success path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const TOKEN = "test-revalidate-secret";
let POST;
let GET;

describe("Revalidate API", () => {
	beforeEach(async () => {
		vi.stubEnv("REVALIDATE_TOKEN", TOKEN);
		vi.stubEnv("NETLIFY_BUILD_HOOK_URL", ""); // no build hook in tests
		vi.resetModules();
		const revalidate = await import("../revalidate");
		POST = revalidate.POST;
		GET = revalidate.GET;
	});

	afterEach(() => {
		if (typeof vi.unstubAllEnvs === "function") vi.unstubAllEnvs();
	});

	it("POST returns 401 when x-revalidate-token is missing", async () => {
		const request = new Request("http://localhost/api/revalidate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ paths: ["/"] }),
		});
		const response = await POST({ request });

		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.message).toMatch(/[Uu]nauthorized|Invalid token/);
	});

	it("POST returns 401 when x-revalidate-token is wrong", async () => {
		const request = new Request("http://localhost/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-revalidate-token": "wrong-token",
			},
			body: JSON.stringify({ paths: ["/"] }),
		});
		const response = await POST({ request });

		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("POST returns 400 when body has no paths", async () => {
		const request = new Request("http://localhost/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-revalidate-token": TOKEN,
			},
			body: JSON.stringify({}),
		});
		const response = await POST({ request });

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.message).toMatch(/[Nn]o paths|[Pp]aths/);
	});

	it("POST returns 400 when paths is empty array", async () => {
		const request = new Request("http://localhost/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-revalidate-token": TOKEN,
			},
			body: JSON.stringify({ paths: [] }),
		});
		const response = await POST({ request });

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("POST returns 200 and success when token and paths are valid", async () => {
		const request = new Request("http://localhost/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-revalidate-token": TOKEN,
			},
			body: JSON.stringify({ paths: ["/", "/about"] }),
		});
		const response = await POST({ request });

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.results).toBeDefined();
		expect(Array.isArray(data.results)).toBe(true);
		expect(data.results).toHaveLength(2);
		expect(data.results[0].path).toBe("/");
		expect(data.results[1].path).toBe("/about");
	});

	it("POST accepts single path in body.path", async () => {
		const request = new Request("http://localhost/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-revalidate-token": TOKEN,
			},
			body: JSON.stringify({ path: "/contact" }),
		});
		const response = await POST({ request });

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.results).toHaveLength(1);
		expect(data.results[0].path).toBe("/contact");
	});

	it("GET returns 405 with usage message", async () => {
		const response = await GET();

		expect(response.status).toBe(405);
		const data = await response.json();
		expect(data.message).toBeDefined();
		expect(data.usage).toBeDefined();
		expect(data.usage.method).toBe("POST");
		expect(data.usage.headers).toHaveProperty("x-revalidate-token");
	});
});
