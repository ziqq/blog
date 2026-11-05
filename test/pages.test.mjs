import assert from 'node:assert/strict';
import { test } from 'node:test';
import Eleventy from '@11ty/eleventy';

const pages = await new Eleventy('src', undefined, { configPath: 'eleventy.config.js' }).toJSON();
const content = (url) => {
  const page = pages.find((entry) => entry.url === url);
  assert(page, `Expected a generated page at ${url}`);
  return page.content;
};

test('both production homepages contain their own language, interface and alternate links', () => {
  for (const [url, locale, heading, empty] of [
    ['/', 'en', 'Notes on code and beyond.', 'No articles published yet.'],
    ['/ru/', 'ru', 'Заметки о коде и не только.', 'Здесь пока нет опубликованных статей.'],
  ]) {
    const html = content(url);
    assert(html.includes(`<html lang="${locale}">`));
    assert(html.includes(heading));
    assert(html.includes(empty));
    assert(html.includes('hreflang="en" href="https://ustinoff.dev/"'));
    assert(html.includes('hreflang="ru" href="https://ustinoff.dev/ru/"'));
    assert(html.includes(`?lang=${locale}`));
  }
});

test('author pages retain page-specific language alternatives', () => {
  for (const url of ['/about/', '/ru/about/']) {
    const html = content(url);
    assert(html.includes('hreflang="en" href="https://ustinoff.dev/about/"'));
    assert(html.includes('hreflang="ru" href="https://ustinoff.dev/ru/about/"'));
  }
  assert(content('/about/').includes('Hi, I’m Anton Ustinoff.'));
  assert(content('/ru/about/').includes('Привет, я Антон Устинов.'));
});

test('published pages have neither language controls, copyright nor demo articles', () => {
  const published = pages.filter((page) => page.url);
  assert.equal(published.length, 4);
  for (const page of published) {
    assert(!page.content.includes('<select'));
    assert(!page.content.includes('©'));
    assert(!page.content.includes('/posts/'));
    assert(!page.content.includes('site-language'));
  }
});
