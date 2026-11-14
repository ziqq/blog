import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const source = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  publicDir: false,
  logLevel: 'warn',
  build: {
    outDir: source('assets'),
    emptyOutDir: false,
    target: 'es2022',
    rollupOptions: {
      input: {
        main: source('scripts/main.ts'),
        check: source('scripts/check.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
