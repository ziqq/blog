import type { PageData } from './eleventy-data';

export default {
  pagination: { data: 'locales', size: 1, alias: 'locale' },
  eleventyComputed: {
    permalink: (data: PageData) => data.locale === 'ru' ? '/ru/about/' : '/about/',
    title: (data: PageData) => data.i18n[data.locale].aboutTitle,
  },
};
