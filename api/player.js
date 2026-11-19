const crypto = require('crypto');
const same = (a,b) => { const x=Buffer.from(String(a||'')), y=Buffer.from(String(b||'')); return x.length===y.length && crypto.timingSafeEqual(x,y); };
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!process.env.ADMIN_PASSWORD || !same(req.headers['x-admin-password'], process.env.ADMIN_PASSWORD)) return res.status(401).json({error:'Unauthorized'});
  const {SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY}=process.env;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({error:'Not configured'});
  const base=SUPABASE_URL.replace(/\/$/,''); const h={apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`};
  try {
    if(req.body?.action==='delete') { const a=await fetch(`${base}/rest/v1/player_events?id=gt.0`,{method:'DELETE',headers:h}); const b=await fetch(`${base}/rest/v1/game_sessions?id=not.is.null`,{method:'DELETE',headers:h}); if(!a.ok||!b.ok) throw new Error('Delete failed'); return res.json({ok:true}); }
    const [s,e]=await Promise.all([fetch(`${base}/rest/v1/game_sessions?select=*&order=last_seen_at.desc&limit=500`,{headers:h}),fetch(`${base}/rest/v1/player_events?select=*&order=occurred_at.desc&limit=3000`,{headers:h})]);
    if(!s.ok||!e.ok) throw new Error('Supabase query failed');
    const sessions=await s.json(), events=await e.json();
    return res.json({sessions,events});
  } catch(err){ console.error('admin query failed',err.message); return res.status(502).json({error:'Could not load analytics'}); }
};
