import { readBrowserData } from './check/browser';
import { SERVICES } from './check/config';
import { checkTrace } from './check/trace';
import type {
  BrowserData,
  CheckMessages,
  Finding,
  TraceResult,
  WebRtcResult,
} from './check/types';
import { checkWebRtc } from './check/webrtc';

interface CheckState {
  running: boolean;
  maskIps: boolean;
  services: Map<string, TraceResult>;
  ipv4: TraceResult;
  ipv6: TraceResult;
  rtc: WebRtcResult;
  browser: BrowserData;
  findings: Finding[];
  startedAt: Date | null;
  finishedAt: Date | null;
}

const root = document.querySelector<HTMLElement>('[data-check-app]');

if (root) startCheck(root);

function startCheck(root: HTMLElement): void {
  const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  const messages = readMessages();
  const regionNames = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames([locale], { type: 'region' })
    : null;
  const runButton = element<HTMLButtonElement>('check-run');
  const copyButton = element<HTMLButtonElement>('check-copy');
  const maskButton = element<HTMLButtonElement>('check-mask');
  const reportElement = element<HTMLTextAreaElement>('check-report');
  const progress = element<HTMLProgressElement>('check-progress');
  const serviceRows = element<HTMLTableSectionElement>('check-service-rows');
  const findingsList = element<HTMLOListElement>('check-findings');
  const feedback = element<HTMLParagraphElement>('check-feedback');
  let activeController: AbortController | null = null;
  let feedbackTimer = 0;
  let state = initialState(false);

  progress.max = SERVICES.length;

  function initialState(maskIps: boolean): CheckState {
    return {
      running: false,
      maskIps,
      services: new Map(SERVICES.map((service) => [service.key, { status: 'idle' }])),
      ipv4: { status: 'idle' },
      ipv6: { status: 'idle' },
      rtc: { status: 'idle' },
      browser: readBrowserData(),
      findings: [],
      startedAt: null,
      finishedAt: null,
    };
  }

  function format(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
      Object.hasOwn(values, key) ? String(values[key]) : match,
    );
  }

  function countryLabel(country: string): string {
    if (!country) return messages.unknownCountry;
    try {
      const name = regionNames?.of(country);
      return name && name !== country ? `${name} (${country})` : country;
    } catch {
      return country;
    }
  }

  function maskIp(ip: string): string {
    if (!state.maskIps) return ip;
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    const parts = ip.split(':').filter(Boolean);
    return `${parts.slice(0, 2).join(':')}:****`;
  }

  function statusLabel(result: TraceResult | WebRtcResult): string {
    switch (result.status) {
      case 'idle': return messages.statusIdle;
      case 'running': return messages.statusRunning;
      case 'success': return messages.statusSuccess;
      case 'timeout': return messages.statusTimeout;
      case 'http-error': return messages.statusHttpError;
      case 'invalid-response': return messages.statusInvalidResponse;
      case 'cancelled': return messages.statusCancelled;
      case 'unavailable': return messages.statusUnavailable;
    }
  }

  function isComplete(result: TraceResult): boolean {
    return result.status !== 'idle' && result.status !== 'running' && result.status !== 'cancelled';
  }

  function successfulTraces(): TraceResult[] {
    return [...state.services.values()].filter((result) => result.status === 'success');
  }

  function observedIps(includeConnectivity = true): Set<string> {
    const ips = new Set<string>();
    for (const result of successfulTraces()) {
      if (result.data) ips.add(result.data.ip);
    }
    if (includeConnectivity) {
      if (state.ipv4.data) ips.add(state.ipv4.data.ip);
      if (state.ipv6.data) ips.add(state.ipv6.data.ip);
    }
    return ips;
  }

  function traceNetwork(result: TraceResult): string {
    if (result.data) {
      return `${maskIp(result.data.ip)} · ${countryLabel(result.data.country)}`;
    }
    const status = statusLabel(result);
    return result.httpStatus ? `${status} (${result.httpStatus})` : status;
  }

  function vendorExit(vendor: 'OpenAI' | 'Anthropic'): string {
    const service = SERVICES.find((item) =>
      item.vendor === vendor && state.services.get(item.key)?.status === 'success',
    );
    if (!service) return messages.noExit;
    const data = state.services.get(service.key)?.data;
    if (!data) return messages.noExit;
    const template = vendor === 'OpenAI' ? messages.openAiExit : messages.anthropicExit;
    return format(template, { country: countryLabel(data.country) });
  }

  function additionalRtcIps(): string[] {
    if (!state.rtc.data) return [];
    const known = observedIps();
    return [...state.rtc.data.publicIps, ...state.rtc.data.publicHostV6]
      .filter((ip, index, all) => !known.has(ip) && all.indexOf(ip) === index);
  }

  function rtcSummary(): string {
    if (state.rtc.status === 'idle' || state.rtc.status === 'running') return statusLabel(state.rtc);
    if (!state.rtc.data) return messages.rtcUnavailable;
    if (additionalRtcIps().length) return messages.rtcAdditional;
    if (state.rtc.status === 'timeout') return messages.statusTimeout;
    const hasPublic = state.rtc.data.publicIps.length + state.rtc.data.publicHostV6.length > 0;
    if (!hasPublic) return messages.rtcNoPublic;
    return messages.rtcSameExit;
  }

  function renderSummary(): void {
    const success = successfulTraces().length;
    const complete = [...state.services.values()].filter(isComplete).length;
    const hasGaps = success !== SERVICES.length || state.rtc.status === 'timeout' ||
      state.ipv4.status !== 'success' || state.ipv6.status === 'invalid-response';

    text('check-run-status', state.running
      ? messages.summaryRunning
      : state.finishedAt
        ? hasGaps ? messages.summaryPartial : messages.summaryReady
        : messages.statusIdle);
    text('check-summary-services', format(messages.servicesReachable, {
      success,
      total: SERVICES.length,
    }));
    text('check-summary-exits', `${vendorExit('OpenAI')} · ${vendorExit('Anthropic')}`);
    text('check-summary-rtc', rtcSummary());
    text('check-summary-ipv6', state.ipv6.data
      ? format(messages.ipv6Available, { country: countryLabel(state.ipv6.data.country) })
      : state.ipv6.status === 'idle' || state.ipv6.status === 'running'
        ? statusLabel(state.ipv6)
        : messages.ipv6Unavailable);
    text('check-summary-browser', format(messages.browserLocal, {
      timezone: state.browser.timezone || messages.notAvailable,
      languages: state.browser.languages.join(', ') || messages.notAvailable,
    }));
    text('check-progress-label', `${complete} / ${SERVICES.length}`);
    progress.value = complete;
  }

  function renderServices(): void {
    const rows = SERVICES.map((service) => {
      const result = state.services.get(service.key) || { status: 'idle' } as TraceResult;
      const row = document.createElement('tr');
      row.dataset.status = result.status;

      const serviceCell = document.createElement('td');
      const name = document.createElement('strong');
      name.textContent = service.name;
      const host = document.createElement('span');
      host.textContent = service.host;
      serviceCell.append(name, host);

      const resultCell = document.createElement('td');
      resultCell.textContent = statusLabel(result);
      if (result.httpStatus) {
        const httpStatus = document.createElement('span');
        httpStatus.textContent = `HTTP ${result.httpStatus}`;
        resultCell.append(httpStatus);
      }

      const networkCell = document.createElement('td');
      if (result.data) {
        const ip = document.createElement('span');
        ip.className = 'check-ip';
        ip.textContent = maskIp(result.data.ip);
        const country = document.createElement('span');
        country.textContent = countryLabel(result.data.country);
        networkCell.append(ip, country);
      } else {
        networkCell.textContent = '—';
      }

      row.append(serviceCell, resultCell, networkCell);
      return row;
    });
    serviceRows.replaceChildren(...rows);
  }

  function renderConnectivity(): void {
    text('check-ipv4', traceNetwork(state.ipv4));
    text('check-ipv6', traceNetwork(state.ipv6));

    let rtc = statusLabel(state.rtc);
    if (state.rtc.data) {
      const ips = [...state.rtc.data.publicIps, ...state.rtc.data.publicHostV6];
      rtc += ips.length ? `: ${ips.map(maskIp).join(', ')}` : `: ${messages.rtcNoPublic}`;
      const metadata = [
        state.rtc.data.mdnsCount ? `mDNS ${state.rtc.data.mdnsCount}` : '',
        state.rtc.data.localCount ? `local ${state.rtc.data.localCount}` : '',
      ].filter(Boolean);
      if (metadata.length) rtc += ` · ${metadata.join(' · ')}`;
    }
    text('check-webrtc', rtc);
  }

  function renderBrowser(): void {
    const browser = state.browser;
    text('check-browser-ua', browser.userAgent);
    text('check-browser-platform', browser.platform || messages.notAvailable);
    text('check-browser-languages', browser.languages.join(', ') || messages.notAvailable);
    text('check-browser-timezone', `${browser.timezone || messages.notAvailable} · UTC${formatOffset(browser.utcOffset)}`);
    text('check-browser-screen', `${browser.screen} · ${browser.devicePixelRatio}`);
    text('check-browser-webdriver', String(browser.webdriver));
  }

  function buildFindings(): Finding[] {
    const findings: Finding[] = [];
    const success = successfulTraces().length;
    const failed = SERVICES.length - success;
    const extraRtc = additionalRtcIps();

    if (success === 0) {
      findings.push({
        tone: 'warning',
        title: messages.findingAllFailedTitle,
        text: messages.findingAllFailedText,
      });
    }

    if (extraRtc.length) {
      findings.push({
        tone: 'warning',
        title: messages.findingRtcLeakTitle,
        text: `${messages.findingRtcLeakText} ${extraRtc.map(maskIp).join(', ')}`,
      });
    } else if (state.rtc.status === 'success' && state.rtc.data) {
      findings.push({
        tone: 'good',
        title: messages.findingRtcClearTitle,
        text: messages.findingRtcClearText,
      });
    }

    if (state.ipv6.data && !observedIps(false).has(state.ipv6.data.ip) &&
      state.ipv4.data?.ip !== state.ipv6.data.ip) {
      findings.push({
        tone: 'note',
        title: messages.findingIpv6Title,
        text: `${messages.findingIpv6Text} ${maskIp(state.ipv6.data.ip)}`,
      });
    }

    for (const vendor of ['OpenAI', 'Anthropic'] as const) {
      const ips = new Set<string>();
      for (const service of SERVICES) {
        if (service.vendor !== vendor) continue;
        const data = state.services.get(service.key)?.data;
        if (data) ips.add(data.ip);
      }
      if (ips.size > 1) {
        findings.push({
          tone: 'note',
          title: format(messages.findingVendorTitle, { vendor }),
          text: format(messages.findingVendorText, { ips: [...ips].map(maskIp).join(', ') }),
        });
      }
    }

    if (success > 0 && failed > 0) {
      findings.push({
        tone: 'note',
        title: messages.findingSomeFailedTitle,
        text: format(messages.findingSomeFailedText, { failed, total: SERVICES.length }),
      });
    }

    if (!findings.some((finding) => finding.tone !== 'good')) {
      findings.push({
        tone: 'good',
        title: messages.findingGoodTitle,
        text: messages.findingGoodText,
      });
    }

    return findings;
  }

  function renderFindings(): void {
    const items = state.findings.map((finding) => {
      const item = document.createElement('li');
      item.dataset.tone = finding.tone;
      const title = document.createElement('h3');
      title.textContent = finding.title;
      const textElement = document.createElement('p');
      textElement.textContent = finding.text;
      item.append(title, textElement);
      return item;
    });
    findingsList.replaceChildren(...items);
  }

  function reportTrace(result: TraceResult): string {
    return result.data
      ? `${maskIp(result.data.ip)} · ${countryLabel(result.data.country)}`
      : `${statusLabel(result)}${result.httpStatus ? ` ${result.httpStatus}` : ''}`;
  }

  function buildReport(): string {
    const lines = [
      messages.reportTitle,
      `${messages.reportGenerated}: ${(state.finishedAt || new Date()).toISOString()}`,
      messages.reportDisclaimer,
      '',
      messages.reportSummary,
      textContent('check-run-status'),
      textContent('check-summary-services'),
      textContent('check-summary-exits'),
      textContent('check-summary-rtc'),
      textContent('check-summary-ipv6'),
    ];

    if (state.findings.length) {
      lines.push('', messages.reportFindings);
      for (const finding of state.findings) {
        lines.push(`- ${finding.title}: ${finding.text}`);
      }
    }

    lines.push('', messages.reportServices);
    for (const service of SERVICES) {
      const result = state.services.get(service.key) || { status: 'idle' } as TraceResult;
      lines.push(format(messages.reportServiceLine, {
        name: service.name,
        host: service.host,
        status: statusLabel(result),
        ip: result.data ? maskIp(result.data.ip) : messages.notAvailable,
        country: result.data ? countryLabel(result.data.country) : messages.notAvailable,
      }));
    }

    const rtcIps = state.rtc.data
      ? [...state.rtc.data.publicIps, ...state.rtc.data.publicHostV6].map(maskIp).join(', ')
      : messages.notAvailable;
    lines.push(
      '',
      messages.reportConnectivity,
      format(messages.reportWebRtc, { status: statusLabel(state.rtc) }),
      format(messages.reportWebRtcIps, { ips: rtcIps || messages.notAvailable }),
      format(messages.reportIpv4, { value: reportTrace(state.ipv4) }),
      format(messages.reportIpv6, { value: reportTrace(state.ipv6) }),
      '',
      messages.reportBrowser,
      `User-Agent: ${state.browser.userAgent}`,
      format(messages.reportPlatform, { value: state.browser.platform || messages.notAvailable }),
      format(messages.reportLanguages, { value: state.browser.languages.join(', ') || messages.notAvailable }),
      format(messages.reportTimezone, { value: `${state.browser.timezone} UTC${formatOffset(state.browser.utcOffset)}` }),
      format(messages.reportScreen, { value: `${state.browser.screen} · DPR ${state.browser.devicePixelRatio}` }),
      format(messages.reportWebdriver, { value: String(state.browser.webdriver) }),
    );

    return lines.join('\n');
  }

  function renderAll(): void {
    root.setAttribute('aria-busy', String(state.running));
    runButton.disabled = state.running;
    runButton.textContent = state.running
      ? messages.statusRunning
      : state.finishedAt ? messages.runAgain : runButton.dataset.initialLabel || '';
    copyButton.disabled = state.running || !state.finishedAt;
    maskButton.setAttribute('aria-pressed', String(state.maskIps));
    maskButton.textContent = state.maskIps ? messages.hideIps : messages.showIps;
    renderSummary();
    renderServices();
    renderConnectivity();
    renderBrowser();
    renderFindings();
    reportElement.value = state.startedAt ? buildReport() : '';
  }

  async function runCheck(): Promise<void> {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const maskIps = state.maskIps;
    state = initialState(maskIps);
    state.running = true;
    state.startedAt = new Date();
    feedback.textContent = '';
    renderAll();

    const tasks: Promise<void>[] = [];

    for (const service of SERVICES) {
      state.services.set(service.key, { status: 'running' });
      tasks.push(checkTrace(service.host, controller.signal).then((result) => {
        if (activeController !== controller) return;
        state.services.set(service.key, result);
        renderSummary();
        renderServices();
      }));
    }

    state.ipv4 = { status: 'running' };
    tasks.push(checkTrace('1.1.1.1', controller.signal).then((result) => {
      if (activeController !== controller) return;
      state.ipv4 = result;
      renderSummary();
      renderConnectivity();
    }));

    state.ipv6 = { status: 'running' };
    tasks.push(checkTrace('[2606:4700:4700::1111]', controller.signal).then((result) => {
      if (activeController !== controller) return;
      state.ipv6 = result;
      renderSummary();
      renderConnectivity();
    }));

    state.rtc = { status: 'running' };
    tasks.push(checkWebRtc(controller.signal).then((result) => {
      if (activeController !== controller) return;
      state.rtc = result;
      renderSummary();
      renderConnectivity();
    }));

    renderAll();
    await Promise.all(tasks);
    if (activeController !== controller) return;

    state.running = false;
    state.finishedAt = new Date();
    state.findings = buildFindings();
    renderAll();
  }

  async function copyReport(): Promise<void> {
    if (!state.finishedAt) return;
    const report = buildReport();
    let copied = false;

    try {
      await navigator.clipboard.writeText(report);
      copied = true;
    } catch {
      reportElement.focus();
      reportElement.select();
      copied = document.execCommand('copy');
    }

    showFeedback(copied ? messages.copied : messages.copyFailed);
  }

  function showFeedback(message: string): void {
    window.clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedbackTimer = window.setTimeout(() => {
      feedback.textContent = '';
    }, 5_000);
  }

  runButton.dataset.initialLabel = runButton.textContent || '';
  runButton.addEventListener('click', () => void runCheck());
  copyButton.addEventListener('click', () => void copyReport());
  maskButton.addEventListener('click', () => {
    state.maskIps = !state.maskIps;
    if (state.finishedAt) state.findings = buildFindings();
    renderAll();
  });
  window.addEventListener('beforeunload', () => activeController?.abort(), { once: true });

  renderAll();
  window.setTimeout(() => void runCheck(), 0);
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}`);
  return found as T;
}

function text(id: string, value: string): void {
  element<HTMLElement>(id).textContent = value;
}

function textContent(id: string): string {
  return element<HTMLElement>(id).textContent || '';
}

function readMessages(): CheckMessages {
  const source = element<HTMLScriptElement>('check-messages').textContent;
  if (!source) throw new Error('Network check messages are missing');
  return JSON.parse(source) as CheckMessages;
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const rest = absolute % 60;
  return `${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}
