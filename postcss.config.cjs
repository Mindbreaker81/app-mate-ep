const isTestEnvironment =
  process.env.NODE_ENV === 'test' ||
  typeof process.env.VITEST_WORKER_ID !== 'undefined' ||
  process.env.VITEST === 'true';

module.exports = {
  plugins: isTestEnvironment
    ? []
    : [
        require('tailwindcss')(),
        require('autoprefixer')(),
      ],
};
