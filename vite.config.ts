import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: 'frontend',
  base: command === 'build' ? '/mcm/' : '/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
}));
