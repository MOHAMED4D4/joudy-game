const net = require('net');

const allowedEvents = new Set(['session_start','session_end','level_start','game_win','game_loss','score_update','control_click','tab_hidden','tab_visible','idle','js_error']);

function requestIp(req) {
  // Prefer the original client address supplied by the hosting proxy.
  const candidates = [
    req.headers['x-forwarded-for'],
    req.headers['x-real-ip'],
    req.headers['x-vercel-forwarded-for'],
  ];
  for (const header of candidates) {
    if (!header) continue;
    let candidate = String(header).split(',')[0].trim();
    // Accept bracketed IPv6 and IPv4-with-port forms without trusting arbitrary text.
    if (candidate.startsWith('[')) candidate = candidate.slice(1, candidate.indexOf(']') > 0 ? candidate.indexOf(']') : undefined);
    if (net.isIP(candidate)) return candidate;
    const ipv4WithPort = candidate.match(/^((?:\d{1,3}\.){3}\d{1,3}):\d+$/);
    if (ipv4WithPort && net.isIP(ipv4WithPort[1]) === 4) return ipv4WithPort[1];
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Analytics is not configured' });
  const body = req.body || {};
  if (!/^[\w-]{8,100}$/.test(body.playerId || '') || !/^[\w-]{8,100}$/.test(body.sessionId || '') || !allowedEvents.has(body.event)) return res.status(400).json({ error: 'Invalid event' });
  const data = body.data && typeof body.data === 'object' ? body.data : {};
  const safe = Object.fromEntries(Object.entries(data).filter(([k,v]) => ['device','browser','language','timezone','screen','orientation','dpr','loadMs','referrerHost','utmSource','level','score','durationMs','control','count','thresholdMs','message','manufacturer','model','osName','osVersion','browserVersion','deviceType','lastEvent','clientUserAgent'].includes(k) && ['string','number','boolean'].includes(typeof v)).map(([k,v]) => [k, typeof v === 'string' ? v.slice(0, k === 'clientUserAgent' ? 512 : 160) : v]));
  const base = NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'');
  const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal' };
  try {
    const sessionRow = { session_id:body.sessionId, player_id:body.playerId, last_seen_at:new Date().toISOString(), device:safe.device, browser:safe.browser, language:safe.language, timezone:safe.timezone, screen:safe.screen, orientation:safe.orientation, dpr:safe.dpr, referrer_host:safe.referrerHost, utm_source:safe.utmSource, load_ms:safe.loadMs };
    // Dedicated private-test project: record connection IP and the browser's ordinary User-Agent
    // on session start. Share this test deployment only with informed testers.
    if (body.event === 'session_start') {
      const ip = requestIp(req);
      const userAgent = String(req.headers['user-agent'] || safe.clientUserAgent || '').slice(0, 512);
      if (ip) sessionRow.ip_address = ip;
      if (userAgent) sessionRow.user_agent = userAgent;
      // The browser-supplied fallback is used only when the platform proxy omits UA.
      if (!ip) console.warn('session_start received without a valid forwarded client IP header');
      if (!userAgent) console.warn('session_start received without a User-Agent');
    }
    const session = await fetch(`${base}/rest/v1/game_sessions?on_conflict=session_id`, { method:'POST', headers:{...headers, Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify(sessionRow) });
    if (!session.ok) throw new Error(await session.text());
    const event = await fetch(`${base}/rest/v1/player_events`, { method:'POST', headers, body:JSON.stringify({ session_id:body.sessionId, player_id:body.playerId, event_type:body.event, payload:safe, occurred_at:body.at || new Date().toISOString() }) });
    if (!event.ok) throw new Error(await event.text());
    return res.status(202).json({ ok:true });
  } catch (e) { console.error('telemetry insert failed', e.message); return res.status(502).json({ error:'Analytics write failed' }); }
};
