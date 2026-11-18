'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Coins, Shirt, Footprints, Settings, Gamepad2, X, Check } from 'lucide-react';
import { SHOP_ITEMS, useWorldSave, saveWorld, type ControlMode } from '@/lib/joudyWorld';

interface Props {
  animeImageSrc: string;
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPlayArcade: () => void;
}

export default function JoudyHome({ animeImageSrc, controlMode, onControlModeChange, soundEnabled, onToggleSound, onPlayArcade }: Props) {
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
    <main dir="rtl" className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,#34415f_0%,#17243a_48%,#091321_100%)] px-3 py-3 text-white sm:px-6 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-24px)] w-full max-w-6xl flex-col gap-3 sm:min-h-[calc(100dvh-40px)]">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 backdrop-blur-xl">
          <div><p className="text-[10px] font-bold tracking-[.22em] text-cyan-200/80">JOUdY · CHARACTER STUDIO</p><h1 className="text-xl font-black sm:text-2xl">خزانة جودي</h1></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 font-black text-amber-100"><Coins className="h-4 w-4"/><span>{save.coins}</span></div>
            <button onClick={() => setSettingsOpen(true)} aria-label="الإعدادات" className="rounded-xl border border-white/10 bg-white/10 p-2.5 text-white hover:bg-white/15"><Settings className="h-5 w-5"/></button>
          </div>
        </header>

        <section className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
          <div className="relative flex min-h-[48vh] items-end justify-center overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(ellipse_at_55%_35%,rgba(255,255,255,.18),transparent_42%),linear-gradient(145deg,#6e718f,#343e5e_54%,#18243a)] shadow-2xl lg:min-h-[620px]">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 15% 20%,white 1px,transparent 1.5px),radial-gradient(circle at 80% 30%,white 1px,transparent 1.5px)',backgroundSize:'52px 52px'}} />
            <div className="absolute bottom-0 h-[22%] w-full bg-gradient-to-t from-[#111c2d]/90 to-transparent" />
            <div className="absolute bottom-[13%] h-5 w-[55%] rounded-[50%] bg-black/30 blur-xl" />
            <motion.div className="relative z-10 h-[min(72vh,590px)] w-[min(76%,430px)]" animate={{y:[0,-5,0]}} transition={{duration:4.2,repeat:Infinity,ease:'easeInOut'}}>
              <Image src={animeImageSrc} alt="شخصية جودي الأصلية" fill priority sizes="(max-width: 1024px) 76vw, 430px" className="object-contain drop-shadow-[0_22px_25px_rgba(0,0,0,.42)]" style={{filter:equippedOutfit.filter}} />
            </motion.div>
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-xs backdrop-blur"><span className="font-bold">معاينة جودي</span><span className="text-white/65">تغيير الملابس ينعكس داخل اللعبة</span></div>
          </div>

          <aside className="flex flex-col gap-3 rounded-[1.8rem] border border-white/10 bg-slate-950/45 p-3 shadow-xl backdrop-blur-xl sm:p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-cyan-200">تخصيص الشخصية</p><h2 className="text-xl font-black">اختاري إطلالة جودي</h2></div><Shirt className="h-6 w-6 text-cyan-200"/></div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
              <button onClick={() => {setCategory('outfit');setSelectedId(save.equippedOutfit);}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${category==='outfit'?'bg-cyan-300 text-slate-950':'text-white/70'}`}><Shirt className="ml-1 inline h-4 w-4"/> الملابس</button>
              <button onClick={() => {setCategory('shoes');setSelectedId(save.equippedShoes);}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${category==='shoes'?'bg-cyan-300 text-slate-950':'text-white/70'}`}><Footprints className="ml-1 inline h-4 w-4"/> الأحذية</button>
            </div>
            <div className="grid max-h-[34vh] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2 lg:max-h-[390px]">
              {SHOP_ITEMS.filter((item)=>item.category===category).map((item)=>{
                const owned=save.owned.includes(item.id); const active=category==='outfit'?save.equippedOutfit===item.id:save.equippedShoes===item.id;
                return <button key={item.id} onClick={()=>setSelectedId(item.id)} className={`rounded-xl border p-2.5 text-right transition ${selectedId===item.id?'border-cyan-300 bg-cyan-300/10':'border-white/10 bg-white/[.035] hover:bg-white/[.07]'}`}>
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-white/10 to-white/[.02]"><Image src={animeImageSrc} alt="معاينة القطعة على جودي" width={78} height={78} className="h-full w-auto object-contain" style={{filter:category==='outfit'?item.filter:equippedOutfit.filter}} /></div>
                  <div className="flex items-center justify-between gap-1"><b className="text-xs">{item.name}</b>{active&&<Check className="h-3.5 w-3.5 text-emerald-300"/>}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-white/55"><span>{item.rarity}</span><span className="font-black text-amber-200">{owned?'مملوك':`${item.price} 🪙`}</span></div>
                </button>;
              })}
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="relative flex min-h-[126px] items-end justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#596582] to-[#202d46]"><Image src={animeImageSrc} alt={`معاينة ${selected.name}`} fill sizes="100px" className="object-contain" style={{filter:selectedFilter}}/></div>
              <div className="flex min-w-0 flex-col justify-between py-1"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{selected.name}</h3><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-cyan-100">{selected.rarity}</span></div><p className="mt-1 text-xs leading-5 text-white/65">{selected.description}</p><p className="mt-2 text-xs font-black text-amber-200">{selected.price} عملة</p></div>
                <button onClick={purchaseOrEquip} disabled={!isOwned&&save.coins<selected.price || isEquipped} className="mt-2 rounded-xl bg-gradient-to-l from-cyan-300 to-blue-400 px-3 py-2.5 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-45">{isEquipped?'مُجهّز بالفعل':isOwned?'تجهيز القطعة':save.coins<selected.price?'عملات غير كافية':'شراء وتجهيز'}</button>
              </div>
            </div>
            <button onClick={onPlayArcade} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-rose-400 to-fuchsia-500 px-4 py-3.5 font-black text-white shadow-lg shadow-fuchsia-900/20"><Gamepad2 className="h-5 w-5"/> دخول اللعبة الأصلية · 30 مستوى</button>
          </aside>
        </section>
        <p className="pb-1 text-center text-[10px] text-white/35">كل المشتريات والعملات محفوظة على هذا الجهاز</p>
      </div>

      <AnimatePresence>{settingsOpen&&<motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div initial={{y:12,scale:.98}} animate={{y:0,scale:1}} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111d2c] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">إعدادات اللعبة</h3><button onClick={()=>setSettingsOpen(false)} className="rounded-lg bg-white/10 p-2"><X className="h-4 w-4"/></button></div><p className="mb-3 text-sm text-white/60">اختار طريقة التحكم المفضلة للعبة الأصلية.</p><div className="grid gap-2 sm:grid-cols-2"><button onClick={()=>onControlModeChange('classic')} className={`rounded-xl border p-3 text-right ${controlMode==='classic'?'border-cyan-300 bg-cyan-300/10':'border-white/10 bg-white/5'}`}><b className="block">الأزرار الكلاسيكية</b><span className="text-xs text-white/55">يمين ويسار</span></button><button onClick={()=>onControlModeChange('joystick')} className={`rounded-xl border p-3 text-right ${controlMode==='joystick'?'border-cyan-300 bg-cyan-300/10':'border-white/10 bg-white/5'}`}><b className="block">العصا الافتراضية</b><span className="text-xs text-white/55">تحكم بالعصا</span></button></div><button onClick={onToggleSound} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold">{soundEnabled?'كتم صوت اللعبة':'تشغيل صوت اللعبة'}</button></motion.div></motion.div>}</AnimatePresence>
    </main>
  );
}
