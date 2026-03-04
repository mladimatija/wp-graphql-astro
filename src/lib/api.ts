/**
 * WordPress GraphQL API client
 * Provides functions for fetching data from WordPress via GraphQL
 */
import { DEFAULT_APP_NAME, DEFAULT_APP_DESCRIPTION, log } from "./constants";

// Type definitions for GraphQL responses
interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

interface GraphQLErrorObject {
	message: string;
	locations?: { line: number; column: number }[];
	path?: string[];
}

interface GraphQLResponse<T> {
	data: T;
	errors?: GraphQLErrorObject[];
}

interface FetchOptions extends RequestInit {
	cache?: "force-cache" | "no-store" | "reload" | "no-cache" | "default";
}

// WordPress types
interface MediaNode {
	mediaItemUrl: string;
	altText: string;
}

interface CategoryNode {
	name: string;
	uri: string;
}

interface PostNode {
	id: string;
	postId?: number;
	title: string;
	date: string;
	dateGmt: string;
	modified: string;
	modifiedGmt: string;
	uri: string;
	link?: string;
	guid?: string;
	excerpt: string;
	content: string;
	categories?: {
		nodes: CategoryNode[];
	};
	featuredImage?: {
		node: MediaNode;
	};
	next?: {
		id: string;
		title: string;
		uri: string;
	} | null;
	previous?: {
		id: string;
		title: string;
		uri: string;
	} | null;
}

interface PageNode {
	id: string;
	title: string;
	slug: string;
	uri: string;
	date: string;
	content: string;
	featuredImage?: {
		node: MediaNode;
	};
}

interface CategoryPageNode {
	id: string;
	name: string;
	slug: string;
	posts: {
		nodes: PostNode[];
	};
	featuredImage?: {
		node: MediaNode;
	};
}

interface TagNode {
	id: string;
	name: string;
	slug: string;
	posts: {
		nodes: PostNode[];
	};
	featuredImage?: {
		node: MediaNode;
	};
}

interface MenuItemNode {
	uri: string;
	url: string;
	order: number;
	label: string;
}

interface MenuNode {
	name: string;
	menuItems: {
		nodes: MenuItemNode[];
	};
}

interface PageInfo {
	total: number;
	hasNextPage: boolean;
	hasPreviousPage?: boolean;
	endCursor?: string;
}

interface NodeByUriResponse {
	nodeByUri:
		| ({ __typename: "Post" } & PostNode)
		| ({ __typename: "Page" } & PageNode)
		| ({ __typename: "Category" } & CategoryPageNode)
		| ({ __typename: "Tag" } & TagNode)
		| null;
}

/** Terms + categories only (used for first part of getAllUris) */
interface TermsCategoriesUrisResponse {
	terms: { nodes: { uri: string }[] };
	categories: { nodes: { uri: string }[] };
}

/** One page of posts/pages with cursor info */
interface UriPageResponse {
	nodes: { uri: string }[];
	pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

interface UriParams {
	params: {
		uri: string;
	};
}

export interface SettingsResponse {
	generalSettings: {
		title: string;
		url: string;
		description: string;
	};
	allSettings: {
		readingSettingsPostsPerPage: number;
	};
}

/** Result of settingsQuery (data + whether fallback or stale cache was used) */
export interface SettingsQueryResult {
	data: SettingsResponse;
	fromFallback: boolean;
}

/** Result of navQuery (data + whether fallback or stale cache was used) */
export interface NavQueryResult {
	data: MenusResponse;
	fromFallback: boolean;
}

export interface MenusResponse {
	menus: {
		nodes: MenuNode[];
	};
}

interface PostsResponse {
	posts: {
		edges: {
			node: PostNode;
		}[];
		pageInfo: PageInfo;
	};
}

interface CategoryPostsResponse {
	category: {
		name: string;
		slug: string;
		posts: {
			edges: {
				node: PostNode;
			}[];
			pageInfo: PageInfo;
		};
	};
}

/**
 * Local storage cache for GraphQL responses
 * Simple in-memory cache implementation to reduce duplicate API calls
 */
const queryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Cache duration in milliseconds
 * - 30 minutes for build-time operations
 * - 5 minutes for runtime operations
 */
const RUNTIME_CACHE_DURATION = 5 * 60 * 1000;
const BUILD_CACHE_DURATION = 30 * 60 * 1000;

/** Default request timeout in ms (prevents builds hanging on slow/unresponsive WordPress) */
const API_FETCH_TIMEOUT_MS = 30_000;

/** Number of retries for transient failures (5xx or network errors) */
const API_FETCH_RETRIES = 3;

/** Initial backoff in ms; doubles each retry */
const API_FETCH_RETRY_INITIAL_MS = 1_000;

// Determine if we're in a build context
const IS_BUILD_CONTEXT =
	typeof process !== "undefined" && process.env.NODE_ENV === "production";
const CACHE_DURATION = IS_BUILD_CONTEXT
	? BUILD_CACHE_DURATION
	: RUNTIME_CACHE_DURATION;

/**
 * Execute a GraphQL query with caching
 * Leverages Astro's built-in fetch with caching when available
 */
async function executeQuery<T>(
	query: string,
	variables: Record<string, unknown> = {},
	cacheKey: string = "",
	bypassCache: boolean = false,
): Promise<T> {
	// Generate a cache key if not provided
	const finalCacheKey = cacheKey || `${query}${JSON.stringify(variables)}`;

	log.debug(
		`executeQuery called for ${cacheKey} (bypass cache: ${bypassCache})`,
	);

	// Check cache if not bypassing
	if (!bypassCache && queryCache.has(finalCacheKey)) {
		const { data, timestamp } = queryCache.get(finalCacheKey) as CacheEntry<T>;
		// Use cache if it's not expired
		if (Date.now() - timestamp < CACHE_DURATION) {
			log.debug(
				`Using cached data for ${cacheKey}, age: ${(Date.now() - timestamp) / 1000}s`,
			);
			return data;
		}
		// Remove expired cache entry
		log.debug(`Cache expired for ${cacheKey}, fetching fresh data`);
		queryCache.delete(finalCacheKey);
	}

	try {
		// Prepare headers with authentication
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			Accept: "application/json",
		};

		log.debug("Preparing authentication headers...");

		// Add authentication if environment variables are set.
		// Never log WP_APP_PASSWORD, REVALIDATE_TOKEN, WP_JWT_TOKEN, WP_AUTH_NONCE or other secrets.
		// Method 1: Application Password (WordPress 5.6+)
		if (import.meta.env.WP_APP_USERNAME && import.meta.env.WP_APP_PASSWORD) {
			try {
				log.debug("Using Basic Auth for API request");
				// Use browser's btoa for compatibility
				const auth =
					typeof btoa === "function"
						? btoa(
								`${import.meta.env.WP_APP_USERNAME}:${import.meta.env.WP_APP_PASSWORD}`,
							)
						: Buffer.from(
								`${import.meta.env.WP_APP_USERNAME}:${import.meta.env.WP_APP_PASSWORD}`,
							).toString("base64");

				headers["Authorization"] = `Basic ${auth}`;
				log.debug("Added Basic Auth header for API request");
			} catch (e) {
				log.error("Error creating Basic Auth header: " + e);
			}
		} else if (import.meta.env.WP_JWT_TOKEN) {
			// Method 2: JWT Authentication if using a JWT plugin
			headers["Authorization"] = `Bearer ${import.meta.env.WP_JWT_TOKEN}`;
			log.debug("Added JWT Auth header for API request");
		} else if (import.meta.env.WP_AUTH_NONCE) {
			// Method 3: WPGraphQL Authentication plugin (nonce-based)
			headers["X-WP-Nonce"] = import.meta.env.WP_AUTH_NONCE;
			log.debug("Added WP Nonce header for API request");
		} else {
			log.debug("No auth credentials found in environment variables");
		}

		const fetchOptions: FetchOptions = {
			method: "post",
			headers,
			body: JSON.stringify({
				query,
				variables,
			}),
		};

		// Add cache options if in Astro SSG/SSR context (not in browser)
		// Since we can't directly check for Astro, check if we're in a browser context
		if (typeof window === "undefined") {
			fetchOptions.cache = bypassCache ? "no-store" : "force-cache";
			log.debug(`Using fetch cache policy: ${fetchOptions.cache}`);
		} else {
			log.debug("Running in browser context, not setting fetch cache policy");
		}

		log.debug(
			`Fetching from WordPress API URL: ${import.meta.env.WORDPRESS_API_URL}`,
		);
		log.debug(
			"Headers: " +
				Object.fromEntries(
					Object.entries(headers).map(([k, v]) =>
						k === "Authorization" ? [k, "Basic ***"] : [k, v],
					),
				),
		);
		log.debug("Request body length: " + fetchOptions.body?.toString().length);

		const sleep = (ms: number) =>
			new Promise<void>((resolve) => setTimeout(resolve, ms));

		let lastError: unknown;
		for (let attempt = 0; attempt <= API_FETCH_RETRIES; attempt++) {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				API_FETCH_TIMEOUT_MS,
			);
			const requestOptions: RequestInit = {
				...fetchOptions,
				signal: controller.signal,
			};

			try {
				log.debug(
					`Sending fetch request...${attempt > 0 ? ` (retry ${attempt}/${API_FETCH_RETRIES})` : ""}`,
				);
				const response = await fetch(
					import.meta.env.WORDPRESS_API_URL,
					requestOptions,
				);
				clearTimeout(timeoutId);

				log.debug(`Response status: ${response.status} ${response.statusText}`);
				log.debug(
					"Response headers:",
					Object.fromEntries([...response.headers.entries()]),
				);

				if (!response.ok) {
					const errorText = await response.text();
					log.error("Error response body: " + errorText);
					const err = new Error(
						`GraphQL request failed: ${response.status} ${response.statusText}`,
					);
					if (response.status >= 500 && attempt < API_FETCH_RETRIES) {
						const backoff = API_FETCH_RETRY_INITIAL_MS * Math.pow(2, attempt);
						log.debug(
							`Server error ${response.status}, retrying in ${backoff}ms...`,
						);
						lastError = err;
						await sleep(backoff);
						continue;
					}
					throw err;
				}

				log.debug("Response OK, parsing JSON...");
				const result = (await response.json()) as GraphQLResponse<T>;

				if (result.errors && result.errors.length) {
					log.error(
						"GraphQL result contains errors: " + JSON.stringify(result.errors),
					);
					throw new Error(
						`GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`,
					);
				}

				log.debug("GraphQL query successful");

				queryCache.set(finalCacheKey, {
					data: result.data,
					timestamp: Date.now(),
				});

				return result.data;
			} catch (fetchError) {
				clearTimeout(timeoutId);
				const isAbort =
					(fetchError as { name?: string })?.name === "AbortError";
				const isNetwork =
					fetchError instanceof TypeError &&
					((fetchError as Error).message === "fetch failed" ||
						(fetchError as { cause?: { code?: string } })?.cause?.code ===
							"ECONNREFUSED");
				const retryable = (isAbort || isNetwork) && attempt < API_FETCH_RETRIES;
				if (retryable) {
					const backoff = API_FETCH_RETRY_INITIAL_MS * Math.pow(2, attempt);
					log.debug(
						`Request failed (${isAbort ? "timeout" : "network"}), retrying in ${backoff}ms...`,
					);
					lastError = fetchError;
					await sleep(backoff);
					continue;
				}
				log.error("Fetch operation failed: " + fetchError);
				throw fetchError;
			}
		}
		log.error("Fetch operation failed after retries: " + lastError);
		throw lastError;
	} catch (error) {
		log.error(`GraphQL query error: ${(error as Error).message}`);
		throw error;
	}
}

const SETTINGS_CACHE_KEY = "settings";
const NAV_CACHE_KEY = "navigation";

const SETTINGS_FALLBACK: SettingsResponse = {
	generalSettings: {
		title: DEFAULT_APP_NAME,
		url: import.meta.env.PUBLIC_SITE_URL || "https://example.com",
		description: DEFAULT_APP_DESCRIPTION,
	},
	allSettings: {
		readingSettingsPostsPerPage: 10,
	},
};

const NAV_FALLBACK: MenusResponse = {
	menus: {
		nodes: [
			{
				name: "Primary",
				menuItems: {
					nodes: [
						{ uri: "/", url: "/", order: 1, label: "Home" },
						{ uri: "/about/", url: "/about/", order: 2, label: "About" },
						{
							uri: "/contact/",
							url: "/contact/",
							order: 3,
							label: "Contact",
						},
					],
				},
			},
		],
	},
};

/**
 * Get site settings from WordPress.
 * On failure, returns stale data from cache if available (stale-while-revalidate), else static fallback.
 */
export async function settingsQuery(): Promise<SettingsQueryResult> {
	try {
		const data = await executeQuery<SettingsResponse>(
			`{
      generalSettings { title url description }
      allSettings { readingSettingsPostsPerPage }
    }`,
			{},
			SETTINGS_CACHE_KEY,
		);
		return { data, fromFallback: false };
	} catch (error) {
		log.error("Error fetching settings: " + error);
		const cached = queryCache.get(SETTINGS_CACHE_KEY) as
			| CacheEntry<SettingsResponse>
			| undefined;
		if (cached?.data) {
			return { data: cached.data, fromFallback: false };
		}
		return { data: SETTINGS_FALLBACK, fromFallback: true };
	}
}

/**
 * Get navigation menu from WordPress.
 * On failure, returns stale data from cache if available, else static fallback.
 */
export async function navQuery(): Promise<NavQueryResult> {
	try {
		const data = await executeQuery<MenusResponse>(
			`{
      menus(where: {location: PRIMARY}) {
        nodes {
          name
          menuItems { nodes { uri url order label } }
        }
      }
    }`,
			{},
			NAV_CACHE_KEY,
		);
		return { data, fromFallback: false };
	} catch (error) {
		log.error("Error fetching nav: " + error);
		const cached = queryCache.get(NAV_CACHE_KEY) as
			| CacheEntry<MenusResponse>
			| undefined;
		if (cached?.data) {
			return { data: cached.data, fromFallback: false };
		}
		return { data: NAV_FALLBACK, fromFallback: true };
	}
}

/**
 * Get posts from WordPress with pagination support
 *
 * @requires WPGraphQL Offset Pagination plugin (https://github.com/valu-digital/wp-graphql-offset-pagination)
 * This function uses the offsetPagination argument which requires the plugin to be installed on WordPress.
 */
export async function getPosts(
	$first: number = 20,
	$page: number = 1,
): Promise<PostsResponse> {
	try {
		// Calculate offset for pagination
		const $offset = ($page - 1) * $first;

		const query = `query GET_POSTS($first: Int, $offset: Int) {
      posts(where: { offsetPagination: { offset: $offset, size: $first } }) {
        edges {
          node {
            id
            title
            date
            dateGmt
            modified
            modifiedGmt
            uri
            excerpt
            content
            categories {
              nodes {
                name
                uri
              }
            }                    
            featuredImage {
              node {
                mediaItemUrl
                altText
              }
            }
          }
        }
        pageInfo {
          total
          hasNextPage
          endCursor
        }                  
      }
    }`;

		// Use a cache key that includes pagination parameters
		const cacheKey = `posts-${$first}-${$page}`;

		// Pass both first and offset for proper pagination
		return await executeQuery<PostsResponse>(
			query,
			{ first: $first, offset: $offset },
			cacheKey,
		);
	} catch (error) {
		log.error("Error fetching posts: " + error);
		// Return fallback data for development
		return {
			posts: {
				edges: [
					{
						node: {
							id: "post-1",
							title: "Example Post 1",
							date: new Date().toISOString(),
							dateGmt: new Date().toISOString(),
							modified: new Date().toISOString(),
							modifiedGmt: new Date().toISOString(),
							uri: "/example-post-1/",
							excerpt: "<p>This is a sample post excerpt.</p>",
							content: "<p>This is sample post content.</p>",
							categories: {
								nodes: [{ name: "Sample Category", uri: "/category/sample/" }],
							},
							featuredImage: {
								node: {
									mediaItemUrl: "/logo.svg",
									altText: "Example image",
								},
							},
						},
					},
				],
				pageInfo: {
					total: 1,
					hasNextPage: false,
					endCursor: "",
				},
			},
		};
	}
}

/**
 * Get posts by category from WordPress with pagination support
 *
 * Uses standard WPGraphQL cursor-based pagination
 */
export async function getPostsByCategory(
	$category: string,
	$first: number = 20,
	$page: number = 1,
): Promise<CategoryPostsResponse> {
	try {
		// Calculate cursor for pagination if not on first page
		// We'll fetch the cursor in a separate query if needed
		let afterCursor = null;

		// If we're requesting beyond the first page, we need to get the cursor
		if ($page > 1) {
			// First get the cursor at the position we need
			const cursorIndex = ($page - 1) * $first - 1; // Position of the last item on the previous page

			// Get the cursor for pagination
			const cursorQuery = `query GET_CURSOR($category: ID!) {
        category(id: $category, idType: SLUG) {
          posts(first: ${cursorIndex + 1}) {
            edges {
              cursor
            }
          }
        }
      }`;

			try {
				const cursorData = await executeQuery(
					cursorQuery,
					{ category: $category },
					`cursor-${$category}-${cursorIndex}`,
				);

				// Get the last cursor
				if (cursorData?.category?.posts?.edges?.[cursorIndex]) {
					afterCursor = cursorData.category.posts.edges[cursorIndex].cursor;
					log.debug(`Using cursor for page ${$page}: ${afterCursor}`);
				}
			} catch (cursorError) {
				log.error(`Error getting cursor for pagination: ${cursorError}`);
				// If we fail to get the cursor, we'll just try to get the first page
			}
		}

		// Build our main query, using the cursor if we have one
		const query = `query GET_POSTS_BY_CATEGORY($category: ID!, $first: Int, $after: String) {
      category(id: $category, idType: SLUG) {
        name
        slug
        posts(first: $first, after: $after) {
          edges {
            node {
              id
              postId
              title
              date
              dateGmt
              modified
              modifiedGmt
              uri
              link
              guid
              excerpt
              content
              featuredImage {
                node {
                  mediaItemUrl
                  altText
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            total
          }
        }
      }
    }`;

		// Use a cache key that includes category and pagination parameters
		const cacheKey = `category-${$category}-${$first}-${$page}`;

		return await executeQuery<CategoryPostsResponse>(
			query,
			{
				category: $category,
				first: $first,
				after: afterCursor,
			},
			cacheKey,
		);
	} catch (error) {
		log.error(`Error fetching posts for category ${$category}: ` + error);
		// Return fallback data for development
		return {
			category: {
				name: $category.charAt(0).toUpperCase() + $category.slice(1),
				slug: $category,
				posts: {
					edges: [
						{
							node: {
								id: "post-1",
								postId: 1,
								title: `Example Post in ${$category}`,
								date: new Date().toISOString(),
								dateGmt: new Date().toISOString(),
								modified: new Date().toISOString(),
								modifiedGmt: new Date().toISOString(),
								uri: "/example-category-post/",
								link: "/example-category-post/",
								guid: "https://example.com/example-category-post/",
								excerpt: "<p>This is a sample post excerpt in a category.</p>",
								content: "<p>This is sample post content in a category.</p>",
								featuredImage: {
									node: {
										mediaItemUrl: "/logo.svg",
										altText: "Example image",
									},
								},
							},
						},
					],
					pageInfo: {
						hasNextPage: false,
						hasPreviousPage: false,
						total: 1,
					},
				},
			},
		};
	}
}

/**
 * Get a node by its URI from WordPress
 */
export async function getNodeByURI(uri: string): Promise<NodeByUriResponse> {
	try {
		const query = `query GetNodeByURI($uri: String!) {
      nodeByUri(uri: $uri) {
        __typename
        ... on Post {
          id
          postId
          title
          date
          dateGmt
          modified
          modifiedGmt
          uri
          link
          guid
          excerpt
          content
          categories {
            nodes {
              name
              uri
            }
          }                    
          featuredImage {
            node {
              mediaItemUrl
              altText
            }
          }
          next {
            id
            title
            uri
          }
          previous {
            id
            title
            uri
          }                    
        }
        ... on Page {
          id
          title
          slug
          uri
          date
          content
          featuredImage {
            node {
              mediaItemUrl
              altText
            }
          }                    
        }
        ... on Category {
          id
          name
          slug
          posts {
            nodes {
              id
              title
              date
              dateGmt
              modified
              modifiedGmt
              uri
              excerpt
              content
              featuredImage {
                node {
                  mediaItemUrl
                  altText
                }
              }
            }
          }
        }
        ... on Tag {
          id
          name
          slug
          posts {
            nodes {
              id
              title
              date
              dateGmt
              modified
              modifiedGmt
              uri
              excerpt
              content
              featuredImage {
                node {
                  mediaItemUrl
                  altText
                }
              }
            }
          }
        }                  
      }
    }`;

		// Special case for nodes: don't cache the current page/post being viewed
		// This ensures we always get fresh content for the current page
		// In client context, never bypass cache; in SSR context, always bypass cache for direct page views
		const bypassCache = true; // Always get fresh content when directly viewing a page
		return await executeQuery<NodeByUriResponse>(
			query,
			{ uri },
			`uri-${uri}`,
			bypassCache,
		);
	} catch (error) {
		log.error(`Error fetching node by URI ${uri}: ` + error);
		// Return fallback data for development
		return {
			nodeByUri: {
				__typename: "Post",
				id: "post-fallback",
				postId: 999,
				title: "Fallback Post",
				date: new Date().toISOString(),
				dateGmt: new Date().toISOString(),
				modified: new Date().toISOString(),
				modifiedGmt: new Date().toISOString(),
				uri: uri,
				link: uri,
				guid: `https://example.com${uri}`,
				excerpt: "<p>This is a fallback post excerpt.</p>",
				content: "<p>This is fallback post content.</p>",
				categories: {
					nodes: [{ name: "Fallback Category", uri: "/category/fallback/" }],
				},
				featuredImage: {
					node: {
						mediaItemUrl: "/logo.svg",
						altText: "Fallback image",
					},
				},
				next: null,
				previous: null,
			},
		};
	}
}

const ALL_URIS_PAGE_SIZE = 100;
const ALL_URIS_MERGED_CACHE_KEY = "all-uris-merged";

function uriNodeToParams(node: { uri: string }): UriParams {
	let trimmedURI = node.uri.substring(1);
	trimmedURI = trimmedURI.substring(0, trimmedURI.length - 1);
	return { params: { uri: trimmedURI } };
}

/**
 * Get all URIs from WordPress for static path generation.
 * Uses cursor-based pagination for posts and pages so sites with >1000 items are fully covered.
 */
export async function getAllUris(): Promise<UriParams[]> {
	try {
		if (queryCache.has(ALL_URIS_MERGED_CACHE_KEY)) {
			const entry = queryCache.get(ALL_URIS_MERGED_CACHE_KEY) as
				| CacheEntry<UriParams[]>
				| undefined;
			if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
				log.debug("Returning cached merged URIs");
				return entry.data;
			}
		}

		const termsCategoriesQuery = `query GetTermsCategoriesUris {
      terms { nodes { uri } }
      categories { nodes { uri } }
    }`;
		const termsCategories = await executeQuery<TermsCategoriesUrisResponse>(
			termsCategoriesQuery,
			{},
			"all-uris-terms-categories",
			false,
		);

		const postsPageQuery = `query GetPostsUrisPage($after: String) {
      posts(first: ${ALL_URIS_PAGE_SIZE}, after: $after) {
        nodes { uri }
        pageInfo { hasNextPage endCursor }
      }
    }`;
		const postNodes: { uri: string }[] = [];
		let postsAfter: string | null = null;
		do {
			const postsData = await executeQuery<{ posts: UriPageResponse }>(
				postsPageQuery,
				{ after: postsAfter },
				`all-uris-posts-${postsAfter ?? "initial"}`,
				false,
			);
			postNodes.push(...postsData.posts.nodes);
			postsAfter = postsData.posts.pageInfo.hasNextPage
				? postsData.posts.pageInfo.endCursor
				: null;
		} while (postsAfter !== null);

		const pagesPageQuery = `query GetPagesUrisPage($after: String) {
      pages(first: ${ALL_URIS_PAGE_SIZE}, after: $after) {
        nodes { uri }
        pageInfo { hasNextPage endCursor }
      }
    }`;
		const pageNodes: { uri: string }[] = [];
		let pagesAfter: string | null = null;
		do {
			const pagesData = await executeQuery<{ pages: UriPageResponse }>(
				pagesPageQuery,
				{ after: pagesAfter },
				`all-uris-pages-${pagesAfter ?? "initial"}`,
				false,
			);
			pageNodes.push(...pagesData.pages.nodes);
			pagesAfter = pagesData.pages.pageInfo.hasNextPage
				? pagesData.pages.pageInfo.endCursor
				: null;
		} while (pagesAfter !== null);

		const allNodes: { uri: string }[] = [
			...termsCategories.terms.nodes,
			...termsCategories.categories.nodes,
			...postNodes,
			...pageNodes,
		];
		const result = allNodes.map(uriNodeToParams);

		queryCache.set(ALL_URIS_MERGED_CACHE_KEY, {
			data: result,
			timestamp: Date.now(),
		});
		log.debug(`Total URIs fetched for static paths: ${result.length}`);
		return result;
	} catch (error) {
		log.error("Error fetching all URIs: " + error);
		return [
			{ params: { uri: "example-post-1" } },
			{ params: { uri: "example-post-2" } },
			{ params: { uri: "about" } },
			{ params: { uri: "contact" } },
			{ params: { uri: "category/sample" } },
		];
	}
}
