/**
 * Manifest Generator Script
 *
 * This script fetches site data from WordPress GraphQL and updates manifest.json
 * for PWA functionality. It replaces the process-templates.js approach for manifest
 * with dynamic WordPress data.
 */
import fetch from 'cross-fetch';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// Simple logging utility for node scripts
const log = {
    info: (message) => {
        // Always show in CI/CD
        if (process.env.CI || process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
            console.log('[INFO]', message);
        }
    },
    error: (message, details) => {
        console.error('[ERROR]', message, details || '');
    }
};

// Import constants for fallbacks
// Constants for manifest generation
const DEFAULT_APP_NAME = "WP GraphQL Astro";
const DEFAULT_APP_SHORT_NAME = "WP Astro";
const DEFAULT_APP_DESCRIPTION = "A modern headless WordPress implementation using Astro and GraphQL";
const DEFAULT_THEME_COLOR = "#29aae1";
const DEFAULT_BG_COLOR = "#ffffff";
const DEFAULT_ICONS = [
    {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
    },
    {
        src: "/logo.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any"
    }
];

dotenv.config();

log.info("Starting manifest generator");
log.info(`WordPress API URL: ${process.env.WORDPRESS_API_URL}`);
log.info(`Auth credentials: Username=${process.env.WP_APP_USERNAME ? 'Set' : 'Not set'}, Password=${process.env.WP_APP_PASSWORD ? 'Set' : 'Not set'}`);

// Get directories
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

// GraphQL query to get site information
const query = `{
  generalSettings {
    title
    description
    url
    language
  }
  mediaItems(first: 5, where: {search: "logo"}) {
    nodes {
      id
      mediaItemUrl
      mimeType
      mediaDetails {
        width
        height
      }
    }
  }
}`;

// Headers with authentication
const headers = {
    'Content-Type': 'application/json'
};

// Add auth if available
if (process.env.WP_APP_USERNAME && process.env.WP_APP_PASSWORD) {
    const auth = Buffer.from(`${process.env.WP_APP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
}

/**
 * Generate manifest from WordPress data or fallback to constants
 */
async function generateManifest() {
    let wpData = null;

    try {
        log.info("Fetching data from WordPress GraphQL API...");
        const response = await fetch(process.env.WORDPRESS_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({query})
        });

        log.info(`Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const result = await response.json();
            log.info("Successfully received WordPress data");

            if (!result.errors && result.data) {
                wpData = result.data;
            } else if (result.errors) {
                log.error("GraphQL errors:", result.errors);
            }
        } else {
            log.error(`WordPress request failed: ${response.status}`);
            try {
                const errorText = await response.text();
                log.error("Error response:", errorText);
            } catch (e) {
                log.error(e);
            }
        }
    } catch (error) {
        log.error("Error fetching WordPress data:", error);
    }

    // Create manifest data using WordPress with fallbacks
    const title = wpData?.generalSettings?.title || DEFAULT_APP_NAME;
    const description = wpData?.generalSettings?.description || DEFAULT_APP_DESCRIPTION;

    // Generate short name - keep it shorter if title is long
    const shortName = wpData?.generalSettings?.title
        ? (wpData?.generalSettings.title.split(' ').length > 2
            ? wpData?.generalSettings.title.split(' ').slice(0, 2).join(' ')
            : wpData?.generalSettings.title)
        : DEFAULT_APP_SHORT_NAME;

    // Default icons
    let icons = [
        {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
        },
        {
            src: "/logo.svg",
            sizes: "149x149",
            type: "image/svg+xml",
            purpose: "any"
        }
    ];

    // Add WordPress media library logos if available
    if (wpData?.mediaItems?.nodes) {
        const logoImages = wpData?.mediaItems.nodes.filter(
            node => node.mimeType.startsWith('image/') &&
                node.mediaDetails?.width &&
                node.mediaDetails?.height
        );

        if (logoImages.length > 0) {
            log.info(`Found ${logoImages.length} logo images in WordPress`);

            // Get logo URLs for PWA icons
            const pwaLogos = logoImages.map(img => {
                const width = img.mediaDetails.width;
                const sizes = `${width}x${img.mediaDetails.height}`;
                return {
                    src: img.mediaItemUrl,
                    sizes: sizes,
                    type: img.mimeType,
                    purpose: "any"
                };
            });

            // Add WordPress media logos to our icons array
            icons = [...pwaLogos, ...icons];
        }
    }

    // Build complete manifest
    const manifest = {
        name: title,
        short_name: shortName,
        description: description,
        lang: wpData?.generalSettings?.language?.split('-')[0] || "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: DEFAULT_BG_COLOR,
        theme_color: DEFAULT_THEME_COLOR,
        icons: icons,
        screenshots: [
            {
                src: wpData?.mediaItems?.nodes?.[0]?.mediaItemUrl || "https://wp.matijaculjak.com/wp-content/uploads/2016/05/cropped-matija-culjak-logo.png",
                sizes: "512x512",
                type: "image/png",
                form_factor: "wide"
            },
            {
                src: wpData?.mediaItems?.nodes?.[1]?.mediaItemUrl || "https://wp.matijaculjak.com/wp-content/uploads/2016/05/matija-culjak-logo.png",
                sizes: "1200x628",
                type: "image/png"
            }
        ]
    };

    // Log the manifest data we're generating
    log.info("Generated manifest data:");
    log.info(`- name: ${manifest.name}`);
    log.info(`- short_name: ${manifest.short_name}`);
    log.info(`- description: ${manifest.description}`);
    log.info(`- icons: ${manifest.icons.length}`);

    return manifest;
}

/**
 * Write manifest file to the specified directory
 */
function writeManifestFile(directory, manifest) {
    try {
        const manifestPath = path.join(directory, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        log.info(`Manifest written to ${manifestPath}`);
        return true;
    } catch (error) {
        log.error(`Error writing manifest to ${directory}:`, error);
        return false;
    }
}

// Main execution
async function main() {
    try {
        // Generate the manifest data
        const manifest = await generateManifest();

        // Write to public directory (for development)
        writeManifestFile(publicDir, manifest);

        // Write to dist directory if it exists (for production build)
        if (fs.existsSync(distDir)) {
            writeManifestFile(distDir, manifest);
        }

        log.info("Manifest generation completed successfully");
    } catch (error) {
        log.error("Manifest generation failed:", error);
        process.exit(1);
    }
}

main();