import type { BrowserData } from './types';

export function readBrowserData(): BrowserData {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform || '',
    languages: [...(navigator.languages?.length ? navigator.languages : [navigator.language])],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    utcOffset: -new Date().getTimezoneOffset(),
    screen: `${screen.width}×${screen.height}`,
    devicePixelRatio: Math.round(window.devicePixelRatio * 100) / 100,
    cookies: navigator.cookieEnabled,
    webdriver: navigator.webdriver === true,
  };
}
