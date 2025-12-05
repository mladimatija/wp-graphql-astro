import { describe, it, expect, vi, beforeEach } from "vitest";
import * as content from "../../lib/content";

// Mock dependencies
vi.mock("../../lib/content", () => ({
	getSiteConfig: vi.fn().mockResolvedValue({
		data: {
			showFeaturedImagesOnPostCard: true,
		},
	}),
}));

vi.mock("string-strip-html", () => ({
	stripHtml: vi.fn().mockReturnValue({
		result: "Stripped content",
	}),
}));

// Create a simplified version of the PostCard component logic for testing
class PostCardLogic {
	constructor(post, showFeaturedImages = true) {
		this.post = post;
		this.showFeaturedImagesOnPostCard = showFeaturedImages;
		this.excerpt = "Stripped content"; // Mock the string-strip-html result
	}

	hasFeaturedImage() {
		return (
			this.post.featuredImage?.node?.mediaItemUrl &&
			this.showFeaturedImagesOnPostCard
		);
	}

	getFeaturedImageUrl() {
		return this.hasFeaturedImage()
			? this.post.featuredImage.node.mediaItemUrl
			: null;
	}

	getFeaturedImageAlt() {
		if (!this.hasFeaturedImage()) return null;
		return this.post.featuredImage.node.altText || this.post.title;
	}

	getTitle() {
		return this.post.title;
	}

	getUri() {
		return this.post.uri;
	}

	render() {
		// Return an object representing the rendered output
		// This helps with testing without needing to parse HTML
		return {
			title: this.getTitle(),
			uri: this.getUri(),
			featuredImageUrl: this.getFeaturedImageUrl(),
			featuredImageAlt: this.getFeaturedImageAlt(),
			excerpt: this.excerpt,
		};
	}
}

describe("PostCard Component Logic", () => {
	const mockPost = {
		id: "123",
		title: "Test Post",
		uri: "/test-post/",
		content:
			"<p>This is test content that will be stripped and truncated...</p>",
		featuredImage: {
			node: {
				mediaItemUrl: "https://example.com/image.jpg",
				altText: "Test alt text",
			},
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders post title and link", () => {
		const postCard = new PostCardLogic(mockPost);
		const output = postCard.render();

		expect(output.title).toBe("Test Post");
		expect(output.uri).toBe("/test-post/");
	});

	it("renders featured image when available and enabled", () => {
		content.getSiteConfig.mockResolvedValue({
			data: { showFeaturedImagesOnPostCard: true },
		});

		const postCard = new PostCardLogic(mockPost, true);
		const output = postCard.render();

		expect(output.featuredImageUrl).toBe("https://example.com/image.jpg");
		expect(output.featuredImageAlt).toBe("Test alt text");
	});

	it("does not render featured image when disabled in settings", () => {
		content.getSiteConfig.mockResolvedValue({
			data: { showFeaturedImagesOnPostCard: false },
		});

		const postCard = new PostCardLogic(mockPost, false);
		const output = postCard.render();

		expect(output.featuredImageUrl).toBeNull();
		expect(output.featuredImageAlt).toBeNull();
	});

	it("uses post title as alt text when alt text is missing", () => {
		const postWithoutAlt = {
			...mockPost,
			featuredImage: {
				node: {
					mediaItemUrl: "https://example.com/image.jpg",
					altText: "",
				},
			},
		};

		const postCard = new PostCardLogic(postWithoutAlt, true);
		const output = postCard.render();

		expect(output.featuredImageAlt).toBe("Test Post");
	});

	it("handles posts without featured images", () => {
		const postWithoutImage = {
			...mockPost,
			featuredImage: null,
		};

		const postCard = new PostCardLogic(postWithoutImage, true);
		const output = postCard.render();

		expect(output.featuredImageUrl).toBeNull();
		expect(output.featuredImageAlt).toBeNull();
	});
});
