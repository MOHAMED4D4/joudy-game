'use client';

import { useSyncExternalStore } from 'react';

export type ControlMode = 'classic' | 'joystick';
export interface WorldSave {
  coins: number;
  blueKeys: number;
  owned: string[];
  equippedOutfit: string;
  equippedShoes: string;
  decorOwned: string[];
  decorEquipped: Record<string, string>;
  lastDaily: string;
  highestAchievement: number;
  reviveCountsByLevel: Record<number, number>;
  petsOwned: string[];
  equippedPet: string;
  coastalRegionUnlocked: boolean;
  thirdChapterUnlocked: boolean;
  fourthChapterUnlocked: boolean;
  finalBossRewardClaimed: boolean;
  totalChocolates: number;
  totalScore: number;
  perfectRuns: number;
  totalBosses: number;
  extraHearts: number;
  shieldCharges: number;
  magnetCharges: number;
  shieldFreeGranted: boolean;
}

const KEY = 'joudy_world_save_v1';
const EVENT = 'joudy-world-save-change';
const DEFAULT_SAVE: WorldSave = {
  coins: 180,
  blueKeys: 0,
  owned: ['look-forest', 'sneakers'],
  equippedOutfit: 'look-forest',
  equippedShoes: 'sneakers',
  decorOwned: ['bedroom-default', 'kitchen-default', 'living-default'],
  decorEquipped: { bedroom: 'bedroom-default', kitchen: 'kitchen-default', living: 'living-default' },
  lastDaily: '',
  highestAchievement: 0,
  reviveCountsByLevel: {},
  petsOwned: ['moon-cat'],
  equippedPet: 'moon-cat',
  coastalRegionUnlocked: false,
  thirdChapterUnlocked: false,
  fourthChapterUnlocked: false,
  finalBossRewardClaimed: false,
  totalChocolates: 0,
  totalScore: 0,
  perfectRuns: 0,
  totalBosses: 0,
  extraHearts: 0,
  shieldCharges: 0,
  magnetCharges: 0,
  shieldFreeGranted: false,
};

export interface ShopItem {
  id: string;
  name: string;
  category: 'outfit' | 'shoes';
  price: number;
  rarity: 'عادي' | 'مميز' | 'نادر' | 'أسطوري';
  description: string;
  filter: string;
  bonus?: 'coins' | 'speed' | 'shield';
  shoeSrc?: string;
  overlaySrc?: string;
  artId?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Four separate illustrated outfits. These replace the earlier colour-filter-only skins.
  { id: 'look-forest', name: 'معطف الغابة', category: 'outfit', price: 0, rarity: 'عادي', description: 'معطف طويل داكن بتطريز نباتي وحزام أنيق', filter: 'none', overlaySrc: '/images/wardrobe/outfits/look-forest.svg', artId: 'coat' },
  { id: 'look-explorer', name: 'إطلالة المستكشفة', category: 'outfit', price: 180, rarity: 'مميز', description: 'سترة عملية وبنطال واسع بجيوب جانبية', filter: 'none', overlaySrc: '/images/wardrobe/outfits/look-explorer.svg', artId: 'utility', bonus: 'speed' },
  { id: 'look-mauve', name: 'الفستان البنفسجي المطرز', category: 'outfit', price: 240, rarity: 'نادر', description: 'فستان متعدد الطبقات بتطريز ناعم', filter: 'none', overlaySrc: '/images/wardrobe/outfits/look-mauve.svg', artId: 'layered', bonus: 'coins' },
  { id: 'look-burgundy', name: 'معطف المساء', category: 'outfit', price: 320, rarity: 'أسطوري', description: 'معطف خمري طويل مع بنطال داكن', filter: 'none', overlaySrc: '/images/wardrobe/outfits/look-burgundy.svg', artId: 'longcoat', bonus: 'shield' },
  // Shoes are independent overlays, so changing them keeps the selected outfit.
  { id: 'sneakers', name: 'حذاء رياضي كلاسيكي', category: 'shoes', price: 0, rarity: 'عادي', description: 'حذاء رياضي منخفض بنعل مريح', filter: 'none', shoeSrc: '/images/shoes/sneakers.svg', overlaySrc: '/images/wardrobe/shoes/sneakers.svg', artId: 'sneakers' },
  { id: 'rose-boots', name: 'جزمة جلد وردية', category: 'shoes', price: 110, rarity: 'مميز', description: 'جزمة قصيرة بكعب منخفض وتفاصيل ناعمة', filter: 'none', shoeSrc: '/images/shoes/rose-boots.svg', overlaySrc: '/images/wardrobe/shoes/rose-boots.svg', artId: 'rose-boots', bonus: 'coins' },
  { id: 'high-top', name: 'حذاء برق مرتفع', category: 'shoes', price: 170, rarity: 'نادر', description: 'حذاء مرتفع برباط جانبي ونعل قوي', filter: 'none', shoeSrc: '/images/shoes/high-top.svg', overlaySrc: '/images/wardrobe/shoes/high-top.svg', artId: 'high-top', bonus: 'speed' },
  { id: 'trail-boots', name: 'جزمة الرحلات', category: 'shoes', price: 230, rarity: 'أسطوري', description: 'جزمة متينة برقبة أعلى ورباط أمامي', filter: 'none', shoeSrc: '/images/shoes/trail-boots.svg', overlaySrc: '/images/wardrobe/shoes/trail-boots.svg', artId: 'trail-boots', bonus: 'shield' },
  { id: 'cloud', name: 'حذاء السحاب', category: 'shoes', price: 145, rarity: 'مميز', description: 'حذاء خفيف بتصميم أبيض وأزرق', filter: 'none', shoeSrc: '/images/shoes/cloud.svg', overlaySrc: '/images/wardrobe/shoes/cloud.svg', artId: 'cloud' },
];

export const PET_ITEMS = [
  { id: 'moon-cat', name: 'قط القمر', price: 0, rarity: 'عادي', emoji: '🐈' },
  { id: 'rose-cat', name: 'قط الورد', price: 130, rarity: 'مميز', emoji: '🐈‍⬛' },
  { id: 'gold-cat', name: 'قط النجوم', price: 260, rarity: 'نادر', emoji: '🐱' },
  { id: 'cloud-cat', name: 'قط السحاب', price: 420, rarity: 'أسطوري', emoji: '😺' },
] as const;

export const DECOR_ITEMS = [
  { id: 'bedroom-default', room: 'bedroom', name: 'غرفة دافئة', price: 0, icon: '🛏️', theme: 'warm' },
  { id: 'bedroom-stars', room: 'bedroom', name: 'غرفة النجوم', price: 100, icon: '🌙', theme: 'night' },
  { id: 'kitchen-default', room: 'kitchen', name: 'مطبخ النعناع', price: 0, icon: '🍵', theme: 'mint' },
  { id: 'kitchen-rose', room: 'kitchen', name: 'مطبخ الورد', price: 110, icon: '🌷', theme: 'rose' },
  { id: 'living-default', room: 'living', name: 'صالة هادئة', price: 0, icon: '🛋️', theme: 'warm' },
  { id: 'living-gold', room: 'living', name: 'الصالة الذهبية', price: 180, icon: '✨', theme: 'gold' },
] as const;

let cachedRaw: string | null = null;
let cachedSave: WorldSave = DEFAULT_SAVE;
function parse(raw: string | null): WorldSave {
  if (!raw) return DEFAULT_SAVE;
  try {
    const value = JSON.parse(raw) as Partial<WorldSave>;
    return {
      coins: Math.max(0, Number(value.coins ?? DEFAULT_SAVE.coins) || 0),
      blueKeys: Math.max(0, Number(value.blueKeys ?? 0) || 0),
      owned: Array.isArray(value.owned) ? value.owned.map((id) => {
        const migration: Record<string, string> = { classic: 'look-forest', royal: 'look-forest', mint: 'look-forest', pearl: 'look-forest', emerald: 'look-forest', rose: 'look-mauve', lavender: 'look-mauve', moon: 'look-burgundy', midnight: 'look-burgundy', ocean: 'look-explorer', sunset: 'look-mauve', 'rose-shoes': 'rose-boots', 'swift-shoes': 'high-top', 'lavender-shoes': 'cloud', 'gold-shoes': 'trail-boots', 'cloud-shoes': 'cloud' };
        const migrated = migration[id] ?? id;
        return SHOP_ITEMS.some((item) => item.id === migrated) ? migrated : id;
      }).filter((id) => SHOP_ITEMS.some((item) => item.id === id)) : DEFAULT_SAVE.owned,
      equippedOutfit: (() => {
        const old = typeof value.equippedOutfit === 'string' ? value.equippedOutfit : (value as Partial<WorldSave> & { equipped?: string }).equipped;
        const migration: Record<string, string> = { classic: 'look-forest', royal: 'look-forest', mint: 'look-forest', pearl: 'look-forest', emerald: 'look-forest', rose: 'look-mauve', lavender: 'look-mauve', moon: 'look-burgundy', midnight: 'look-burgundy', ocean: 'look-explorer', sunset: 'look-mauve' };
        const candidate = typeof old === 'string' ? (migration[old] ?? old) : 'look-forest';
        return SHOP_ITEMS.some((item) => item.id === candidate && item.category === 'outfit') ? candidate : 'look-forest';
      })(),
      equippedShoes: (() => {
        const old = typeof value.equippedShoes === 'string' ? value.equippedShoes : (value as Partial<WorldSave> & { equipped?: string }).equipped;
        const migration: Record<string, string> = { 'rose-shoes': 'rose-boots', 'swift-shoes': 'high-top', 'lavender-shoes': 'cloud', 'gold-shoes': 'trail-boots', 'cloud-shoes': 'cloud' };
        const candidate = typeof old === 'string' ? (migration[old] ?? old) : 'sneakers';
        return SHOP_ITEMS.some((item) => item.id === candidate && item.category === 'shoes') ? candidate : 'sneakers';
      })(),
      decorOwned: Array.isArray(value.decorOwned) ? value.decorOwned : DEFAULT_SAVE.decorOwned,
      decorEquipped: value.decorEquipped && typeof value.decorEquipped === 'object' ? value.decorEquipped : DEFAULT_SAVE.decorEquipped,
      lastDaily: typeof value.lastDaily === 'string' ? value.lastDaily : '',
      highestAchievement: Math.max(0, Number(value.highestAchievement ?? 0) || 0),
      reviveCountsByLevel: value.reviveCountsByLevel && typeof value.reviveCountsByLevel === 'object' ? value.reviveCountsByLevel : {},
      petsOwned: Array.isArray(value.petsOwned) ? value.petsOwned : DEFAULT_SAVE.petsOwned,
      equippedPet: typeof value.equippedPet === 'string' ? value.equippedPet : DEFAULT_SAVE.equippedPet,
      coastalRegionUnlocked: value.coastalRegionUnlocked === true,
      thirdChapterUnlocked: value.thirdChapterUnlocked === true,
      fourthChapterUnlocked: value.fourthChapterUnlocked === true,
      finalBossRewardClaimed: value.finalBossRewardClaimed === true,
      totalChocolates: Math.max(0, Number(value.totalChocolates ?? 0) || 0),
      totalScore: Math.max(0, Number(value.totalScore ?? 0) || 0),
      perfectRuns: Math.max(0, Number(value.perfectRuns ?? 0) || 0),
      totalBosses: Math.max(0, Number(value.totalBosses ?? 0) || 0),
      extraHearts: Math.max(0, Number(value.extraHearts ?? 0) || 0),
      shieldCharges: Math.max(0, Number(value.shieldCharges ?? 0) || 0),
      magnetCharges: Math.max(0, Number(value.magnetCharges ?? 0) || 0),
      shieldFreeGranted: value.shieldFreeGranted === true,
    };
  } catch {
    return DEFAULT_SAVE;
  }
}
export function loadWorldSave(): WorldSave {
  if (typeof window === 'undefined') return DEFAULT_SAVE;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) { cachedRaw = raw; cachedSave = parse(raw); }
    return cachedSave;
  } catch { return DEFAULT_SAVE; }
}
export function saveWorld(patch: Partial<WorldSave> | ((current: WorldSave) => WorldSave)): WorldSave {
  const current = loadWorldSave();
  const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(KEY, raw);
    cachedRaw = raw;
    cachedSave = next;
    window.dispatchEvent(new Event(EVENT));
  } catch { /* storage is optional; keep the current session working */ }
  return next;
}
function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, callback);
  const storage = (event: StorageEvent) => { if (event.key === KEY) callback(); };
  window.addEventListener('storage', storage);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', storage); };
}
export function useWorldSave() {
  return useSyncExternalStore(subscribe, loadWorldSave, () => DEFAULT_SAVE);
}
export function addWorldCoins(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0 || typeof window === 'undefined') return loadWorldSave();
  return saveWorld((current) => ({ ...current, coins: current.coins + Math.floor(amount) }));
}
export function useControlMode() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener('joudy-control-mode-change', callback);
      return () => window.removeEventListener('joudy-control-mode-change', callback);
    },
    () => (typeof window !== 'undefined' && localStorage.getItem('joudy-control-mode') === 'joystick' ? 'joystick' : 'classic'),
    () => 'classic',
  ) as ControlMode;
}
export function setControlMode(mode: ControlMode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('joudy-control-mode', mode);
  window.dispatchEvent(new Event('joudy-control-mode-change'));
}
