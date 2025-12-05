/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly WORDPRESS_API_URL: string;
  readonly PUBLIC_DISQUS_EMBED_URL: string;
  readonly PUBLIC_X_SHARE_USER: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_ANALYTICS_ENDPOINT: string;

  // WordPress Authentication (optional)
  readonly WP_APP_USERNAME?: string;
  readonly WP_APP_PASSWORD?: string;
  readonly WP_JWT_TOKEN?: string;
  readonly WP_AUTH_NONCE?: string;

  // Debug flag (optional)
  readonly PUBLIC_DEBUG?: string;

  // Revalidation token
  readonly REVALIDATE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add View Transitions API types
// These extend the Document interface to include View Transitions API methods
interface Document {
  startViewTransition?: (callback: () => Promise<void> | void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition: () => void;
  };
}

interface CSSStyleDeclaration {
  viewTransitionName?: string;
}
