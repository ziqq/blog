import type { PageData } from './eleventy-data';

export default {
  pagination: { data: 'locales', size: 1, alias: 'locale' },
  eleventyComputed: {
    permalink: (data: PageData) => data.locale === 'ru' ? '/ru/check/' : '/check/',
    title: (data: PageData) => data.i18n[data.locale].checkTitle,
    description: (data: PageData) => data.i18n[data.locale].checkDescription,
  },
};
