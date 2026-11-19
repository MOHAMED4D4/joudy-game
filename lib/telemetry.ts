/* Privacy-conscious first-party game analytics. No precise location, IP, touch coordinates,
   battery, device fingerprinting, or cross-site identifiers are collected. */
const TRACK_ENDPOINT = '/api/game';
const IDLE_THRESHOLD_MS = 60_000;
const SESSION_KEY = 'joudy_analytics_session_v1';
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
  const identity = ids(); if (!identity) return;
  lastEvent = event;
  const payload = { ...identity, event, data, at: new Date().toISOString() };
  try { await fetch(TRACK_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }); } catch { /* analytics must never affect gameplay */ }
}
export const telemetry = {
  start() {
    if (typeof window === 'undefined' || startedAt) return;
    startedAt = performance.now(); lastActivity = startedAt; ids();
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const ua = navigator.userAgent;
    const device = /iPhone|iPad/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : 'Other';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
    void send('session_start', { device, browser, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: `${screen.width}x${screen.height}`, orientation: screen.orientation?.type ?? 'unknown', dpr: window.devicePixelRatio, loadMs: Math.round(nav?.loadEventEnd ?? 0), referrerHost: document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return ''; } })() : 'direct', utmSource: new URLSearchParams(location.search).get('utm_source') });
    const activity = () => { lastActivity = performance.now(); idleSent = false; };
    ['pointerdown','keydown','scroll','touchstart'].forEach(name => window.addEventListener(name, activity, { passive: true }));
    document.addEventListener('visibilitychange', () => { void send(document.hidden ? 'tab_hidden' : 'tab_visible'); });
    window.addEventListener('error', e => { void send('js_error', { message: String(e.message).slice(0,160) }); });
    window.addEventListener('pagehide', () => { void send('session_end', { durationMs: Math.round(performance.now() - startedAt), lastEvent }); });
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
