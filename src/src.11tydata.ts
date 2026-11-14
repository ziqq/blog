import type { Locale, PageData } from './eleventy-data';

export default {
  locale: 'en' as Locale,
  title: '',
  description: '',
  eleventyComputed: {
    strings: (data: PageData) => data.i18n[data.locale],
    home: (data: PageData) => data.locale === 'ru' ? '/ru/' : '/',
  },
};
