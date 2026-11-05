import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';

const source = readFileSync(new URL('../src/scripts/locale.ts', import.meta.url), 'utf8');
const { code } = transformSync(source, { loader: 'ts', target: 'es2022' });

function page({
  current = 'en',
  url = 'http://localhost:4173/',
  languages = ['en-US'],
  language = 'en-US',
  alternate = 'https://ustinoff.dev/ru/',
  loading = false,
} = {}) {
  const redirects = [];
  let loaded;
  const context = {
    URL,
    location: {
      href: url,
      origin: new URL(url).origin,
      replace: (target) => redirects.push(String(target)),
    },
    navigator: { languages, language },
    document: {
      readyState: loading ? 'loading' : 'complete',
      documentElement: { lang: current },
      querySelector(selector) {
        assert.match(selector, /^link\[rel="alternate"\]\[hreflang="(en|ru)"\]$/);
        return alternate === null ? null : { getAttribute: () => alternate };
      },
      addEventListener(event, callback, options) {
        assert.equal(event, 'DOMContentLoaded');
        assert.equal(options.once, true);
        loaded = callback;
      },
    },
  };
  Object.defineProperty(context, 'localStorage', {
    get() { throw new Error('Locale selection must not depend on browser storage'); },
  });
  runInNewContext(code, context);
  return { redirects, load: () => loaded() };
}

test('Russian browser opens the Russian static page on the current local origin', () => {
  assert.deepEqual(page({ languages: ['ru-RU'] }).redirects, ['http://localhost:4173/ru/?lang=ru']);
});

test('the first supported language wins, rather than any Russian language in the list', () => {
  assert.deepEqual(page({ languages: ['de-DE', 'en-GB', 'ru-RU'] }).redirects, []);
  assert.deepEqual(page({ languages: ['de-DE', 'RU-ru', 'en'] }).redirects, ['http://localhost:4173/ru/?lang=ru']);
});

test('unsupported or empty browser languages fall back to English', () => {
  assert.deepEqual(page({ languages: ['de-DE', 'fr'] }).redirects, []);
  assert.deepEqual(page({ languages: [] }).redirects, []);
});

test('navigator.language is used when navigator.languages is unavailable', () => {
  assert.deepEqual(page({ languages: null, language: 'ru-RU' }).redirects, ['http://localhost:4173/ru/?lang=ru']);
});

test('explicit English overrides a Russian browser', () => {
  assert.deepEqual(page({ url: 'https://ustinoff.dev/?lang=en', languages: ['ru'] }).redirects, []);
});

test('explicit Russian overrides an English browser', () => {
  assert.deepEqual(page({ url: 'https://ustinoff.dev/?lang=ru' }).redirects, ['https://ustinoff.dev/ru/?lang=ru']);
});

test('direct Russian URLs retain their language without storage', () => {
  assert.deepEqual(page({ current: 'ru', url: 'https://ustinoff.dev/ru/', languages: ['en'] }).redirects, []);
});

test('explicit English can override a direct Russian page', () => {
  assert.deepEqual(page({ current: 'ru', url: 'https://ustinoff.dev/ru/about/?lang=en', alternate: 'https://ustinoff.dev/about/' }).redirects, ['https://ustinoff.dev/about/?lang=en']);
});

test('invalid language parameters do not suppress browser detection', () => {
  assert.deepEqual(page({ url: 'https://ustinoff.dev/?lang=fr', languages: ['ru'] }).redirects, ['https://ustinoff.dev/ru/?lang=ru']);
});

test('article redirects use the supplied translation and preserve query and fragment', () => {
  assert.deepEqual(page({
    url: 'http://localhost:4173/posts/english-title/?ref=rss#section',
    languages: ['ru'],
    alternate: 'https://ustinoff.dev/ru/posts/russian-title/',
  }).redirects, ['http://localhost:4173/ru/posts/russian-title/?ref=rss&lang=ru#section']);
});

test('missing article translations keep the original article instead of redirecting to an archive', () => {
  assert.deepEqual(page({ languages: ['ru'], alternate: null }).redirects, []);
  assert.deepEqual(page({ languages: ['ru'], alternate: '' }).redirects, []);
});

test('loading documents wait for translation links without requiring a language select', () => {
  const pending = page({ languages: ['ru'], loading: true });
  assert.deepEqual(pending.redirects, []);
  pending.load();
  assert.deepEqual(pending.redirects, ['http://localhost:4173/ru/?lang=ru']);
});

test('following an automatically selected Russian URL does not loop', () => {
  const [target] = page({ languages: ['ru'] }).redirects;
  assert.deepEqual(page({ current: 'ru', url: target, languages: ['ru'] }).redirects, []);
});
