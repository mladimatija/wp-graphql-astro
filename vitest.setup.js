import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Astro components
global.astroConfig = {
	site: "https://example.com",
	base: "/",
};

// Mock Astro's environment variable access
process.env.PUBLIC_SITE_URL = "https://example.com";
process.env.WORDPRESS_API_URL = "https://wordpress.example.com/graphql";

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock astro:assets
vi.mock("astro:assets", () => {
	return {
		Image: ({ src, alt, ...props }) => {
			return {
				type: "img",
				props: { src, alt, ...props },
			};
		},
	};
});
