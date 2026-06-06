import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
