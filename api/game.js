const allowedEvents = new Set(['session_start','device_details','session_end','level_start','game_win','game_loss','score_update','control_click','tab_hidden','tab_visible','idle','js_error']);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Analytics is not configured' });
  const body = req.body || {};
  if (!/^[\w-]{8,100}$/.test(body.playerId || '') || !/^[\w-]{8,100}$/.test(body.sessionId || '') || !allowedEvents.has(body.event)) return res.status(400).json({ error: 'Invalid event' });
  const data = body.data && typeof body.data === 'object' ? body.data : {};
  const safe = Object.fromEntries(Object.entries(data).filter(([k,v]) => ['device','browser','language','timezone','screen','orientation','dpr','loadMs','referrerHost','utmSource','level','score','durationMs','control','count','thresholdMs','message','manufacturer','model','osName','osVersion','browserVersion','deviceType','lastEvent','platformVersion','architecture','bitness','modelSource','uiSkin'].includes(k) && ['string','number','boolean'].includes(typeof v)).map(([k,v]) => [k, typeof v === 'string' ? v.slice(0,160) : v]));
  const base = NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'');
  const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal' };
  try {
    const session = await fetch(`${base}/rest/v1/game_sessions?on_conflict=session_id`, { method:'POST', headers:{...headers, Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify({ session_id:body.sessionId, player_id:body.playerId, last_seen_at:new Date().toISOString(), device:safe.device, browser:safe.browser, language:safe.language, timezone:safe.timezone, screen:safe.screen, orientation:safe.orientation, dpr:safe.dpr, referrer_host:safe.referrerHost, utm_source:safe.utmSource, load_ms:safe.loadMs, manufacturer:safe.manufacturer, model:safe.model, os_name:safe.osName, os_version:safe.osVersion, device_type:safe.deviceType, platform_version:safe.platformVersion, ui_skin:safe.uiSkin, model_source:safe.modelSource }) });
    if (!session.ok) throw new Error(await session.text());
    const event = await fetch(`${base}/rest/v1/player_events`, { method:'POST', headers, body:JSON.stringify({ session_id:body.sessionId, player_id:body.playerId, event_type:body.event, payload:safe, occurred_at:body.at || new Date().toISOString() }) });
    if (!event.ok) throw new Error(await event.text());
    return res.status(202).json({ ok:true });
  } catch (e) { console.error('telemetry insert failed', e.message); return res.status(502).json({ error:'Analytics write failed' }); }
};
