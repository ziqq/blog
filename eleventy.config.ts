import { execFileSync } from 'node:child_process';

type Locale = 'en' | 'ru';

interface PostData {
  locale: Locale;
}

interface CollectionPost {
  url: string;
  date: Date;
  data: PostData;
}

interface PostYear {
  year: number;
  locale: Locale;
  posts: CollectionPost[];
}

interface CollectionApi {
  getFilteredByTag(tag: string): CollectionPost[];
}

interface LanguageAlternates {
  en: string;
  ru: string;
}

interface EleventyConfig {
  setNunjucksEnvironmentOptions(options: { autoescape: boolean; throwOnUndefined: boolean }): void;
  addPassthroughCopy(input: Record<string, string>): void;
  addWatchTarget(target: string): void;
  on(event: 'eleventy.beforeWatch', handler: (changed: string[]) => void): void;
  addFilter(name: 'shortDate', filter: (date: Date, locale: Locale) => string): void;
  addFilter(name: 'fullDate', filter: (date: Date, locale: Locale) => string): void;
  addFilter(name: 'isoDate', filter: (date: Date) => string): void;
  addFilter(name: 'inLanguage', filter: (groups: PostYear[], locale: Locale) => PostYear[]): void;
  addFilter(
    name: 'languageAlternates',
    filter: (url: string, section: string, posts: CollectionPost[]) => LanguageAlternates,
  ): void;
  addCollection(name: 'postYears', collection: (collection: CollectionApi) => PostYear[]): void;
}

export default function (config: EleventyConfig) {
  config.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: true });
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addWatchTarget('src/styles/');
  config.addWatchTarget('src/scripts/');
  config.addWatchTarget('src/_data/');
  config.addWatchTarget('src/**/*.11tydata.ts');
  config.addWatchTarget('src/eleventy-data.ts');
  config.on('eleventy.beforeWatch', (changed) => {
    if (changed.some((file) => /^src\/(styles|scripts)\//.test(file))) {
      execFileSync(process.execPath, ['scripts/build-assets.js'], { stdio: 'inherit' });
    }
    if (changed.some((file) => file === 'eleventy.config.ts' || /^src\/(_data\/|eleventy-data\.ts$|.*\.11tydata\.ts$)/.test(file))) {
      execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
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
    const years = new Map<string, PostYear>();
    for (const post of collection.getFilteredByTag('post').reverse()) {
      const year = post.date.getUTCFullYear();
      const key = `${post.data.locale}:${year}`;
      if (!years.has(key)) years.set(key, { year, locale: post.data.locale, posts: [] });
      years.get(key)?.posts.push(post);
    }
    return Array.from(years.values());
  });
  return { dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' } };
}
