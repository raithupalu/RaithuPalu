/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: ['selector', '[data-theme="dark"]'],
  // Keep CRA's default element styling — we only want Tailwind utilities,
  // not its preflight reset (which would clash with the existing design system).
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
