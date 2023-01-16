module.exports = {
  plugins: [
    require("autoprefixer"),
    require("cssnano"),
    require("postcss-import"),
    require("postcss-preset-env")({ stage: 1 }),
    require("stylelint"),
  ],
};
