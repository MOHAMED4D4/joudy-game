'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Coins, Footprints, Shirt, X } from 'lucide-react';
import { SHOP_ITEMS, saveWorld, useWorldSave, type ShopItem } from '@/lib/joudyWorld';

type Category = 'outfit' | 'shoes';

interface Props {
  onClose: () => void;
}

function GarmentArt({ kind }: { kind?: string }) {
  const shared = { stroke: '#51463e', strokeWidth: 2.4, strokeLinejoin: 'round' as const };
  if (kind === 'utility') {
    return <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      <path d="M54 16 38 25 30 47 42 54 49 43 47 105 113 105 111 43 118 54 130 47 122 25 106 16 93 24 67 24Z" fill="#a88f70" {...shared}/>
      <path d="M66 24 80 31 94 24 99 104 61 104Z" fill="#d7c7ad" stroke="#6a5747" strokeWidth="1.8"/>
      <path d="M47 43 59 50 58 77 44 74ZM112 43 101 50 102 77 116 74Z" fill="#6d7955" stroke="#51463e" strokeWidth="2"/>
      <path d="M67 27 80 38 93 27M80 38V101" stroke="#79654c" strokeWidth="2.2" fill="none"/>
      <rect x="70" y="61" width="20" height="7" rx="2" fill="#4d4b3e"/><path d="M53 78h11v15H53zM96 78h11v15H96z" fill="#8d785e" stroke="#51463e" strokeWidth="1.5"/>
    </svg>;
  }
  if (kind === 'layered') {
    return <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      <path d="M57 13 43 23 30 44 44 53 53 41 47 106Q80 116 113 106L107 41 116 53 130 44 117 23 103 13 91 24H69Z" fill="#80617f" {...shared}/>
      <path d="M68 23Q80 34 92 23L101 104Q80 112 59 104Z" fill="#e9dfd4" stroke="#6d536b" strokeWidth="1.7"/>
      <path d="M49 75Q80 90 111 75L113 105Q80 119 47 105Z" fill="#a889a8" stroke="#51463e" strokeWidth="1.8"/>
      <path d="M59 87Q80 99 101 87M62 96Q80 105 98 96" fill="none" stroke="#e6d2a8" strokeWidth="2.2"/>
      <path d="M70 26 80 39 90 26" fill="none" stroke="#f2e8dc" strokeWidth="2.2"/>
      <circle cx="80" cy="51" r="4" fill="#e3c778"/>
    </svg>;
  }
  if (kind === 'longcoat') {
    return <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      <path d="M56 13 40 22 30 46 44 53 52 39 48 108 112 108 108 39 116 53 130 46 120 22 104 13 92 22H68Z" fill="#713e48" {...shared}/>
      <path d="M68 22 80 35 92 22 101 108H59Z" fill="#eee4d5" stroke="#594047" strokeWidth="1.8"/>
      <path d="M65 25 80 44 95 25M80 44V102" fill="none" stroke="#b98a69" strokeWidth="2.5"/>
      <path d="M50 73 67 79 65 108H48ZM110 73 93 79 95 108H112Z" fill="#552e38" stroke="#4e3036" strokeWidth="1.5"/>
      <rect x="69" y="57" width="22" height="6" rx="2" fill="#d5b16d"/>
    </svg>;
  }
  return <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
    <path d="M57 13 41 23 29 47 44 54 52 41 47 105Q80 116 113 105L108 41 116 54 131 47 119 23 103 13 91 23H69Z" fill="#244943" {...shared}/>
    <path d="M68 22 80 35 92 22 99 104H61Z" fill="#e8e1d4" stroke="#566455" strokeWidth="1.7"/>
    <path d="M68 28 80 39 92 28M80 39V101" fill="none" stroke="#b99a59" strokeWidth="2.2"/>
    <path d="M48 79 66 84 64 106H48ZM112 79 94 84 96 106H112Z" fill="#1c3934" stroke="#51463e" strokeWidth="1.5"/>
    <path d="M57 91 67 94M103 91 93 94" stroke="#cfb36d" strokeWidth="2"/>
  </svg>;
}

function ShoeArt({ kind }: { kind?: string }) {
  const color = kind === 'rose-boots' ? '#b9667e' : kind === 'high-top' ? '#3f587d' : kind === 'trail-boots' ? '#9b6e42' : kind === 'cloud' ? '#e5edf0' : '#83a7a3';
  const sole = kind === 'trail-boots' ? '#493d31' : '#f7f4ed';
  const tall = kind === 'rose-boots' || kind === 'high-top' || kind === 'trail-boots';
  return <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden="true">
    <g stroke="#34404d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d={tall ? 'M25 27Q35 20 49 26L53 52Q61 61 66 76Q67 86 57 89H28Q18 86 20 76L24 50Z' : 'M20 49Q27 35 44 38L58 50 67 75Q68 86 56 89H27Q17 86 18 76Z'} fill={color}/>
      <path d={tall ? 'M91 27Q101 20 115 26L119 52Q127 61 132 76Q133 86 123 89H94Q84 86 86 76L90 50Z' : 'M86 49Q93 35 110 38L124 50 133 75Q134 86 122 89H93Q83 86 84 76Z'} fill={color}/>
      <path d="M19 77Q42 85 67 76L69 84Q64 92 28 92Q18 90 19 77Z" fill={sole}/><path d="M85 77Q108 85 133 76L135 84Q130 92 94 92Q84 90 85 77Z" fill={sole}/>
      <path d="M32 45 49 62M98 45 115 62" fill="none" stroke="#f1e6d8" strokeWidth="3"/>
      {kind === 'trail-boots' ? <path d="M30 36H51M96 36H117M32 57 55 72M98 57 121 72" fill="none" stroke="#ead8bd" strokeWidth="2.5"/> : <path d="M30 54 49 68M96 54 115 68" fill="none" stroke="#f8f2e9" strokeWidth="2.5"/>}
    </g>
    {kind === 'rose-boots' && <g fill="#efc1c7"><circle cx="37" cy="35" r="4"/><circle cx="103" cy="35" r="4"/></g>}
    {kind === 'cloud' && <path d="M23 72Q43 78 62 71M89 72Q109 78 128 71" stroke="#83b6c5" strokeWidth="4" fill="none"/>}
  </svg>;
}

function ProductArt({ item }: { item: ShopItem }) {
  return (
    <div className="flex h-[106px] items-center justify-center rounded-xl border border-[#d9cbb5] bg-gradient-to-br from-[#f6f1e8] to-[#e8dfd2] p-2">
      {item.category === 'outfit' ? <GarmentArt kind={item.artId} /> : <ShoeArt kind={item.artId} />}
    </div>
  );
}

export default function WardrobeShopPanel({ onClose }: Props) {
  const save = useWorldSave();
  const [category, setCategory] = useState<Category>('outfit');
  const [selectedId, setSelectedId] = useState(save.equippedOutfit);
  const selected = useMemo(() => SHOP_ITEMS.find((item) => item.id === selectedId) ?? SHOP_ITEMS[0], [selectedId]);
  useEffect(() => {
    setSelectedId(category === 'outfit' ? save.equippedOutfit : save.equippedShoes);
  }, [category, save.equippedOutfit, save.equippedShoes]);
  const previewOutfit = category === 'outfit' ? selected : SHOP_ITEMS.find((item) => item.id === save.equippedOutfit) ?? SHOP_ITEMS[0];
  const previewShoes = category === 'shoes' ? selected : SHOP_ITEMS.find((item) => item.id === save.equippedShoes) ?? SHOP_ITEMS.find((item) => item.id === 'sneakers')!;
  const isOwned = save.owned.includes(selected.id);
  const currentlyEquipped = category === 'outfit' ? save.equippedOutfit === selected.id : save.equippedShoes === selected.id;

  const selectCategory = (next: Category) => {
    setCategory(next);
    setSelectedId(next === 'outfit' ? save.equippedOutfit : save.equippedShoes);
  };

  const purchaseOrEquip = () => {
    if (!isOwned && save.coins < selected.price) return;
    const equippedPatch = category === 'outfit' ? { equippedOutfit: selected.id } : { equippedShoes: selected.id };
    saveWorld((current) => ({
      ...current,
      ...equippedPatch,
      coins: isOwned ? current.coins : current.coins - selected.price,
      owned: isOwned ? current.owned : [...current.owned, selected.id],
    }));
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050b13]/80 p-2 backdrop-blur-md sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label="متجر الملابس والأحذية"
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.985 }}
          className="grid h-[96dvh] max-h-[96dvh] w-full max-w-6xl grid-cols-1 grid-rows-[minmax(290px,.85fr)_minmax(0,1.15fr)] overflow-hidden rounded-[1.7rem] border border-white/15 bg-[#f7f1e7] text-slate-900 shadow-2xl lg:grid-cols-[minmax(300px,.85fr)_minmax(460px,1.15fr)] lg:grid-rows-1"
        >
          <div className="relative order-1 flex min-h-[310px] flex-col border-b border-[#d6c9b5] bg-[radial-gradient(ellipse_at_50%_30%,#e6ddce_0%,#c9baa5_55%,#9f8e7a_100%)] p-3 sm:min-h-[390px] sm:p-5 lg:order-1 lg:border-b-0 lg:border-l">
            <div className="z-10 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#654e3c]">معاينة الإطلالة</p>
                <h2 className="text-lg font-black sm:text-xl">جودي</h2>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm font-black text-amber-900 shadow-sm"><Coins className="h-4 w-4" />{save.coins}</div>
            </div>

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-[#735b46]/30 to-transparent" />
            <div className="relative mx-auto mt-1 min-h-[240px] flex-1 w-full max-w-[430px]">
              <div className="absolute inset-y-0 left-0 w-[64%]">
                <Image src={previewOutfit.spriteSrc ?? '/images/outfits/look-1.png'} alt={`معاينة جودي بإطلالة ${previewOutfit.name}`} fill priority sizes="(max-width: 1024px) 58vw, 280px" className="object-contain drop-shadow-[0_15px_15px_rgba(26,23,20,.24)]" />
                {previewShoes.shoeSrc && <Image src={previewShoes.shoeSrc} alt="معاينة الحذاء" fill sizes="(max-width: 1024px) 58vw, 280px" className="pointer-events-none object-contain" />}
              </div>
              <div className="absolute right-0 top-[18%] z-20 w-[34%] rounded-2xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur sm:p-3">
                <p className="text-[11px] font-black leading-snug text-slate-900 sm:text-sm">{selected.name}</p>
                <p className="mt-1 text-[9px] font-semibold text-slate-500 sm:text-[10px]">{selected.price === 0 ? 'مجانية' : `${selected.price} عملة`} · {selected.rarity}</p>
                <button type="button" onClick={purchaseOrEquip} disabled={currentlyEquipped || (!isOwned && save.coins < selected.price)} className="mt-2 w-full rounded-xl bg-gradient-to-l from-amber-800 to-orange-700 px-2 py-2.5 text-[10px] font-black leading-tight text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 sm:text-xs">
                  {currentlyEquipped ? 'مُجهّز بالفعل' : isOwned ? 'تجهيز القطعة' : save.coins < selected.price ? 'العملات غير كافية' : 'شراء وتجهيز'}
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-1 rounded-xl border border-white/45 bg-white/55 px-3 py-2 text-center text-[10px] font-semibold leading-relaxed text-[#5b4c3d] sm:text-xs">{selected.description}</div>
          </div>

          <div className="order-2 flex min-h-0 flex-col p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div><p className="text-xs font-bold text-amber-800">متجر الإطلالات</p><h3 className="text-xl font-black sm:text-2xl">الملابس والأحذية</h3></div>
              <button type="button" onClick={onClose} aria-label="إغلاق المتجر" className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#e8dfd2] p-1.5">
              <button type="button" onClick={() => selectCategory('outfit')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${category === 'outfit' ? 'bg-[#263e3b] text-white shadow' : 'text-slate-700 hover:bg-white/65'}`}><Shirt className="h-4 w-4" /> الملابس</button>
              <button type="button" onClick={() => selectCategory('shoes')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${category === 'shoes' ? 'bg-[#263e3b] text-white shadow' : 'text-slate-700 hover:bg-white/65'}`}><Footprints className="h-4 w-4" /> الأحذية</button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pb-1 pr-0.5 sm:grid-cols-2 xl:grid-cols-3">
              {SHOP_ITEMS.filter((item) => item.category === category).map((item) => {
                const owned = save.owned.includes(item.id);
                const equipped = category === 'outfit' ? save.equippedOutfit === item.id : save.equippedShoes === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`relative rounded-2xl border p-2 text-right transition ${selectedId === item.id ? 'border-amber-700 bg-amber-100 shadow-md ring-1 ring-amber-600/25' : 'border-[#d9cbb5] bg-white hover:border-amber-500 hover:bg-amber-50'}`}>
                    {equipped && <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-700 p-1 text-white"><Check className="h-3 w-3" /></span>}
                    <ProductArt item={item} />
                    <p className="mt-2 truncate text-xs font-black sm:text-sm">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-bold">
                      <span className="text-amber-800">{item.price === 0 ? 'مجاني' : `${item.price} عملة`}</span>
                      <span className="text-slate-400">{owned ? 'مملوك' : item.rarity}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-slate-500 sm:text-xs">اختَر القطعة لمعاينتها على جودي قبل الشراء.</span>
              <button type="button" onClick={onClose} className="shrink-0 rounded-xl bg-[#263e3b] px-4 py-2.5 text-xs font-black text-white shadow hover:bg-[#1d302e]">العودة للمراحل</button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
