import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.js"],
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "e2e"],
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
			"astro:content": path.resolve(
				__dirname,
				"./vitest.astro-content-mock.js",
			),
		},
	},
});
