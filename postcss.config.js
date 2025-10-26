import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const isTestEnvironment =
  process.env.NODE_ENV === 'test' ||
  typeof process.env.VITEST_WORKER_ID !== 'undefined' ||
  process.env.VITEST === 'true';

export default {
  plugins: isTestEnvironment ? [] : [tailwindcss(), autoprefixer()],
};
