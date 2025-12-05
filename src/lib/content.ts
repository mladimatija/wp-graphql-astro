import { getCollection, type CollectionEntry } from "astro:content";

/**
 * Get the site configuration from the config collection
 * @returns {Promise<CollectionEntry<'config'> | undefined>} Site configuration
 */
export async function getSiteConfig(): Promise<
	CollectionEntry<"config"> | undefined
> {
	const configs = await getCollection("config");
	return configs.find((config) => config.slug === "seo");
}

/**
 * Get a specific component by slug
 * @param {string} slug - The slug of the component to fetch
 * @returns {Promise<CollectionEntry<'components'> | undefined>} Component data
 */
export async function getComponentBySlug(
	slug: string,
): Promise<CollectionEntry<"components"> | undefined> {
	const components = await getCollection("components");
	return components.find((component) => component.slug === slug);
}

/**
 * Get multiple components by template type
 * @param {string} template - The template type to filter by
 * @returns {Promise<CollectionEntry<'components'>[]>} Component data array
 */
export async function getComponentsByTemplate(
	template: string,
): Promise<CollectionEntry<"components">[]> {
	const components = await getCollection("components");
	return components
		.filter((component) => component.data.template === template)
		.sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
}

/**
 * Get a specific page by slug
 * @param {string} slug - The slug of the page to fetch
 * @returns {Promise<CollectionEntry<'pages'> | undefined>} Page data
 */
export async function getPageBySlug(
	slug: string,
): Promise<CollectionEntry<"pages"> | undefined> {
	const pages = await getCollection("pages");
	return pages.find((page) => page.slug === slug);
}

/**
 * Get all non-draft pages
 * @returns {Promise<CollectionEntry<'pages'>[]>} Array of page data
 */
export async function getPublishedPages(): Promise<CollectionEntry<"pages">[]> {
	const pages = await getCollection("pages");
	return pages.filter((page) => !page.data.draft);
}

/**
 * Get author data by slug
 * @param {string} slug - The slug of the author to fetch
 * @returns {Promise<CollectionEntry<'authors'> | undefined>} Author data
 */
export async function getAuthorBySlug(
	slug: string,
): Promise<CollectionEntry<"authors"> | undefined> {
	const authors = await getCollection("authors");
	return authors.find((author) => author.slug === slug);
}

/**
 * Get all authors
 * @returns {Promise<CollectionEntry<'authors'>[]>} Array of author data
 */
export async function getAllAuthors(): Promise<CollectionEntry<"authors">[]> {
	return await getCollection("authors");
}
