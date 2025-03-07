/**
 * Build-time script to generate static files with consistent branding
 * This processes templates with placeholders and replaces them with values from constants
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Constants for templates
const DEFAULT_APP_NAME = "WP GraphQL Astro";
const DEFAULT_APP_SHORT_NAME = "WP Astro";
const DEFAULT_APP_DESCRIPTION = "A modern headless WordPress implementation using Astro and GraphQL";
const DEFAULT_THEME_COLOR = "#29aae1";
const DEFAULT_BG_COLOR = "#ffffff";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../../public');

// Files to process
const filesToProcess = [
  // Note: manifest.json is now handled by fix-manifest.js
  // which gets WordPress data dynamically
  {
    path: path.join(publicDir, 'offline.html'),
    replacements: {
      '${APP_NAME}': DEFAULT_APP_NAME
    }
  },
  {
    path: path.join(__dirname, '../../src/content/config/seo.md'),
    replacements: {
      '${APP_NAME}': DEFAULT_APP_NAME,
      '${APP_DESCRIPTION}': DEFAULT_APP_DESCRIPTION
    }
  }
];

// Process each file
filesToProcess.forEach(file => {
  try {
    // Read the template file
    const templateContent = fs.readFileSync(file.path, 'utf8');
    
    // Apply all replacements
    let processedContent = templateContent;
    for (const [placeholder, value] of Object.entries(file.replacements)) {
      processedContent = processedContent.replaceAll(placeholder, value);
    }
    
    // Write the output file
    fs.writeFileSync(file.path, processedContent);
    
    console.log(`Processed ${path.basename(file.path)} successfully!`);
  } catch (error) {
    console.error(`Error processing ${path.basename(file.path)}:`, error);
    process.exit(1);
  }
});

console.log('All static files processed successfully!');