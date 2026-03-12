// Content Collections configuration (Astro 6 Content Layer API)
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

// Schema for local pages
const pagesCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/pages",
	}),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		publishDate: z.coerce.date().optional(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		draft: z.boolean().optional().default(false),
	}),
});

// Schema for authors
const authorsCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/authors",
	}),
	schema: z.object({
		name: z.string(),
		role: z.string().optional(),
		bio: z.string().optional(),
		avatar: z.string().optional(),
		social: z
			.object({
				x: z.string().optional(),
				github: z.string().optional(),
				linkedin: z.string().optional(),
			})
			.optional(),
	}),
});

// Schema for reusable components
const componentsCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/components",
	}),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		order: z.number().optional(),
		template: z.string(),
		data: z.record(z.string(), z.unknown()).optional(),
	}),
});

// Schema for config collection
const configCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/config",
	}),
	schema: z.object({
		defaultTitle: z.string().optional(),
		titleTemplate: z.string().optional(),
		description: z.string().optional(),
		siteUrl: z.string().optional(),
		ogImage: z.string().optional(),
		xHandle: z.string().optional(),
		xCardType: z.string().optional(),
		showFeaturedImages: z.boolean().optional().default(true),
		showFeaturedImagesOnPostCard: z.boolean().optional().default(false),
	}),
});

export const collections = {
	pages: pagesCollection,
	authors: authorsCollection,
	components: componentsCollection,
	config: configCollection,
};
