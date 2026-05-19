const isProduction = process.env.NODE_ENV === "production";

module.exports = {
	plugins: {
		"postcss-import": {},
		"postcss-preset-env": {
			stage: 1,
			features: {
				"custom-selectors": true,
				"nesting-rules": true,
				"custom-media-queries": true,
				"logical-properties-and-values": true,
			},
			preserve: true,
		},
		...(isProduction ? { cssnano: {} } : {}),
	},
};
