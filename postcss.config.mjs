/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // vendor prefixes for older phone browsers
  },
};

export default config;
