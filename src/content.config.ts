// Content Collections configuration
import { defineCollection, z } from 'astro:content';

// Schema for local pages
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.date().optional(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

// Schema for authors
const authorsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    social: z.object({
      x: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }),
});

// Schema for reusable components
const componentsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().optional(),
    template: z.string(),
    data: z.record(z.any()).optional(),
  }),
});

// Schema for config collection 
const configCollection = defineCollection({
  type: 'content',
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

// Define collections for Astro v5
export const collections = {
  'pages': pagesCollection,
  'authors': authorsCollection,
  'components': componentsCollection,
  'config': configCollection,
};