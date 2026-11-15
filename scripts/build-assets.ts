import { cp, mkdir, rm } from 'node:fs/promises';
import { build } from 'vite';

if (process.argv.includes('--clean')) await rm('_site', { recursive: true, force: true });

await mkdir('src/assets', { recursive: true });
await cp('node_modules/@fontsource/ibm-plex-mono/files', 'src/assets/fonts', {
  recursive: true,
  filter: (path) => !path.endsWith('.woff') && (!path.endsWith('.woff2') ||
    /ibm-plex-mono-(latin|cyrillic)-(400|500|600)-normal\.woff2$/.test(path)),
});
await cp('node_modules/@fontsource/ibm-plex-mono/LICENSE', 'src/assets/fonts/OFL.txt');
await mkdir('src/assets/icons', { recursive: true });
for (const name of ['github', 'linkedin', 'x-twitter', 'telegram', 'envelope']) {
  const family = name === 'envelope' ? 'regular' : 'brands';
  await cp(`node_modules/@fortawesome/fontawesome-free/svgs/${family}/${name}.svg`, `src/assets/icons/${name}.svg`);
}
await cp('node_modules/@fortawesome/fontawesome-free/LICENSE.txt', 'src/assets/icons/LICENSE.txt');

await build();
await build({
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  build: {
    outDir: 'src/assets',
    emptyOutDir: false,
    target: 'es2022',
    rollupOptions: {
      input: 'src/scripts/locale.ts',
      output: { format: 'iife', entryFileNames: 'locale.js' },
    },
  },
});
