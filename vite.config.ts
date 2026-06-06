import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  base: '/mcm/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
