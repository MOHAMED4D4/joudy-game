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
}

const KEY = 'joudy_world_save_v1';
const EVENT = 'joudy-world-save-change';
const DEFAULT_SAVE: WorldSave = {
  coins: 180,
  blueKeys: 0,
  owned: ['classic', 'sneakers'],
  equippedOutfit: 'classic',
  equippedShoes: 'sneakers',
  decorOwned: ['bedroom-default', 'kitchen-default', 'living-default'],
  decorEquipped: { bedroom: 'bedroom-default', kitchen: 'kitchen-default', living: 'living-default' },
  lastDaily: '',
  highestAchievement: 0,
  reviveCountsByLevel: {},
  petsOwned: ['moon-cat'],
  equippedPet: 'moon-cat',
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
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'classic', name: 'الزي الأصلي', category: 'outfit', price: 0, rarity: 'عادي', description: 'مظهر جودي الأساسي', filter: 'none' },
  { id: 'rose', name: 'فستان الورود', category: 'outfit', price: 90, rarity: 'مميز', description: 'هالة وردية ومكافأة عملات إضافية 5%', filter: 'hue-rotate(-15deg) saturate(1.12)', bonus: 'coins' },
  { id: 'moon', name: 'زي ضوء القمر', category: 'outfit', price: 160, rarity: 'نادر', description: 'إطلالة ليلية ولمسة حماية إضافية بسيطة', filter: 'hue-rotate(35deg) saturate(.9)', bonus: 'shield' },
  { id: 'royal', name: 'الزي الملكي', category: 'outfit', price: 300, rarity: 'أسطوري', description: 'إطلالة ملكية مع زيادة بسيطة في الحركة', filter: 'saturate(1.22) contrast(1.04)', bonus: 'speed' },
  { id: 'mint', name: 'زي النعناع', category: 'outfit', price: 120, rarity: 'مميز', description: 'ألوان هادئة ومظهر منعش', filter: 'hue-rotate(45deg) saturate(.9)' },
  { id: 'sneakers', name: 'حذاء النجوم', category: 'shoes', price: 70, rarity: 'عادي', description: 'حذاء خفيف للرحلات', filter: 'none' },
  { id: 'rose-shoes', name: 'حذاء الورد', category: 'shoes', price: 140, rarity: 'نادر', description: 'حذاء أنيق مع زيادة بسيطة في العملات', filter: 'none', bonus: 'coins' },
  { id: 'swift-shoes', name: 'حذاء البرق', category: 'shoes', price: 220, rarity: 'أسطوري', description: 'يعزز سرعة الحركة قليلًا دون كسر توازن المراحل', filter: 'none', bonus: 'speed' },
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
      owned: Array.isArray(value.owned) ? value.owned : DEFAULT_SAVE.owned,
      equippedOutfit: typeof value.equippedOutfit === 'string' ? value.equippedOutfit : (typeof (value as Partial<WorldSave> & { equipped?: string }).equipped === 'string' && SHOP_ITEMS.some((item) => item.id === (value as Partial<WorldSave> & { equipped?: string }).equipped && item.category === 'outfit') ? (value as Partial<WorldSave> & { equipped?: string }).equipped! : 'classic'),
      equippedShoes: typeof value.equippedShoes === 'string' ? value.equippedShoes : (typeof (value as Partial<WorldSave> & { equipped?: string }).equipped === 'string' && SHOP_ITEMS.some((item) => item.id === (value as Partial<WorldSave> & { equipped?: string }).equipped && item.category === 'shoes') ? (value as Partial<WorldSave> & { equipped?: string }).equipped! : 'sneakers'),
      decorOwned: Array.isArray(value.decorOwned) ? value.decorOwned : DEFAULT_SAVE.decorOwned,
      decorEquipped: value.decorEquipped && typeof value.decorEquipped === 'object' ? value.decorEquipped : DEFAULT_SAVE.decorEquipped,
      lastDaily: typeof value.lastDaily === 'string' ? value.lastDaily : '',
      highestAchievement: Math.max(0, Number(value.highestAchievement ?? 0) || 0),
      reviveCountsByLevel: value.reviveCountsByLevel && typeof value.reviveCountsByLevel === 'object' ? value.reviveCountsByLevel : {},
      petsOwned: Array.isArray(value.petsOwned) ? value.petsOwned : DEFAULT_SAVE.petsOwned,
      equippedPet: typeof value.equippedPet === 'string' ? value.equippedPet : DEFAULT_SAVE.equippedPet,
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
