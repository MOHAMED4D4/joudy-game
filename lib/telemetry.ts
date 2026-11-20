/* Private-test analytics. The server stores connection IP and ordinary User-Agent for session starts.
   No precise location, touch coordinates, battery, device fingerprint, or cross-site identifiers are collected. */
const TRACK_ENDPOINT = '/api/game';
const IDLE_THRESHOLD_MS = 60_000;
const SESSION_KEY = 'joudy_analytics_session_v1';
const CONSENT_KEY = 'joudy_analytics_consent_v1';
function hasAnalyticsConsent() {
  try { return typeof window !== 'undefined' && window.localStorage.getItem(CONSENT_KEY) === 'granted'; }
  catch { return false; }
}
const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let playerId = '';
let sessionId = '';
let startedAt = 0;
let lastActivity = 0;
let idleSent = false;
let currentLevel: number | null = null;
let levelStartedAt = 0;
let lastEvent = 'session_start';
let clickCounts: Record<string, number> = {};
function ids() {
  if (typeof window === 'undefined') return null;
  // Session-scoped pseudonymous ID only; it is not persisted across browser sessions.
  sessionId = sessionStorage.getItem(SESSION_KEY) || uuid();
  sessionStorage.setItem(SESSION_KEY, sessionId);
  playerId = sessionId;
  return { playerId, sessionId };
}
async function send(event: string, data: Record<string, unknown> = {}) {
  if (!hasAnalyticsConsent()) return;
  const identity = ids(); if (!identity) return;
  lastEvent = event;
  const payload = { ...identity, event, data, at: new Date().toISOString() };
  try { await fetch(TRACK_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }); } catch { /* analytics must never affect gameplay */ }
}
export const telemetry = {
  consentState(): 'granted' | 'denied' | null {
    if (typeof window === 'undefined') return 'denied';
    try { const value = window.localStorage.getItem(CONSENT_KEY); return value === 'granted' ? 'granted' : value === 'denied' ? 'denied' : null; } catch { return 'denied'; }
  },
  acceptConsent() {
    try { window.localStorage.setItem(CONSENT_KEY, 'granted'); } catch { return; }
    this.start();
  },
  declineConsent() {
    try { window.localStorage.setItem(CONSENT_KEY, 'denied'); } catch { /* storage unavailable */ }
  },
  start() {
    if (typeof window === 'undefined' || startedAt || !hasAnalyticsConsent()) return;
    startedAt = performance.now(); lastActivity = startedAt; ids();
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const ua = navigator.userAgent;
    // Use only the ordinary User-Agent string. Browsers may hide exact hardware model
    // details; never infer a model when the browser does not expose one.
    const version = (pattern: RegExp) => ua.match(pattern)?.[1] || '';
    const osName = /Android/i.test(ua) ? 'Android'
      : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
      : /Windows NT/i.test(ua) ? 'Windows'
      : /Mac OS X/i.test(ua) ? 'macOS'
      : /Linux/i.test(ua) ? 'Linux' : 'غير معروف';
    const osVersion = osName === 'Android' ? version(/Android\s([\d.]+)/i)
      : osName === 'iOS' ? version(/OS\s([\d_]+)/i).replace(/_/g, '.')
      : osName === 'Windows' ? version(/Windows NT\s([\d.]+)/i)
      : osName === 'macOS' ? version(/Mac OS X\s([\d_]+)/i).replace(/_/g, '.') : '';
    const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const deviceType = isTablet ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'Phone' : 'Desktop';
    let manufacturer = deviceType === 'Desktop' ? 'كمبيوتر' : 'غير معروف';
    let model = '';
    if (/iPhone/i.test(ua)) { manufacturer = 'Apple'; model = 'iPhone (الموديل غير معلن)'; }
    else if (/iPad/i.test(ua)) { manufacturer = 'Apple'; model = 'iPad (الموديل غير معلن)'; }
    else if (/iPod/i.test(ua)) { manufacturer = 'Apple'; model = 'iPod'; }
    else if (/Android/i.test(ua)) {
      const samsung = ua.match(/\b(SM-[A-Z0-9]+)\b/i);
      const redmi = ua.match(/\b(Redmi[^;)\/]+|POCO[^;)\/]+)\b/i);
      const pixel = ua.match(/\b(Pixel\s?[A-Za-z0-9 ]*)/i);
      const oppo = ua.match(/\b(CPH[0-9A-Z]+)\b/i);
      const generic = ua.match(/;\s*([^;()]+?)\s+Build\//i);
      if (samsung) { manufacturer = 'Samsung'; model = `Galaxy ${samsung[1].toUpperCase()}`; }
      else if (redmi) { manufacturer = /POCO/i.test(redmi[1]) ? 'POCO' : 'Xiaomi'; model = redmi[1].trim(); }
      else if (pixel) { manufacturer = 'Google'; model = pixel[1].trim(); }
      else if (oppo) { manufacturer = 'OPPO'; model = oppo[1].toUpperCase(); }
      else if (generic && !/^(K|wv|U|Android)$/i.test(generic[1].trim())) model = generic[1].trim().slice(0, 50);
    }
    const browserName = /SamsungBrowser\//i.test(ua) ? 'Samsung Internet'
      : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera'
      : /Firefox\//.test(ua) ? 'Firefox' : /CriOS\//.test(ua) ? 'Chrome iOS'
      : /Chrome\//.test(ua) ? 'Chrome' : /Version\/[\d.]+.*Safari/i.test(ua) ? 'Safari' : 'متصفح آخر';
    const browserVersion = browserName === 'Samsung Internet' ? version(/SamsungBrowser\/([\d.]+)/i)
      : browserName === 'Edge' ? version(/Edg\/([\d.]+)/)
      : browserName === 'Opera' ? version(/OPR\/([\d.]+)/)
      : browserName === 'Firefox' ? version(/Firefox\/([\d.]+)/)
      : browserName === 'Chrome iOS' ? version(/CriOS\/([\d.]+)/)
      : browserName === 'Chrome' ? version(/Chrome\/([\d.]+)/)
      : browserName === 'Safari' ? version(/Version\/([\d.]+)/) : '';
    const device = `${manufacturer === 'غير معروف' ? (model || (deviceType === 'Phone' ? 'هاتف Android' : deviceType === 'Tablet' ? 'جهاز لوحي' : 'كمبيوتر')) : manufacturer}${model ? ` ${model}` : ''} · ${osName}${osVersion ? ` ${osVersion}` : ''}`;
    const browser = `${browserName}${browserVersion ? ` ${browserVersion}` : ''}`;
    void send('session_start', { device, browser, manufacturer, model: model || 'غير معلن من المتصفح', osName, osVersion, browserVersion, deviceType, clientUserAgent: ua, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: `${screen.width}x${screen.height}`, orientation: screen.orientation?.type ?? 'unknown', dpr: window.devicePixelRatio, loadMs: Math.round(nav?.loadEventEnd ?? 0), referrerHost: document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return ''; } })() : 'direct', utmSource: new URLSearchParams(location.search).get('utm_source') });
    const activity = () => { lastActivity = performance.now(); idleSent = false; };
    ['pointerdown','keydown','scroll','touchstart'].forEach(name => window.addEventListener(name, activity, { passive: true }));
    document.addEventListener('visibilitychange', () => { void send(document.hidden ? 'tab_hidden' : 'tab_visible'); });
    window.addEventListener('error', e => { void send('js_error', { message: String(e.message).slice(0,160) }); });
    window.addEventListener('pagehide', () => { void send('session_end', { durationMs: Math.round(performance.now() - startedAt), lastEvent, level: currentLevel }); });
    const timer = window.setInterval(() => { if (!idleSent && performance.now() - lastActivity >= IDLE_THRESHOLD_MS) { idleSent = true; void send('idle', { thresholdMs: IDLE_THRESHOLD_MS }); } }, 10_000);
    window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
    // Aggregate control names only; do not record coordinates or typed values.
    document.addEventListener('click', e => { const el = (e.target as HTMLElement | null)?.closest('button,[role="button"],a'); if (!el) return; const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g,' ').slice(0,60); clickCounts[label] = (clickCounts[label] || 0) + 1; void send('control_click', { control: label, count: clickCounts[label] }); }, true);
  },
  level(level: number) { currentLevel = level; levelStartedAt = performance.now(); void send('level_start', { level }); },
  win(level: number, score: number, durationMs?: number) { void send('game_win', { level, score, durationMs: durationMs ?? (performance.now() - levelStartedAt) }); },
  loss(level: number | null, score?: number) { void send('game_loss', { level, score: score ?? null, durationMs: levelStartedAt ? performance.now() - levelStartedAt : null }); },
  score(score: number, level = currentLevel) { void send('score_update', { score, level }); },
  trackLevelChange(level: number) { this.level(level); },
  trackGameWin(level: number, score: number, durationMs?: number) { this.win(level, score, durationMs); },
  trackGameLoss(level: number | null, score?: number) { this.loss(level, score); },
  trackScoreUpdate(score: number, level = currentLevel) { this.score(score, level); },
};
