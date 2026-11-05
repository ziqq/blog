export default {
  pagination: { data: 'locales', size: 1, alias: 'locale' },
  eleventyComputed: {
    permalink: (data) => data.locale === 'ru' ? '/ru/about/' : '/about/',
    title: (data) => data.i18n[data.locale].aboutTitle,
  },
};
