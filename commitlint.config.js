export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			[
				"feat", // New feature
				"fix", // Bug fix
				"docs", // Documentation only changes
				"style", // Changes that don't affect code meaning (formatting, etc)
				"refactor", // Code change that neither fixes a bug nor adds a feature
				"perf", // Performance improvement
				"test", // Adding or updating tests
				"build", // Changes to build system or dependencies
				"ci", // Changes to CI configuration files and scripts
				"chore", // Other changes that don't modify src or test files
				"revert", // Reverts a previous commit
			],
		],
		"subject-case": [2, "never", ["upper-case"]],
		"header-max-length": [2, "always", 100],
	},
};
