/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // Pehle ye sirf 'tailwindcss' tha
    autoprefixer: {},
  },
};

export default config;