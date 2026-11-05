export default {
  layout: 'post.njk',
  tags: ['post'],
  locale: 'ru',
  title: '',
  description: '',
  demo: false,
  eleventyComputed: {
    permalink: (data) => data.demo && process.env.ELEVENTY_RUN_MODE !== 'serve'
      ? false : `${data.locale === 'ru' ? '/ru' : ''}/posts/${data.page.fileSlug}/`,
    eleventyExcludeFromCollections: (data) =>
      data.demo && process.env.ELEVENTY_RUN_MODE !== 'serve',
  },
};
