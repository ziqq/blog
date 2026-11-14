import { TRACE_TIMEOUT_MS } from './config';
import type { TraceData, TraceResult } from './types';

function isIpv4(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

export function isIpAddress(value: string): boolean {
  return isIpv4(value) || (/^[0-9a-f:]+$/i.test(value) && value.includes(':'));
}

export function isPublicIp(value: string): boolean {
  if (isIpv4(value)) {
    const [a, b] = value.split('.').map(Number);
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }

  return /^[23][0-9a-f]{0,3}:/i.test(value) && !/^2001:db8:/i.test(value);
}

export function parseTrace(text: string): TraceData | null {
  const values: Record<string, string> = {};

  for (const line of text.trim().split('\n')) {
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1).trim();
  }

  if (!values.ip || !isIpAddress(values.ip)) return null;

  return {
    ip: values.ip,
    country: /^[A-Z0-9]{2}$/.test(values.loc) ? values.loc : '',
    colo: values.colo || '',
    http: values.http || '',
    tls: values.tls || '',
  };
}

export async function checkTrace(host: string, signal: AbortSignal): Promise<TraceResult> {
  if (signal.aborted) return { status: 'cancelled' };

  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TRACE_TIMEOUT_MS);

  try {
    const response = await fetch(`https://${host}/cdn-cgi/trace`, {
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });

    if (!response.ok) return { status: 'http-error', httpStatus: response.status };

    const data = parseTrace(await response.text());
    return data ? { status: 'success', data } : { status: 'invalid-response' };
  } catch {
    if (timedOut) return { status: 'timeout' };
    if (signal.aborted) return { status: 'cancelled' };
    return { status: 'unavailable' };
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
