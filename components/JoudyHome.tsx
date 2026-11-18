'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  BedDouble, Camera, Coins, Gamepad2, Gift, Heart, Home, Mic, Moon, Music2,
  Settings, ShoppingBag, Sofa, Sparkles, Utensils, Volume2, X, KeyRound,
} from 'lucide-react';
import { DECOR_ITEMS, PET_ITEMS, SHOP_ITEMS, saveWorld, useWorldSave, type ControlMode } from '@/lib/joudyWorld';
import { loadTransparentSprite } from '@/lib/spriteUtils';

interface Props {
  animeImageSrc: string;
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPlayArcade: () => void;
}

type Room = 'bedroom' | 'kitchen' | 'living' | 'pets' | 'closet' | 'album';
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResultLike = { 0: SpeechRecognitionAlternative };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };

const roomMeta: Record<Room, { label: string; icon: React.ReactNode; eyebrow: string }> = {
  bedroom: { label: 'غرفة النوم', icon: <BedDouble className="h-4 w-4" />, eyebrow: 'وقت الراحة' },
  kitchen: { label: 'المطبخ', icon: <Utensils className="h-4 w-4" />, eyebrow: 'وقت الأكل' },
  living: { label: 'الصالة', icon: <Sofa className="h-4 w-4" />, eyebrow: 'وقت التفاعل' },
  pets: { label: 'ركن الحيوانات', icon: <Heart className="h-4 w-4" />, eyebrow: 'أصدقاء جودي' },
  closet: { label: 'الخزانة والمتجر', icon: <ShoppingBag className="h-4 w-4" />, eyebrow: 'الأزياء والديكور' },
  album: { label: 'الألبوم', icon: <Camera className="h-4 w-4" />, eyebrow: 'ذكريات المغامرات' },
};

const roomStyles: Record<string, string> = {
  warm: 'from-[#f5dfcc] via-[#edcbb8] to-[#b98f86]',
  night: 'from-[#1e2c50] via-[#34446f] to-[#786a9a]',
  mint: 'from-[#d7eee2] via-[#badccc] to-[#87b6a7]',
  rose: 'from-[#f5d9e2] via-[#e8bdca] to-[#c68ca3]',
  pets: 'from-[#d9e8f7] via-[#b8d4e8] to-[#8faec7]',
  gold: 'from-[#e8d5a1] via-[#b89a62] to-[#6e5946]',
};

export default function JoudyHome({ animeImageSrc, controlMode, onControlModeChange, soundEnabled, onToggleSound, onPlayArcade }: Props) {
  const save = useWorldSave();
  const [room, setRoom] = useState<Room>('living');
  const [spriteSrc, setSpriteSrc] = useState(animeImageSrc);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoPose, setPhotoPose] = useState<'happy' | 'calm' | 'star'>('happy');
  const [toast, setToast] = useState('أهلًا! نورت البيت ✨');
  const [speechBusy, setSpeechBusy] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [shopCategory, setShopCategory] = useState<'outfit' | 'shoes' | 'decor'>('outfit');
  const [petNeeds, setPetNeeds] = useState({ food: 68, energy: 74, mood: 82 });
  const [decorRoom, setDecorRoom] = useState<'bedroom' | 'kitchen' | 'living'>('living');

  useEffect(() => {
    let active = true;
    loadTransparentSprite(animeImageSrc).then(({ dataUrl }) => { if (active) setSpriteSrc(dataUrl); }).catch(() => undefined);
    return () => { active = false; };
  }, [animeImageSrc]);

  const equippedItem = useMemo(() => SHOP_ITEMS.find((item) => item.id === save.equippedOutfit) ?? SHOP_ITEMS[0], [save.equippedOutfit]);
  const equippedShoe = useMemo(() => SHOP_ITEMS.find((item) => item.id === save.equippedShoes) ?? SHOP_ITEMS.find((item) => item.id === 'sneakers')!, [save.equippedShoes]);
  const roomDecor = save.decorEquipped[room] ?? `${room}-default`;
  const currentDecor = DECOR_ITEMS.find((item) => item.id === roomDecor);
  const theme = room === 'pets' ? 'pets' : currentDecor?.theme ?? (room === 'bedroom' ? 'warm' : room === 'kitchen' ? 'mint' : 'warm');
  const equippedPet = PET_ITEMS.find((pet) => pet.id === save.equippedPet) ?? PET_ITEMS[0];
  const today = new Date().toISOString().slice(0, 10);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setToast('الصوت غير مدعوم في هذا المتصفح، لكن التفاعل النصي شغال.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.94;
    utterance.pitch = 1.18;
    utterance.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => /female|woman|zira|samantha|aria|salma|laila|heze/i.test(item.name))
      ?? voices.find((item) => item.lang.toLowerCase().startsWith('ar'));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeechBusy(true);
    utterance.onend = () => setSpeechBusy(false);
    utterance.onerror = () => setSpeechBusy(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const react = useCallback((line: string) => {
    setToast(line);
    speak(line);
  }, [speak]);

  const repeatPlayer = useCallback(() => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setToast('التعرف على الصوت غير متاح في هذا المتصفح. جرّب Chrome أو استخدم زر التفاعل الصوتي.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'ar-EG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const words = event.results[0]?.[0]?.transcript?.trim();
      if (words) {
        const answer = `إنت قلت: ${words}`;
        setToast(answer);
        speak(answer);
      }
    };
    recognition.onerror = () => setToast('مش سامعة كويس، جرّب تاني.');
    recognition.start();
    setToast('جودي بتسمعك… اتكلم دلوقتي 🎙️');
  }, [speak]);

  const claimDaily = () => {
    if (save.lastDaily === today) { setDailyClaimed(true); setToast('مكافأة النهارده اتاخدت بالفعل.'); return; }
    saveWorld((current) => ({ ...current, coins: current.coins + 30, lastDaily: today }));
    setDailyClaimed(true);
    react('مكافأة جميلة! شكرًا ليك ❤️');
  };

  const buyItem = (item: typeof SHOP_ITEMS[number]) => {
    if (save.owned.includes(item.id)) {
      saveWorld(item.category === 'outfit' ? { equippedOutfit: item.id } : { equippedShoes: item.id });
      setToast(`جودي جرّبت ${item.name} ✨`);
      return;
    }
    if (save.coins < item.price) { setToast('العملات مش كفاية لسه. العب مرحلة واجمع أكتر.'); return; }
    saveWorld((current) => ({ ...current, coins: current.coins - item.price, owned: [...current.owned, item.id], ...(item.category === 'outfit' ? { equippedOutfit: item.id } : { equippedShoes: item.id }) }));
    setToast(`مبروك! اشتريت ${item.name} 🎉`);
    speak('جودي');
  };

  const buyPet = (pet: typeof PET_ITEMS[number]) => {
    if (save.petsOwned.includes(pet.id)) {
      saveWorld({ equippedPet: pet.id });
      setToast(`صاحب جودي الجديد هو ${pet.name} 🐾`);
      return;
    }
    if (save.coins < pet.price) { setToast('العملات مش كفاية لسه. العب واجمع أكتر.'); return; }
    saveWorld((current) => ({ ...current, coins: current.coins - pet.price, petsOwned: [...current.petsOwned, pet.id], equippedPet: pet.id }));
    setToast(`انضم ${pet.name} لعالم جودي! 🎉`);
    speak('جودي');
  };

  const buyDecor = (item: typeof DECOR_ITEMS[number]) => {
    if (save.decorOwned.includes(item.id)) {
      saveWorld((current) => ({ ...current, decorEquipped: { ...current.decorEquipped, [item.room]: item.id } }));
      setToast(`تم تغيير الديكور إلى ${item.name}`);
      return;
    }
    if (save.coins < item.price) { setToast('محتاج عملات أكتر للديكور ده.'); return; }
    saveWorld((current) => ({ ...current, coins: current.coins - item.price, decorOwned: [...current.decorOwned, item.id], decorEquipped: { ...current.decorEquipped, [item.room]: item.id } }));
    setToast(`الديكور الجديد وصل: ${item.name} ✨`);
  };

  const feedJoudy = () => {
    if (save.coins < 10) { setToast('محتاج 10 عملات عشان تجيبلها وجبة.'); return; }
    saveWorld((current) => ({ ...current, coins: current.coins - 10 }));
    setPetNeeds((current) => ({ ...current, food: Math.min(100, current.food + 28), mood: Math.min(100, current.mood + 8) }));
    react('شكرًا! الأكل كان لذيذ جدًا!');
  };

  const sleepJoudy = () => {
    setPetNeeds((current) => ({ ...current, energy: Math.min(100, current.energy + 35) }));
    react('تصبح على خير… هرتاح شوية 🌙');
  };

  const takePhoto = () => {
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 900; canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const gradient = ctx.createLinearGradient(0, 0, 900, 700);
      gradient.addColorStop(0, '#24354d'); gradient.addColorStop(1, '#8e6d80');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 900, 700);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      for (let i = 0; i < 38; i++) { const x = (i * 137) % 900; const y = (i * 83) % 700; ctx.beginPath(); ctx.arc(x, y, (i % 3) + 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.drawImage(image, 220, 36, 460, 620);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Joudy', 450, 665);
      const link = document.createElement('a'); link.download = 'joudy-photo.png'; link.href = canvas.toDataURL('image/png'); link.click();
      setToast('الصورة اتجهزت وحُفظت على جهازك 📸');
    };
    image.src = spriteSrc;
  };

  const roomBackground = room === 'bedroom' ? 'room-bedroom' : room === 'kitchen' ? 'room-kitchen' : room === 'living' ? 'room-living' : room === 'pets' ? 'room-pets' : 'room-closet';

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="joudy-world min-h-dvh w-full overflow-hidden px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101b2b]/80 px-4 py-3 shadow-xl backdrop-blur-xl">
          <div><p className="text-[10px] font-bold tracking-[.28em] text-cyan-300">THE WORLD OF JOUDY</p><h1 className="text-xl font-black text-white sm:text-2xl">عالم جودي</h1></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-200"><Coins className="h-4 w-4" />{save.coins}</div>
            <div className="flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-2 text-sm font-black text-blue-200" title="المفاتيح الزرقاء"><KeyRound className="h-4 w-4" />{save.blueKeys}</div>
            <button onClick={() => setSettingsOpen(true)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 hover:bg-white/10" aria-label="الإعدادات"><Settings className="h-5 w-5" /></button>
            <button onClick={onToggleSound} className={`rounded-xl border border-white/10 p-2.5 ${soundEnabled ? 'bg-cyan-400/15 text-cyan-200' : 'bg-rose-500/15 text-rose-200'}`} aria-label="الصوت"><Volume2 className="h-5 w-5" /></button>
          </div>
        </header>

        <section className="grid min-h-[610px] gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,.8fr)]">
          <div className={`joudy-room ${roomBackground} relative flex min-h-[500px] flex-col overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_28px_90px_rgba(0,0,0,.42)]`}>
            <div className={`room-wall absolute inset-0 bg-gradient-to-br ${roomStyles[theme] ?? roomStyles.warm}`} />
            <div className="room-window absolute right-[7%] top-[9%] h-36 w-44 rounded-[2rem] border-[9px] border-white/40 bg-gradient-to-b from-sky-300/80 to-amber-100/60 shadow-2xl"><div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-white/40" /><div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-white/40" /></div>
            <div className="room-floor absolute bottom-0 h-[30%] w-full border-t-8 border-white/15 bg-[#5a3e4a]/35" />
            <div className="absolute bottom-[9%] left-[8%] h-20 w-56 rounded-[50%] bg-black/20 blur-xl" />
            <div className="absolute bottom-[12%] left-[7%] text-5xl opacity-90">{room === 'bedroom' ? '🛏️' : room === 'kitchen' ? '🍽️' : room === 'living' ? '🛋️' : room === 'pets' ? '🐾' : '👗'}</div>
            <div className="absolute bottom-[13%] right-[8%] text-4xl opacity-90">{room === 'bedroom' ? '🌙' : room === 'kitchen' ? '🧁' : room === 'living' ? '🪴' : room === 'pets' ? equippedPet.emoji : '👠'}</div>
            <div className="relative z-10 flex items-start justify-between gap-3 p-5 sm:p-7">
              <div><p className="text-xs font-bold text-white/70">{roomMeta[room].eyebrow}</p><h2 className="mt-1 text-2xl font-black text-white drop-shadow sm:text-3xl">{roomMeta[room].label}</h2></div>
              <div className="rounded-xl border border-white/20 bg-black/15 px-3 py-2 text-xs font-bold text-white backdrop-blur">{currentDecor?.name ?? 'ديكور الغرفة'}</div>
            </div>
            <div className="relative z-10 flex flex-1 items-end justify-center pb-[5%]">
              <motion.button type="button" onClick={() => react(['أهلًا! إزيك؟ 💚', 'يلا نعمل حاجة ممتعة!', 'وحشتني الزيارة دي ✨', 'شايف الديكور الجديد؟'][Math.floor(Math.random() * 4)])} whileTap={{ scale: .97 }} animate={{ y: [0, -8, 0], rotate: [-.6, .6, -.6] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative h-[390px] w-[min(72vw,370px)] max-w-full cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/60" aria-label="اضغط للتفاعل مع جودي">
                <Image src={spriteSrc} alt="جودي بشخصية الأنمي الأصلية" fill priority sizes="(max-width: 768px) 72vw, 370px" className="object-contain drop-shadow-[0_25px_24px_rgba(0,0,0,.28)]" style={{ filter: equippedItem.filter }} />
                {speechBusy && <span className="absolute right-5 top-16 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow">بتتكلم…</span>}
                <span className="absolute bottom-5 right-0 rounded-full border border-white/20 bg-slate-950/45 px-3 py-1 text-[10px] font-bold text-white/90 backdrop-blur">{equippedShoe.name}</span>
              </motion.button>
              <AnimatePresence><motion.div key={toast} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute bottom-4 left-1/2 z-20 max-w-[85%] -translate-x-1/2 rounded-2xl border border-white/25 bg-[#101b2b]/80 px-4 py-2 text-center text-sm font-bold text-white shadow-xl backdrop-blur">{toast}</motion.div></AnimatePresence>
            </div>
            <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 p-4 pt-1 sm:gap-3">
              <button onClick={() => react('جودي بتقولك: أهلاً بيك!')} className="home-action"><Heart className="h-4 w-4" /> تفاعل</button>
              <button onClick={repeatPlayer} className="home-action"><Mic className="h-4 w-4" /> اسمعني وكرّر</button>
              <button onClick={() => { setPhotoOpen(true); setToast('اختار وضعية الصورة 📸'); }} className="home-action"><Camera className="h-4 w-4" /> تصوير</button>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 shadow-xl backdrop-blur">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-black text-white">أقسام البيت</h3><Home className="h-4 w-4 text-cyan-300" /></div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(roomMeta) as Room[]).map((key) => <button key={key} onClick={() => setRoom(key)} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-right text-sm font-bold transition ${room === key ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/[.04] text-slate-300 hover:bg-white/10'}`}>{roomMeta[key].icon}<span>{roomMeta[key].label}</span></button>)}
              </div>
            </div>

            {room === 'bedroom' && <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 text-white shadow-xl"><h3 className="mb-3 font-black">راحة جودي</h3><NeedBar label="الطاقة" value={petNeeds.energy} color="bg-violet-400" /><button onClick={sleepJoudy} className="mt-3 w-full rounded-xl bg-violet-400/15 px-3 py-3 text-sm font-bold text-violet-100 hover:bg-violet-400/25"><Moon className="ml-2 inline h-4 w-4" /> وقت النوم والراحة</button></div>}
            {room === 'kitchen' && <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 text-white shadow-xl"><h3 className="mb-3 font-black">وجبة جودي</h3><NeedBar label="الجوع" value={100 - petNeeds.food} color="bg-amber-400" /><p className="mt-2 text-xs text-slate-400">الوجبة تكلف 10 عملات وتزيد الشبع والمزاج.</p><button onClick={feedJoudy} className="mt-3 w-full rounded-xl bg-amber-400/15 px-3 py-3 text-sm font-bold text-amber-100 hover:bg-amber-400/25"><Utensils className="ml-2 inline h-4 w-4" /> قدّم وجبة (10 عملات)</button></div>}
            {room === 'living' && <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 text-white shadow-xl"><h3 className="mb-3 font-black">مزاج جودي</h3><NeedBar label="المزاج" value={petNeeds.mood} color="bg-pink-400" /><button onClick={() => { setPetNeeds((current) => ({ ...current, mood: Math.min(100, current.mood + 12) })); react('يلا نلعب! أنا مبسوطة 😄'); }} className="mt-3 w-full rounded-xl bg-pink-400/15 px-3 py-3 text-sm font-bold text-pink-100 hover:bg-pink-400/25"><Sparkles className="ml-2 inline h-4 w-4" /> العب معها</button></div>}
            {room === 'pets' && <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 text-white shadow-xl"><h3 className="mb-2 font-black">أصدقاء جودي</h3><p className="mb-3 text-xs leading-6 text-slate-400">اختار رفيقًا يرافق جودي في البيت. الشراء يستخدم نفس العملات التي تجمعها في مراحل اللعبة.</p><div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><span className="text-4xl">{equippedPet.emoji}</span><div><b>{equippedPet.name}</b><p className="text-xs text-cyan-200">الرفيق الحالي</p></div></div><div className="grid grid-cols-1 gap-2">{PET_ITEMS.map((pet) => { const owned = save.petsOwned.includes(pet.id); return <div key={pet.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="flex items-center gap-2"><span className="text-2xl">{pet.emoji}</span><div><b className="text-sm">{pet.name}</b><p className="text-[10px] text-slate-400">{pet.rarity}</p></div></div><button onClick={() => buyPet(pet)} className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-100">{owned ? save.equippedPet === pet.id ? 'مُختار' : 'استخدم' : `${pet.price} 🪙`}</button></div>; })}</div></div>}
            {room === 'closet' && <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 text-white shadow-xl"><h3 className="mb-2 font-black">الخزانة والمتجر</h3><p className="text-xs leading-6 text-slate-400">ملابس وأحذية وديكورات، وبعض القطع تمنح مزايا بسيطة داخل المراحل.</p><button onClick={() => setShopOpen(true)} className="mt-3 w-full rounded-xl bg-gradient-to-l from-rose-400 to-fuchsia-500 px-3 py-3 font-black text-white"><ShoppingBag className="ml-2 inline h-4 w-4" /> افتح المتجر</button><button onClick={() => { setShopCategory('decor'); setShopOpen(true); }} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-slate-200">تغيير ديكور الغرف</button></div>}
            {room === 'album' && <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2b]/85 p-4 text-white shadow-xl"><h3 className="mb-3 font-black">ألبوم المغامرات</h3><div className="grid grid-cols-2 gap-2"><AlbumTile title="البداية" unlocked icon="🌱" /><AlbumTile title="أول إنجاز" unlocked={save.highestAchievement >= 1} icon="🏅" /><AlbumTile title="جامع القطط" unlocked={save.highestAchievement >= 2} icon="🐈" /><AlbumTile title="بطلة المراحل" unlocked={save.highestAchievement >= 3} icon="👑" /></div></div>}

            <button onClick={onPlayArcade} className="group flex items-center justify-between rounded-[1.6rem] border border-cyan-200/20 bg-gradient-to-l from-cyan-500 to-blue-600 p-4 text-right text-[#061522] shadow-[0_16px_44px_rgba(34,211,238,.16)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(34,211,238,.24)]">
              <span><span className="block text-xs font-bold text-white/75">داخل عالم جودي</span><span className="mt-1 block text-xl font-black text-white">اللعبة الأصلية</span><span className="mt-1 block text-xs font-semibold text-white/80">30 مستوى ومغامرات التجميع</span></span><span className="rounded-2xl bg-white/20 p-3 text-white"><Gamepad2 className="h-7 w-7" /></span>
            </button>
            <button onClick={claimDaily} disabled={save.lastDaily === today || dailyClaimed} className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100 disabled:opacity-50"><Gift className="h-4 w-4" />{save.lastDaily === today || dailyClaimed ? 'مكافأة اليوم تم استلامها' : 'استلام مكافأة يومية · 30 عملة'}</button>
          </aside>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500"><span>Joudy’s World · كل التقدم والعملات محفوظة على هذا الجهاز</span><span className="flex items-center gap-1"><Music2 className="h-3.5 w-3.5" /> تفاعل صوتي عند دعم المتصفح</span></footer>
      </div>

      <AnimatePresence>
        {settingsOpen && <Modal title="إعدادات عالم جودي" onClose={() => setSettingsOpen(false)}><p className="text-sm text-slate-400">اختار طريقة التحكم المفضلة قبل دخول لعبة المراحل.</p><div className="grid gap-2 sm:grid-cols-2"><button onClick={() => onControlModeChange('classic')} className={`rounded-xl border p-4 text-right ${controlMode === 'classic' ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200'}`}><b className="block">الأزرار الكلاسيكية</b><span className="mt-1 block text-xs opacity-70">يمين ويسار مثل التحكم الحالي</span></button><button onClick={() => onControlModeChange('joystick')} className={`rounded-xl border p-4 text-right ${controlMode === 'joystick' ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200'}`}><b className="block">العصا الافتراضية</b><span className="mt-1 block text-xs opacity-70">حرّك العصا يمينًا ويسارًا</span></button></div><button onClick={onToggleSound} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold text-white">{soundEnabled ? 'كتم الأصوات' : 'تشغيل الأصوات'}</button><p className="text-xs leading-5 text-amber-100/70">الصوت الأنثوي يعتمد على الأصوات المتاحة في جهازك. ميزة سماع كلامك وإعادته تحتاج متصفحًا يدعم التعرف على الكلام وإذن الميكروفون.</p></Modal>}
        {shopOpen && <Modal title="متجر جودي" onClose={() => setShopOpen(false)}><div className="mb-3 flex flex-wrap gap-2"><button onClick={() => setShopCategory('outfit')} className={`shop-tab ${shopCategory === 'outfit' ? 'active' : ''}`}>الملابس</button><button onClick={() => setShopCategory('shoes')} className={`shop-tab ${shopCategory === 'shoes' ? 'active' : ''}`}>الأحذية</button><button onClick={() => setShopCategory('decor')} className={`shop-tab ${shopCategory === 'decor' ? 'active' : ''}`}>ديكور البيت</button></div>
          {shopCategory !== 'decor' ? <div className="grid max-h-[55vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">{SHOP_ITEMS.filter((item) => item.category === shopCategory).map((item) => { const owned = save.owned.includes(item.id); return <div key={item.id} className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm text-white">{item.name}</b><span className="text-[10px] text-amber-200">{item.rarity}</span></div><p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p><div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1 text-sm font-black text-amber-200"><Coins className="h-3.5 w-3.5" />{item.price}</span><button onClick={() => buyItem(item)} className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-100">{owned ? (item.category === 'outfit' ? save.equippedOutfit === item.id : save.equippedShoes === item.id) ? 'مُجهّز' : 'استخدم' : 'شراء'}</button></div></div>; })}</div> : <div><div className="mb-3 flex flex-wrap gap-2">{(['bedroom', 'kitchen', 'living'] as const).map((key) => <button key={key} onClick={() => setDecorRoom(key)} className={`shop-tab ${decorRoom === key ? 'active' : ''}`}>{roomMeta[key].label}</button>)}</div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{DECOR_ITEMS.filter((item) => item.room === decorRoom).map((item) => { const owned = save.decorOwned.includes(item.id); return <div key={item.id} className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="flex items-center gap-2"><span className="text-2xl">{item.icon}</span><b className="text-sm text-white">{item.name}</b></div><div className="mt-3 flex items-center justify-between"><span className="text-sm font-black text-amber-200">{item.price} 🪙</span><button onClick={() => buyDecor(item)} className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-100">{owned ? save.decorEquipped[item.room] === item.id ? 'مُجهّز' : 'استخدم' : 'شراء'}</button></div></div>; })}</div></div>}</Modal>}
        {photoOpen && <Modal title="استوديو تصوير جودي" onClose={() => setPhotoOpen(false)}><div className="relative flex h-72 items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-700 to-rose-900"><div className="absolute inset-0 text-center text-5xl opacity-40">✦　✧　✦　✧</div><Image src={spriteSrc} alt="جودي" width={240} height={270} className={`relative z-10 h-full w-auto object-contain ${photoPose === 'star' ? 'rotate-3' : photoPose === 'calm' ? 'scale-95' : 'animate-float-slow'}`} style={{ filter: equippedItem.filter }} /></div><div className="flex flex-wrap gap-2">{(['happy','calm','star'] as const).map((pose) => <button key={pose} onClick={() => setPhotoPose(pose)} className={`shop-tab ${photoPose === pose ? 'active' : ''}`}>{pose === 'happy' ? 'مرحة' : pose === 'calm' ? 'هادئة' : 'نجمة'}</button>)}</div><button onClick={takePhoto} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-black text-[#071321]">حفظ الصورة PNG</button></Modal>}
      </AnimatePresence>
    </motion.main>
  );
}

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="mb-1 flex justify-between text-xs text-slate-300"><span>{label}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} /></div></div>;
}
function AlbumTile({ title, unlocked, icon }: { title: string; unlocked: boolean; icon: string }) {
  return <div className={`rounded-xl border p-3 ${unlocked ? 'border-white/10 bg-white/5' : 'border-white/5 bg-black/10 opacity-45'}`}><div className="text-2xl">{unlocked ? icon : '🔒'}</div><p className="mt-2 text-xs font-bold text-slate-200">{title}</p></div>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div initial={{ y: 16, scale: .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: .98 }} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#111d2c] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-white">{title}</h3><button onClick={onClose} className="rounded-lg bg-white/5 p-2 text-slate-300" aria-label="إغلاق"><X className="h-4 w-4" /></button></div>{children}</motion.div></motion.div>;
}
