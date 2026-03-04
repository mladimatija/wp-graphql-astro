module.exports = {
	plugins: {
		cssnano: {},
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
	},
};
