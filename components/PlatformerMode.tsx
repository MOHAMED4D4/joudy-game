'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ChevronLeft, Gamepad2, Heart, RotateCcw, Trophy } from 'lucide-react';

type Props = { imageSrc: string; onBack: () => void };
type Phase = 'levels' | 'playing' | 'complete';

export default function PlatformerMode({ imageSrc, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('levels');
  const [level, setLevel] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [collected, setCollected] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, jump: false });
  const restartRef = useRef<() => void>(() => {});

  const startLevel = useCallback((n: number) => {
    setLevel(n); setScore(0); setHearts(3); setCollected(0); setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 960, H = 540, ground = 452;
    canvas.width = W; canvas.height = H;
    const worldWidth = 2500 + level * 65;
    const platforms = Array.from({ length: 12 + Math.min(level, 12) }, (_, i) => ({
      x: 270 + i * (145 + (level % 4) * 12), y: 365 - ((i * 71 + level * 13) % 145), w: 112, h: 18,
    }));
    const pickups = Array.from({ length: 14 + Math.floor(level / 2) }, (_, i) => ({
      x: 190 + i * 155, y: 310 - ((i * 47 + level * 19) % 155), taken: false,
    }));
    const hazards = Array.from({ length: 5 + Math.floor(level / 5) }, (_, i) => ({ x: 510 + i * 350, w: 48, h: 24 }));
    const player = { x: 70, y: ground - 100, vx: 0, vy: 0, w: 66, h: 100, grounded: false };
    const img = new window.Image(); img.src = imageSrc;
    let camera = 0, raf = 0, last = 0, points = 0, got = 0, lives = 3, ended = false;
    const finish = () => { if (ended) return; ended = true; setScore(points); setCollected(got); setHearts(lives); setUnlocked(v => Math.max(v, Math.min(30, level + 1))); setPhase('complete'); };
    const restart = () => { player.x = 70; player.y = ground - 100; player.vx = 0; player.vy = 0; player.grounded = false; camera = 0; points = 0; got = 0; lives = 3; pickups.forEach(p => p.taken = false); ended = false; setScore(0); setCollected(0); setHearts(3); };
    restartRef.current = restart;
    const keyDown = (e: KeyboardEvent) => { if (['ArrowLeft','ArrowRight',' ','ArrowUp','a','d','w'].includes(e.key)) e.preventDefault(); if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true; if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true; if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.current.jump = true; };
    const keyUp = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false; if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false; if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.current.jump = false; };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    const draw = (time: number) => {
      const dt = Math.min((time - last) / 16.67 || 1, 2); last = time;
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#172b43'); sky.addColorStop(.58,'#526d7a'); sky.addColorStop(1,'#c2a77e'); ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
      // layered distant mountains and atmospheric haze
      for (let layer=0; layer<3; layer++) { ctx.fillStyle = ['#263d4d','#314b50','#53665b'][layer]; ctx.beginPath(); ctx.moveTo(0,H); for(let x=0;x<=W+40;x+=40){ const y=230+layer*54+Math.sin((x+camera*(.12+layer*.12))/115)*25+Math.cos((x+camera*.1)/67)*13; ctx.lineTo(x,y); } ctx.lineTo(W,H); ctx.fill(); }
      // distant warm city silhouettes
      ctx.fillStyle='rgba(15,28,39,.42)'; for(let i=0;i<22;i++){const x=((i*73-camera*.28)%(W+100)+W+100)%(W+100)-50; const bh=45+(i*31%75);ctx.fillRect(x,ground-100-bh,34,bh+100);}
      ctx.fillStyle='#273d39'; ctx.fillRect(0,ground,W,H-ground); ctx.fillStyle='#8b7759'; ctx.fillRect(0,ground+10,W,H-ground);
      ctx.fillStyle='#b9a078'; for(let x=0;x<W;x+=85){ctx.fillRect(x,ground+18,52,3);}
      // platforms
      platforms.forEach(p=>{const x=p.x-camera;if(x<-150||x>W+150)return;ctx.fillStyle='#4a4036';ctx.fillRect(x,p.y,p.w,p.h+9);ctx.fillStyle='#b28a58';ctx.fillRect(x,p.y,p.w,7);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+5,p.y+2,p.w-10,2);});
      // pickups: luminous paw medallions
      pickups.forEach(p=>{if(p.taken)return;const x=p.x-camera;if(x<-30||x>W+30)return;ctx.save();ctx.shadowColor='#f8d27b';ctx.shadowBlur=18;ctx.fillStyle='#f4c66e';ctx.beginPath();ctx.arc(x,p.y,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#60482e';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('🐾',x,p.y+5);ctx.restore();});
      hazards.forEach(h=>{const x=h.x-camera;if(x<-80||x>W+80)return;ctx.fillStyle='#3a2524';ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x+h.w/2,ground-h.h);ctx.lineTo(x+h.w,ground);ctx.fill();ctx.fillStyle='#d17a54';ctx.fillRect(x+5,ground-4,h.w-10,4);});
      // player: original in-game Joudy photo, contained in a clean character frame
      ctx.save(); ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=15;ctx.shadowOffsetY=7;
      if(img.complete&&img.naturalWidth){ctx.drawImage(img,player.x-camera,player.y,player.w,player.h);} else {ctx.fillStyle='#d9c5b4';ctx.fillRect(player.x-camera,player.y,player.w,player.h);} ctx.restore();
      // goal arch
      const gx=worldWidth-camera; if(gx>-100&&gx<W+100){ctx.fillStyle='#d6b36b';ctx.fillRect(gx,ground-145,18,145);ctx.fillRect(gx+88,ground-145,18,145);ctx.fillRect(gx,ground-145,106,16);ctx.fillStyle='#fff0bf';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('FINISH',gx+53,ground-113);}
      if(!ended){
        const dir=(keys.current.right?1:0)-(keys.current.left?1:0); player.vx += (dir*5.4-player.vx)*.22; player.x += player.vx*dt; player.vy += .62*dt; player.y += player.vy*dt; player.grounded=false;
        const prevBottom=player.y-player.vy*dt+player.h;
        if(player.y+player.h>=ground){player.y=ground-player.h;player.vy=0;player.grounded=true;}
        platforms.forEach(p=>{if(player.x+player.w>p.x&&player.x<p.x+p.w&&prevBottom<=p.y+8&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.grounded=true;}});
        if(keys.current.jump&&player.grounded){player.vy=-13.5;player.grounded=false;keys.current.jump=false;}
        pickups.forEach(p=>{if(!p.taken&&Math.abs((player.x+player.w/2)-p.x)<35&&Math.abs((player.y+player.h/2)-p.y)<58){p.taken=true;points+=25;got++;setScore(points);setCollected(got);}});
        hazards.forEach(h=>{if(player.x+player.w>h.x&&player.x<h.x+h.w&&player.y+player.h>ground-h.h){player.x=Math.max(40,player.x-75);player.vy=-5;lives=Math.max(0,lives-1);setHearts(lives);if(lives===0)restart();}});
        player.x=Math.max(0,Math.min(worldWidth-80,player.x)); camera=Math.max(0,Math.min(worldWidth-W,player.x-W*.34));
        if(player.x>=worldWidth-100)finish();
      }
      // compact progress rail
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(24,22,W-48,8);ctx.fillStyle='#e5bd72';ctx.fillRect(24,22,(W-48)*Math.min(1,player.x/worldWidth),8);
      if(!ended) raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);};
  }, [phase, level, imageSrc]);

  return <section className="mx-auto flex min-h-[90dvh] w-full max-w-6xl flex-col justify-center px-3 py-5 text-white sm:px-6">
    <div className="mb-5 flex items-center justify-between"><button onClick={phase==='playing'?()=>setPhase('levels'):onBack} className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm"><ChevronLeft size={17}/> رجوع</button><div className="text-xs tracking-[.18em] text-amber-200">PLATFORM ADVENTURE · 30 STAGES</div></div>
    {phase==='levels'&&<><div className="mb-5"><p className="text-sm font-semibold text-amber-300">النمط الثاني</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">مغامرة المنصات</h2><p className="mt-2 text-sm text-slate-300">اقفزي بين المنصات، اجمعي الشارات، وتجاوزي العقبات حتى بوابة نهاية المرحلة.</p></div><div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">{Array.from({length:30},(_,i)=>i+1).map(n=><button key={n} disabled={n>unlocked} onClick={()=>startLevel(n)} className={`aspect-square rounded-xl border text-lg font-black transition ${n<=unlocked?'border-amber-300/50 bg-gradient-to-br from-[#55452f] to-[#172738] text-amber-100 hover:-translate-y-1 hover:border-amber-200':'border-white/10 bg-slate-900/70 text-slate-600'}`}>{n<=unlocked?n:<span className="text-sm">🔒</span>}</button>)}</div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"><Gamepad2 className="text-amber-300"/> الحركة بالأسهم أو A و D، والقفز بزر المسافة. على الهاتف استخدمي أزرار التحكم أسفل الشاشة.</div></>}
    {phase==='playing'&&<><div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2"><b>المرحلة {level} / 30</b><div className="flex items-center gap-4 text-sm"><span>✦ {score}</span><span className="flex gap-1"><Heart className="fill-rose-500 text-rose-500" size={17}/> {hearts}</span><span>تم جمع {collected}</span></div></div><div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl"><canvas ref={canvasRef} className="block aspect-[16/9] w-full" /></div><div className="mt-3 flex items-center justify-between gap-3"><div className="flex gap-2"><button onPointerDown={()=>keys.current.left=true} onPointerUp={()=>keys.current.left=false} onPointerLeave={()=>keys.current.left=false} className="rounded-xl bg-slate-800 px-6 py-3"><ArrowLeft/></button><button onPointerDown={()=>keys.current.right=true} onPointerUp={()=>keys.current.right=false} onPointerLeave={()=>keys.current.right=false} className="rounded-xl bg-slate-800 px-6 py-3"><ArrowRight/></button></div><button onPointerDown={()=>keys.current.jump=true} onPointerUp={()=>keys.current.jump=false} onPointerLeave={()=>keys.current.jump=false} className="rounded-xl bg-amber-400 px-8 py-3 font-black text-slate-950">قفز</button><button onClick={()=>restartRef.current()} className="rounded-xl border border-white/15 bg-slate-900 p-3"><RotateCcw size={18}/></button></div></>}
    {phase==='complete'&&<div className="mx-auto w-full max-w-xl rounded-3xl border border-amber-200/30 bg-slate-950/85 p-7 text-center shadow-2xl"><Trophy className="mx-auto mb-3 text-amber-300" size={46}/><h2 className="text-3xl font-black">تم اجتياز المرحلة</h2><p className="mt-2 text-slate-300">المرحلة {level} · {score} نقطة · {collected} شارة</p><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={()=>startLevel(Math.min(30,level+1))} disabled={level===30} className="rounded-xl bg-amber-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40">المرحلة التالية</button><button onClick={()=>startLevel(level)} className="rounded-xl border border-white/15 px-4 py-3">إعادة اللعب</button></div><button onClick={()=>setPhase('levels')} className="mt-3 w-full rounded-xl bg-slate-800 px-4 py-3">قائمة المراحل</button></div>}
  </section>;
}
