/**
 * Service Worker Generator
 * 
 * This script generates the service-worker.js file with dynamic cache names
 * based on site metadata from WordPress or environment variables.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'cross-fetch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory names
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const templatePath = path.join(__dirname, './service-worker-template.js');
const outputPublicPath = path.join(publicDir, 'service-worker.js');
const outputDistPath = path.join(distDir, 'service-worker.js');

// Default cache prefix if we can't get from WordPress or env
const DEFAULT_CACHE_PREFIX = 'wp-graphql-astro';

/**
 * Fetch site name from WordPress to use as cache prefix
 */
async function getSiteNameFromWordPress() {
  try {
    // GraphQL query to get site title
    const query = `{
      generalSettings {
        title
      }
    }`;
    
    // Headers with authentication if available
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (process.env.WP_APP_USERNAME && process.env.WP_APP_PASSWORD) {
      const auth = Buffer.from(`${process.env.WP_APP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    
    console.log("Fetching site name from WordPress...");
    const response = await fetch(process.env.WORDPRESS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.generalSettings?.title) {
        // Convert title to kebab-case and lowercase for cache name
        const title = data.data.generalSettings.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        console.log(`Using site name for cache prefix: ${title}`);
        return title;
      }
    }
    
    throw new Error("Couldn't get site name from WordPress");
  } catch (error) {
    console.error("Error fetching site name:", error.message);
    return null;
  }
}

/**
 * Get cache prefix from environment variable or WordPress
 */
async function getCachePrefix() {
  // First try from environment variable
  if (process.env.PUBLIC_SITE_NAME) {
    const siteName = process.env.PUBLIC_SITE_NAME
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
      
    console.log(`Using PUBLIC_SITE_NAME env var for cache prefix: ${siteName}`);
    return siteName;
  }
  
  // Then try extracting from PUBLIC_SITE_URL if available
  if (process.env.PUBLIC_SITE_URL) {
    try {
      const url = new URL(process.env.PUBLIC_SITE_URL);
      const hostname = url.hostname
        .replace('www.', '')
        .replace(/\./g, '-');
      
      console.log(`Using hostname from PUBLIC_SITE_URL for cache prefix: ${hostname}`);
      return hostname;
    } catch (e) {
      console.error("Error parsing PUBLIC_SITE_URL:", e);
    }
  }
  
  // Then try WordPress API
  const wpSiteName = await getSiteNameFromWordPress();
  if (wpSiteName) {
    return wpSiteName;
  }
  
  // Fallback to default
  console.log(`Using default cache prefix: ${DEFAULT_CACHE_PREFIX}`);
  return DEFAULT_CACHE_PREFIX;
}

/**
 * Read template file and replace placeholders with dynamic values
 */
async function generateServiceWorker() {
  try {
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      // If not, copy current service worker to use as template
      if (fs.existsSync(outputPublicPath)) {
        fs.copyFileSync(outputPublicPath, templatePath);
        console.log(`Created service worker template from existing file`);
      } else {
        throw new Error("Service worker template not found and no existing file to copy from");
      }
    }
    
    // Read the template file
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Get cache prefix
    const cachePrefix = await getCachePrefix();
    
    // Get version based on current timestamp
    const version = `v${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    
    // Replace cache name placeholders
    let serviceWorkerContent = template
      .replace(/const CACHE_NAME = ['"].*?['"]/g, `const CACHE_NAME = '${cachePrefix}-${version}'`)
      .replace(/const CONTENT_CACHE = ['"].*?['"]/g, `const CONTENT_CACHE = '${cachePrefix}-content-${version}'`)
      .replace(/const STATIC_CACHE = ['"].*?['"]/g, `const STATIC_CACHE = '${cachePrefix}-static-${version}'`)
      .replace(/const IMAGE_CACHE = ['"].*?['"]/g, `const IMAGE_CACHE = '${cachePrefix}-images-${version}'`)
      .replace(/const API_CACHE = ['"].*?['"]/g, `const API_CACHE = '${cachePrefix}-api-${version}'`);
    
    // Add generation timestamp comment
    const timestamp = new Date().toISOString();
    serviceWorkerContent = serviceWorkerContent.replace(
      /DO NOT EDIT THIS FILE DIRECTLY/,
      `DO NOT EDIT THIS FILE DIRECTLY\n * Generated on: ${timestamp} with prefix: ${cachePrefix}`
    );
    
    // Write to public directory
    fs.writeFileSync(outputPublicPath, serviceWorkerContent);
    console.log(`Service worker generated with cache prefix "${cachePrefix}" in public dir`);
    
    // Write to dist directory if it exists (for production builds)
    if (fs.existsSync(path.dirname(outputDistPath))) {
      fs.writeFileSync(outputDistPath, serviceWorkerContent);
      console.log(`Service worker generated with cache prefix "${cachePrefix}" in dist dir`);
    }
    
    return true;
  } catch (error) {
    console.error("Error generating service worker:", error);
    return false;
  }
}

// Execute the script
generateServiceWorker();