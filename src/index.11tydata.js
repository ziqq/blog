export default {
  pagination: { data: 'locales', size: 1, alias: 'locale' },
  eleventyComputed: { permalink: (data) => data.locale === 'ru' ? '/ru/' : '/' },
};
