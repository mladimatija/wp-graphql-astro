import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "public/**",
      "**/*.config.cjs",
      ".astro/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        // Add custom globals that might be missing from predefined lists
        RequestInit: "readonly",
        ReadableStream: "readonly",
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        File: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",

        // Include predefined global variables from ESLint globals
        // Filter out any globals with leading/trailing whitespace
        ...Object.entries(globals.browser).reduce((acc, [key, value]) => {
          const trimmedKey = key.trim();
          if (trimmedKey === key) acc[key] = value;
          return acc;
        }, {}),

        ...Object.entries(globals.node).reduce((acc, [key, value]) => {
          const trimmedKey = key.trim();
          if (trimmedKey === key) acc[key] = value;
          return acc;
        }, {}),

        ...Object.entries(globals.es2021).reduce((acc, [key, value]) => {
          const trimmedKey = key.trim();
          if (trimmedKey === key) acc[key] = value;
          return acc;
        }, {}),
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
          astro: "never",
        },
      ],
      "no-underscore-dangle": "off",
      "no-undef": ["error", { typeof: true }],
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".astro"],
          paths: ["src"],
          // Configure alias
          alias: {
            "@": "./src",
          },
        },
      },
    },
  },
  // Due to compatibility issues with the current version of the Astro ESLint parser and ESLint 9,
  // Astro linting is disabled.
  {
    files: ["**!/!*.astro"],
    plugins: {
      astro: astroPlugin,
    },
    languageOptions: {
      globals: {
        // Add custom globals that might be missing from predefined lists
        RequestInit: "readonly",
        ReadableStream: "readonly",
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        File: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",

        // Include predefined global variables from ESLint globals
        // Filter out any globals with leading/trailing whitespace
        ...Object.entries(globals.browser).reduce((acc, [key, value]) => {
          const trimmedKey = key.trim();
          if (trimmedKey === key) acc[key] = value;
          return acc;
        }, {}),

        ...Object.entries(globals.node).reduce((acc, [key, value]) => {
          const trimmedKey = key.trim();
          if (trimmedKey === key) acc[key] = value;
          return acc;
        }, {}),

        ...Object.entries(globals.es2021).reduce((acc, [key, value]) => {
          const trimmedKey = key.trim();
          if (trimmedKey === key) acc[key] = value;
          return acc;
        }, {}),
      },
      parser: astroPlugin.parser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
        sourceType: "module",
      },
    },
    rules: {
      // These rules are specific to .astro files
      "no-unused-vars": "off", // Handled by TypeScript
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off", // Astro has various globals that ESLint doesn't know about
      "import/no-unresolved": "off", // Astro imports are handled differently

      // Ensure astro-specific rules are enabled
      "astro/no-conflict-set-directives": "error",
      "astro/no-unused-define-vars-in-style": "error",
      "astro/valid-compile": "error",
    },
  },
];
