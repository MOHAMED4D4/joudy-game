const crypto = require('crypto');

const same = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const sendError = (res, status, message) => res.status(status).json({ error: message });

async function fetchPaged(base, headers, table, order, maxRows) {
  const pageSize = 1000;
  const rows = [];
  let total = null;

  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, maxRows - 1);
    const response = await fetch(
      `${base}/rest/v1/${table}?select=*&order=${order}`,
      { headers: { ...headers, Prefer: 'count=exact', Range: `${offset}-${end}` } }
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`${table} query failed (${response.status}): ${details.slice(0, 220)}`);
    }

    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`Unexpected ${table} response`);
    rows.push(...page);

    const contentRange = response.headers.get('content-range') || '';
    const match = contentRange.match(/\/(\d+|\*)$/);
    if (match && match[1] !== '*') total = Number(match[1]);

    if (page.length < pageSize || (total !== null && rows.length >= total)) break;
  }

  return {
    rows,
    total: total === null ? rows.length : total,
    truncated: total !== null ? total > rows.length : rows.length >= maxRows,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');
  if (!process.env.ADMIN_PASSWORD) return sendError(res, 503, 'Admin password is not configured');
  if (!same(req.headers['x-admin-password'], process.env.ADMIN_PASSWORD)) {
    return sendError(res, 401, 'كلمة المرور غير صحيحة');
  }

  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return sendError(res, 503, 'إعدادات Supabase غير مكتملة');
  }

  const base = NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const action = req.body?.action || 'read';

  try {
    if (action === 'delete') {
      const [eventsResponse, sessionsResponse] = await Promise.all([
        fetch(`${base}/rest/v1/player_events?id=gt.0`, { method: 'DELETE', headers }),
        fetch(`${base}/rest/v1/game_sessions?id=not.is.null`, { method: 'DELETE', headers }),
      ]);

      if (!eventsResponse.ok || !sessionsResponse.ok) {
        throw new Error('Supabase delete request failed');
      }
      return res.status(200).json({ ok: true });
    }

    if (action !== 'read') return sendError(res, 400, 'Unknown action');

    // Paginate instead of silently trusting Supabase's default 1,000-row cap.
    // Hard caps protect the serverless function from unbounded dashboard reads.
    const [sessionsResult, eventsResult] = await Promise.all([
      fetchPaged(base, headers, 'game_sessions', 'last_seen_at.desc', 10000),
      fetchPaged(base, headers, 'player_events', 'occurred_at.desc', 20000),
    ]);

    return res.status(200).json({
      sessions: sessionsResult.rows,
      events: eventsResult.rows,
      meta: {
        sessionsTotal: sessionsResult.total,
        eventsTotal: eventsResult.total,
        sessionsLoaded: sessionsResult.rows.length,
        eventsLoaded: eventsResult.rows.length,
        sessionsTruncated: sessionsResult.truncated,
        eventsTruncated: eventsResult.truncated,
        sessionsLimit: 10000,
        eventsLimit: 20000,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('admin analytics request failed:', error.message);
    return sendError(res, 502, 'تعذر تحميل بيانات التحليلات. راجع إعدادات Supabase وسجلات Vercel.');
  }
};
