type Language = 'en' | 'ru';
const isLanguage = (value: unknown): value is Language => value === 'en' || value === 'ru';

function selectLanguage(): void {
  const current = document.documentElement.lang;
  const explicit = new URL(location.href).searchParams.get('lang');
  const browser = (navigator.languages || [navigator.language])
    .map((value) => value.split('-')[0].toLowerCase()).find(isLanguage);
  const preferred = isLanguage(explicit) ? explicit
    : current === 'ru' ? 'ru' : browser || 'en';
  if (preferred === current) return;

  const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${preferred}"]`);
  const href = alternate?.getAttribute('href');
  if (!href) return;

  const target = new URL(location.href);
  target.pathname = new URL(href, location.origin).pathname;
  target.searchParams.set('lang', preferred);
  location.replace(target);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', selectLanguage, { once: true });
} else {
  selectLanguage();
}
