module.exports = {
  plugins: {
    autoprefixer: {},
    cssnano: {},
    "postcss-import": {},
    "postcss-preset-env": {
      stage: 1,
      features: {
        "custom-selectors": true,
        "nesting-rules": true,
        // Add custom selectors for View Transitions API
        "custom-media-queries": true,
        "logical-properties-and-values": true,
      },
      // Include all experimental selectors
      preserve: true,
      // Define the View Transition API pseudo-classes
      knownPseudoClasses: [
        "view-transition",
        "view-transition-group",
        "view-transition-image-pair",
        "view-transition-new",
        "view-transition-old",
      ],
    },
  },
};
