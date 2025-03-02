/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly WORDPRESS_API_URL: string;
  readonly PUBLIC_DISQUS_EMBED_URL: string;
  readonly PUBLIC_X_SHARE_USER: string;
  readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
