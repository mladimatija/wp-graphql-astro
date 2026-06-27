/**
 * Build-time script to generate static files with consistent branding.
 *
 * Reads template sources from `src/templates/` and writes the substituted
 * outputs to their canonical locations. The outputs are gitignored - edit the
 * source templates rather than the generated files.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import constants and logging utilities
import {
	DEFAULT_APP_DESCRIPTION,
	DEFAULT_APP_NAME,
	log,
	// eslint-disable-next-line import/extensions
} from "../lib/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");
const templatesDir = path.join(rootDir, "src/templates");
const publicDir = path.join(rootDir, "public");
const contentConfigDir = path.join(rootDir, "src/content/config");

// Source → destination mapping with the placeholder map for each output.
// Note: manifest.json is handled by fix-manifest.js (it pulls WordPress data
// dynamically); only static-branding files belong here.
const filesToProcess = [
	{
		source: path.join(templatesDir, "offline.html"),
		destination: path.join(publicDir, "offline.html"),
		replacements: {
			"${APP_NAME}": DEFAULT_APP_NAME,
		},
	},
	{
		source: path.join(templatesDir, "seo.md"),
		destination: path.join(contentConfigDir, "seo.md"),
		replacements: {
			"${APP_NAME}": DEFAULT_APP_NAME,
			"${APP_DESCRIPTION}": DEFAULT_APP_DESCRIPTION,
		},
	},
];

filesToProcess.forEach((file) => {
	try {
		let processedContent = fs.readFileSync(file.source, "utf8");
		for (const [placeholder, value] of Object.entries(file.replacements)) {
			processedContent = processedContent.replaceAll(placeholder, value);
		}

		// Make sure the destination directory exists before writing.
		fs.mkdirSync(path.dirname(file.destination), { recursive: true });
		fs.writeFileSync(file.destination, processedContent);

		log.info(
			`Generated ${path.relative(rootDir, file.destination)} from ${path.relative(
				rootDir,
				file.source,
			)}`,
		);
	} catch (error) {
		log.error(`Error generating ${path.basename(file.destination)}: ${error}`);
		process.exit(1);
	}
});

log.info("All static files processed successfully!");
