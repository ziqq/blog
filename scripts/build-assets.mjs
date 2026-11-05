import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { compileAsync } from 'sass';
import { build } from 'esbuild';

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
const styles = await compileAsync('src/styles/main.scss', { style: 'compressed' });
await writeFile('src/assets/main.css', styles.css);
await build({
  entryPoints: ['src/scripts/main.ts'], outfile: 'src/assets/main.js',
  bundle: true, minify: true, format: 'esm', target: 'es2022',
});

await build({ entryPoints: ['src/scripts/locale.ts'], outfile: 'src/assets/locale.js', bundle: true, minify: true, format: 'iife', target: 'es2022' });
