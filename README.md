# ustinoff.dev

A small static personal blog built with Eleventy, Nunjucks, SCSS and TypeScript. IBM Plex Mono is served locally.

## Development

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:4173`. Development includes three demo articles in each language. SCSS, TypeScript and content changes rebuild automatically.

```sh
npm run check
npm test
npm run build
```

The production site is written to `_site/`. Demo articles have `demo: true` and are excluded from both the production archive and generated pages. Until a real article is added, production shows an empty archive.

## Writing

Add a Markdown file to `src/posts/`:

```md
---
title: Article title
description: A short description.
date: 2026-11-05
---

Article content.
```

The filename becomes `/posts/filename/`. Metadata and articles are plain files; no database or CMS is required. Site metadata is in `src/_data/site.js`, shared templates in `src/_includes/`, styles in `src/styles/main.scss`.

## GitHub Pages

The Pages workflow builds and deploys production on pushes to `main`, or on manual dispatch. In repository **Settings → Pages**, choose **GitHub Actions**. Set `ustinoff.dev` as the custom domain there and configure its DNS separately. `site.url` must match the final hostname. The site is designed for the root of a custom domain.

No custom domain or DNS setting is changed by the build.

## Languages and social links

English is served at `/`, Russian at `/ru/`. Both the interface and demo article content have static localized pages. Copy lives in `src/_data/i18n.js`. Russian posts live directly in `src/posts/`; English posts use `src/posts/en/`. Give translations the same filename. A real article may exist in only one language; its unavailable translation is omitted from `hreflang` and automatic selection keeps the available article.

Language is selected automatically: explicit `?lang=en|ru`, a direct Russian URL, then the first supported browser language, with English as fallback. There is no language selector or localStorage preference. Redirects use the equivalent page from `hreflang`, retain the current origin, query parameters and fragment, and do not redirect when a translation is absent. Explicit language links keep internal navigation consistent. Without JavaScript, both static language versions remain readable. `npm test` checks this behavior against the actual TypeScript script with Node's built-in test runner.

Social links are defined in `src/_data/site.js`. Icons are copied from Font Awesome Free into local assets with the upstream license. No external scripts or icon font requests are used.
