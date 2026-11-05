import { execFileSync } from 'node:child_process';

export default function (config) {
  config.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: true });
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addWatchTarget('src/styles/');
  config.addWatchTarget('src/scripts/');
  config.on('eleventy.beforeWatch', (changed) => {
    if (changed.some((file) => /src\/(styles|scripts)\//.test(file))) {
      execFileSync(process.execPath, ['scripts/build-assets.mjs'], { stdio: 'inherit' });
    }
  });
  config.addFilter('shortDate', (date, locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date));
  config.addFilter('fullDate', (date, locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date));
  config.addFilter('isoDate', (date) => date.toISOString().slice(0, 10));
  config.addFilter('inLanguage', (groups, locale) => groups.filter((group) => group.locale === locale));
  config.addFilter('languageAlternates', (url, section, posts) => {
    if (typeof url !== 'string') return { en: '', ru: '' };
    const en = url.replace(/^\/ru(?=\/)/, '');
    const ru = `/ru${en}`;
    return {
      en: section !== 'post' || posts.some((post) => post.url === en) ? en : '',
      ru: section !== 'post' || posts.some((post) => post.url === ru) ? ru : '',
    };
  });
  config.addCollection('postYears', (collection) => {
    const years = new Map();
    for (const post of collection.getFilteredByTag('post').reverse()) {
      const year = post.date.getUTCFullYear();
      const key = `${post.data.locale}:${year}`;
      if (!years.has(key)) years.set(key, { year, locale: post.data.locale, posts: [] });
      years.get(key).posts.push(post);
    }
    return Array.from(years.values());
  });
  return { dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' } };
}
