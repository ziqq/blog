export default {
  locale: 'en',
  title: '',
  description: '',
  eleventyComputed: {
    strings: (data) => data.i18n[data.locale],
    home: (data) => data.locale === 'ru' ? '/ru/' : '/',
  },
};
