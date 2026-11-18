'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Coins, Shirt, Footprints, Settings, Gamepad2, X, Check, Eye } from 'lucide-react';
import { SHOP_ITEMS, useWorldSave, saveWorld } from '@/lib/joudyWorld';

interface Props {
  animeImageSrc: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPlayArcade: () => void;
}

export default function JoudyHome({ animeImageSrc, soundEnabled, onToggleSound, onPlayArcade }: Props) {
  const save = useWorldSave();
  const [category, setCategory] = useState<'outfit' | 'shoes'>('outfit');
  const [selectedId, setSelectedId] = useState(save.equippedOutfit);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selected = useMemo(() => SHOP_ITEMS.find((item) => item.id === selectedId) ?? SHOP_ITEMS[0], [selectedId]);
  const equipped = category === 'outfit' ? save.equippedOutfit : save.equippedShoes;
  const isOwned = save.owned.includes(selected.id);
  const isEquipped = equipped === selected.id;
  const equippedOutfit = SHOP_ITEMS.find((item) => item.id === save.equippedOutfit) ?? SHOP_ITEMS[0];
  const selectedFilter = category === 'outfit' ? selected.filter : equippedOutfit.filter;

  const purchaseOrEquip = () => {
    if (isOwned) {
      saveWorld(category === 'outfit' ? { equippedOutfit: selected.id } : { equippedShoes: selected.id });
      return;
    }
    if (save.coins < selected.price) return;
    saveWorld((current) => ({
      ...current,
      coins: current.coins - selected.price,
      owned: [...current.owned, selected.id],
      ...(category === 'outfit' ? { equippedOutfit: selected.id } : { equippedShoes: selected.id }),
    }));
  };

  return (
    <main dir="rtl" className="relative min-h-[100dvh] w-full overflow-hidden bg-[#d9c8ae] text-slate-900">
      <style jsx global>{`
        @keyframes joudy-idle { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes joudy-eyes-look { 0%,18%,100% { transform: translate(0,0) } 30%,44% { transform: translate(2px,-1px) } 58%,72% { transform: translate(-2px,0) } 84% { transform: translate(1px,1px) } }
        @keyframes joudy-blink { 0%, 46%, 49%, 100% { transform: scaleY(1) } 47.5% { transform: scaleY(.12) } }
        .joudy-eye-pupil { transform-box: fill-box; transform-origin: center; animation: joudy-eyes-look 5.8s ease-in-out infinite; }
        .joudy-eye-left { animation-delay: .08s; }
        .joudy-eye-right { animation-delay: .16s; }
        .joudy-eye-blink { transform-origin: center; animation: joudy-blink 4.6s ease-in-out infinite; }
      `}</style>

      {/* Quiet, natural home interior — intentionally kept uncluttered */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[76%] bg-[linear-gradient(180deg,#eee5d7_0%,#e5d7c4_72%,#d2bea3_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[25%] bg-[linear-gradient(180deg,#b58d68_0%,#916b4f_100%)]" />
        <div className="absolute inset-x-0 bottom-[24.5%] h-[2px] bg-[#87664e]/35" />
        <div className="absolute right-[7%] top-[9%] h-[30%] w-[22%] rounded-md border-[10px] border-[#a98666] bg-[#b9d0d4] shadow-[0_10px_25px_rgba(70,50,30,.13)] sm:w-[18%]">
          <div className="absolute inset-y-0 left-1/2 w-[5px] -translate-x-1/2 bg-[#a98666]"/><div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 bg-[#a98666]"/>
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
        </div>
        <div className="absolute left-[8%] top-[13%] h-[26%] w-[3px] bg-[#bda58b]/45" />
        <div className="absolute bottom-[14%] left-1/2 h-[8%] w-[48%] -translate-x-1/2 rounded-[50%] bg-[#634a39]/20 blur-xl" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1500px] flex-col p-2.5 sm:p-4">
        <header className="z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/55 bg-white/65 px-3 py-2.5 shadow-sm backdrop-blur-md sm:px-5">
          <div><p className="text-[10px] font-bold tracking-[.18em] text-amber-900/65">WARDROBE</p><h1 className="text-lg font-black sm:text-xl">ملابس جودي</h1></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-700/15 bg-amber-100/90 px-3 py-2 font-black text-amber-950"><Coins className="h-4 w-4"/><span>{save.coins}</span></div>
            <button onClick={() => setSettingsOpen(true)} aria-label="الإعدادات" className="rounded-xl border border-amber-900/10 bg-white/75 p-2.5 text-amber-950 hover:bg-white"><Settings className="h-5 w-5"/></button>
          </div>
        </header>

        <section className="relative mt-3 grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(350px,410px)]">
          {/* Character stands in the same room, alone; pupils move continuously */}
          <div className="relative flex min-h-[54vh] items-end justify-center overflow-hidden rounded-[1.6rem] border border-white/45 bg-white/10 lg:min-h-[690px]">
            <div className="absolute bottom-0 h-[23%] w-full bg-gradient-to-t from-[#63452f]/35 via-[#79583f]/10 to-transparent" />
            <div className="absolute bottom-[4%] left-1/2 h-[4%] w-[25%] -translate-x-1/2 rounded-[50%] bg-[#38271d]/30 blur-xl" />
            <div className="relative mb-[2%] aspect-square w-[min(78vw,570px)]" style={{animation:'joudy-idle 4.2s ease-in-out infinite'}}>
              <Image src="/images/joudy-home.png" alt="جودي" fill priority sizes="(max-width: 1024px) 76vw, 520px" className="object-contain drop-shadow-[0_18px_18px_rgba(25,20,16,.32)]" style={{filter:equippedOutfit.filter}} />
              {/* Small animated pupils layered over the original eyes to give the character a living idle gaze. */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1024 1024" aria-hidden="true">
                <g className="joudy-eye-blink">
                  <g className="joudy-eye-pupil joudy-eye-left"><ellipse cx="414" cy="320" rx="7.2" ry="9" fill="#253b32"/><circle cx="411" cy="316" r="2.4" fill="#fff"/></g>
                  <g className="joudy-eye-pupil joudy-eye-right"><ellipse cx="594" cy="320" rx="7.2" ry="9" fill="#253b32"/><circle cx="591" cy="316" r="2.4" fill="#fff"/></g>
                </g>
              </svg>
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-3 rounded-[1.6rem] border border-white/60 bg-[#fffaf2]/90 p-3 shadow-lg backdrop-blur-md sm:p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-amber-800">غرفة تغيير الملابس</p><h2 className="text-xl font-black">اختاري إطلالة جودي</h2></div><Shirt className="h-6 w-6 text-amber-800"/></div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-amber-900/5 p-1">
              <button onClick={() => {setCategory('outfit');setSelectedId(save.equippedOutfit);}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${category==='outfit'?'bg-amber-800 text-white':'text-amber-950/65'}`}><Shirt className="ml-1 inline h-4 w-4"/> الملابس</button>
              <button onClick={() => {setCategory('shoes');setSelectedId(save.equippedShoes);}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${category==='shoes'?'bg-amber-800 text-white':'text-amber-950/65'}`}><Footprints className="ml-1 inline h-4 w-4"/> الأحذية</button>
            </div>
            <div className="grid max-h-[31vh] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-3 lg:max-h-[390px]">
              {SHOP_ITEMS.filter((item)=>item.category===category).map((item)=>{
                const owned=save.owned.includes(item.id); const active=category==='outfit'?save.equippedOutfit===item.id:save.equippedShoes===item.id;
                return <button key={item.id} onClick={()=>setSelectedId(item.id)} className={`rounded-xl border p-2 text-right transition ${selectedId===item.id?'border-amber-700 bg-amber-100':'border-amber-900/10 bg-white hover:bg-amber-50'}`}>
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-100 to-stone-100"><Image src={animeImageSrc} alt={`معاينة ${item.name}`} width={74} height={74} className="h-full w-auto object-contain" style={{filter:category==='outfit'?item.filter:equippedOutfit.filter}} /></div>
                  <div className="flex items-center justify-between gap-1"><b className="text-xs text-slate-900">{item.name}</b>{active&&<Check className="h-3.5 w-3.5 text-emerald-700"/>}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500"><span>{item.rarity}</span><span className="font-black text-amber-800">{owned?'مملوك':`${item.price} 🪙`}</span></div>
                </button>;
              })}
            </div>
            <div className="grid grid-cols-[96px_1fr] gap-3 rounded-xl border border-amber-900/10 bg-white p-2.5">
              <div className="relative flex min-h-[120px] items-end justify-center overflow-hidden rounded-lg bg-gradient-to-b from-amber-100 to-stone-100"><Image src={animeImageSrc} alt={`معاينة ${selected.name}`} fill sizes="96px" className="object-contain" style={{filter:selectedFilter}}/></div>
              <div className="flex min-w-0 flex-col justify-between py-1"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{selected.name}</h3><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900">{selected.rarity}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{selected.description}</p><p className="mt-2 text-xs font-black text-amber-800">{selected.price} عملة</p></div>
                <button onClick={purchaseOrEquip} disabled={!isOwned&&save.coins<selected.price || isEquipped} className="mt-2 rounded-lg bg-gradient-to-l from-amber-700 to-orange-700 px-3 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45">{isEquipped?'مُجهّز بالفعل':isOwned?'تجهيز القطعة':save.coins<selected.price?'عملات غير كافية':'شراء وتجهيز'}</button>
              </div>
            </div>
            <button onClick={onPlayArcade} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-rose-600 to-fuchsia-700 px-4 py-3.5 font-black text-white shadow-lg"><Gamepad2 className="h-5 w-5"/> ابدأ اللعب · 30 مستوى</button>
          </aside>
        </section>
        <p className="py-2 text-center text-[10px] text-amber-950/55">الإطلالة المختارة ترافق جودي أثناء اللعب</p>
      </div>

      <AnimatePresence>{settingsOpen&&<motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div initial={{y:12,scale:.98}} animate={{y:0,scale:1}} className="w-full max-w-md rounded-2xl border border-white/30 bg-[#fffaf2] p-5 text-slate-900 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">إعدادات التحكم</h3><button onClick={()=>setSettingsOpen(false)} className="rounded-lg bg-amber-900/10 p-2"><X className="h-4 w-4"/></button></div><p className="mb-3 text-sm text-slate-600">اسحب بإصبعك داخل مساحة اللعب للتحرك يمينًا ويسارًا ولأعلى ولأسفل.</p><button onClick={onToggleSound} className="mt-3 w-full rounded-xl border border-amber-900/10 bg-white p-3 text-sm font-bold">{soundEnabled?'كتم صوت اللعبة':'تشغيل صوت اللعبة'}</button></motion.div></motion.div>}</AnimatePresence>
    </main>
  );
}
