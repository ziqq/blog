export type Locale = 'en' | 'ru';

export type TraceStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'timeout'
  | 'http-error'
  | 'unavailable'
  | 'invalid-response'
  | 'cancelled';

export interface TraceData {
  ip: string;
  country: string;
  colo: string;
  http: string;
  tls: string;
}

export interface TraceResult {
  status: TraceStatus;
  data?: TraceData;
  httpStatus?: number;
}

export interface ServiceDefinition {
  key: string;
  name: string;
  host: string;
  vendor: 'OpenAI' | 'Anthropic' | null;
}

export interface WebRtcData {
  publicIps: string[];
  publicHostV6: string[];
  localCount: number;
  mdnsCount: number;
}

export interface WebRtcResult {
  status: 'idle' | 'running' | 'success' | 'timeout' | 'unavailable' | 'cancelled';
  data?: WebRtcData;
}

export interface BrowserData {
  userAgent: string;
  platform: string;
  languages: string[];
  timezone: string;
  utcOffset: number;
  screen: string;
  devicePixelRatio: number;
  cookies: boolean;
  webdriver: boolean;
}

export interface Finding {
  tone: 'good' | 'note' | 'warning';
  title: string;
  text: string;
}

export interface CheckMessages {
  statusIdle: string;
  statusRunning: string;
  statusSuccess: string;
  statusTimeout: string;
  statusHttpError: string;
  statusUnavailable: string;
  statusInvalidResponse: string;
  statusCancelled: string;
  unknownCountry: string;
  notAvailable: string;
  summaryReady: string;
  summaryPartial: string;
  summaryRunning: string;
  servicesReachable: string;
  openAiExit: string;
  anthropicExit: string;
  noExit: string;
  rtcNoPublic: string;
  rtcSameExit: string;
  rtcAdditional: string;
  rtcUnavailable: string;
  ipv6Available: string;
  ipv6Unavailable: string;
  browserLocal: string;
  findingAllFailedTitle: string;
  findingAllFailedText: string;
  findingSomeFailedTitle: string;
  findingSomeFailedText: string;
  findingRtcLeakTitle: string;
  findingRtcLeakText: string;
  findingRtcClearTitle: string;
  findingRtcClearText: string;
  findingIpv6Title: string;
  findingIpv6Text: string;
  findingVendorTitle: string;
  findingVendorText: string;
  findingGoodTitle: string;
  findingGoodText: string;
  reportTitle: string;
  reportGenerated: string;
  reportDisclaimer: string;
  reportSummary: string;
  reportFindings: string;
  reportServices: string;
  reportConnectivity: string;
  reportBrowser: string;
  reportServiceLine: string;
  reportWebRtc: string;
  reportWebRtcIps: string;
  reportIpv4: string;
  reportIpv6: string;
  reportPlatform: string;
  reportLanguages: string;
  reportTimezone: string;
  reportScreen: string;
  reportWebdriver: string;
  copied: string;
  copyFailed: string;
  showIps: string;
  hideIps: string;
  runAgain: string;
}
