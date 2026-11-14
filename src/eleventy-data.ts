import type { I18n } from './_data/i18n';

export type Locale = 'en' | 'ru';

export interface PageData {
  locale: Locale;
  i18n: I18n;
  page: { fileSlug: string };
  demo: boolean;
}
