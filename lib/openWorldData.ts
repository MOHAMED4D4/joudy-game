'use client';

export const WORLD_WIDTH = 4800;
export const WORLD_HEIGHT = 3600;

export type QuestStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export const TOTAL_QUEST_COUNT = 11;

export interface QuestObjectiveInfo {
  stage: QuestStage;
  stepLabel: string;
  title: string;
  description: string;
  targetX: number;
  targetY: number;
  targetLabel: string;
}

export interface QuestLogEntry {
  stage: number;
  title: string;
  rewardCoins: number;
  locationHint: string;
}

export const QUEST_LOG_LIST: QuestLogEntry[] = [
  {
    stage: 0,
    title: 'تحدّثي مع الحارس الملكي عند بوابة القصر',
    rewardCoins: 40,
    locationHint: 'أمام القصر الملكي الكبير (الشمال)',
  },
  {
    stage: 1,
    title: 'أحضري باقة الورود الملكية بالسيارة من بائعة الورد ياسمين',
    rewardCoins: 50,
    locationHint: 'حديقة الورود (الجنوب الشرقي)',
  },
  {
    stage: 2,
    title: 'احتفلي بحفل التتويج مع صديقة القصر ليلى',
    rewardCoins: 60,
    locationHint: 'ساحة القصر الملكي',
  },
  {
    stage: 3,
    title: 'ادخلي القصر الملكي الواسع واجلسي على عرش الأميرة جودي 👑🪑',
    rewardCoins: 45,
    locationHint: 'القاعة الملكية (الدور الأرضي بالقصر)',
  },
  {
    stage: 4,
    title: 'اصعدي للدور الثاني، اجلسي أمام المرآة وضعي مكياجاً وغيّري ملابسكِ 💄👗',
    rewardCoins: 75,
    locationHint: 'الدور الثاني بالقصر أو صالون المكياج والأزياء',
  },
  {
    stage: 5,
    title: 'زُوري مقهى الأميرات السحري أو مخبز الحلويات واحتسي قهوة ملكية ☕🧁',
    rewardCoins: 50,
    locationHint: 'مقهى الأميرات السحري (الحي الغربي)',
  },
  {
    stage: 6,
    title: 'اعتني بإحدى قطط الشارع ثم توجّهي إلى متجر القطط 🐱',
    rewardCoins: 60,
    locationHint: 'متجر القطط (شرق المدينة)',
  },
  {
    stage: 7,
    title: 'اجمعي العملات الذهبية واشترِي قطتكِ الخاصة من متجر القطط 🐾🪙',
    rewardCoins: 50,
    locationHint: 'متجر القطط 🐾',
  },
  {
    stage: 8,
    title: 'عُودي لمملكتكِ (الدور الثاني) وأطعمي قطتكِ واسقيها الماء حتى تكبر 🐟💧',
    rewardCoins: 100,
    locationHint: 'ركن القطط بالدور الثاني في القصر الملكي',
  },
  {
    stage: 9,
    title: 'توجّهي إلى مرصد النجوم الملكي وشاهدي الكوكب السحري بالتلسكوب 🔭✨',
    rewardCoins: 70,
    locationHint: 'مرصد النجوم الملكي (الجنوب)',
  },
  {
    stage: 10,
    title: 'ارجعي لصديقة القصر ليلى لاستلام وسام الأسطورة وتختيم اللعبة! 🏆👑',
    rewardCoins: 200,
    locationHint: 'ساحة القصر الملكي الكبير 👑',
  },
];

export type OutfitId =
  | 'royal_pink'
  | 'lavender_ballgown'
  | 'emerald_queen'
  | 'leather_jacket'
  | 'sporty_chic'
  | 'golden_star'
  | 'royal_white'
  | 'midnight_black'
  | 'navy_elegance'
  | 'burgundy_glam'
  | 'sky_satin'
  | 'floral_spring'
  | 'cream_chic'
  | 'denim_day'
  | 'red_carpet'
  | 'silver_glow'
  | 'violet_night'
  | 'rose_suit';

export interface OutfitOption {
  id: OutfitId;
  name: string;
  category: 'dress' | 'jacket' | 'casual';
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  badge: string;
  description: string;
}

export const OUTFIT_CATALOG: OutfitOption[] = [
  {
    id: 'royal_pink',
    name: 'فستان الأميرة الوردي',
    category: 'dress',
    primaryHex: '#F43F5E',
    secondaryHex: '#FFE4E6',
    accentHex: '#FBBF24',
    badge: '👑',
    description: 'فستان ملكي وردي بتفاصيل ذهبية وكشكشة ناعمة',
  },
  {
    id: 'lavender_ballgown',
    name: 'فستان الحلم البنفسجي',
    category: 'dress',
    primaryHex: '#9333EA',
    secondaryHex: '#F3E8FF',
    accentHex: '#FDE047',
    badge: '💜',
    description: 'فستان سهرة بنفسجي حالم مرصّع بالنجوم',
  },
  {
    id: 'emerald_queen',
    name: 'فستان الزمرد الملكي',
    category: 'dress',
    primaryHex: '#059669',
    secondaryHex: '#D1FAE5',
    accentHex: '#FBBF24',
    badge: '💚',
    description: 'فستان زمردي أنيق يناسب حجابكِ الملكي',
  },
  {
    id: 'leather_jacket',
    name: 'جاكيت جلد أنيق وبنطال',
    category: 'jacket',
    primaryHex: '#1E293B',
    secondaryHex: '#3B82F6',
    accentHex: '#E2E8F0',
    badge: '🧥',
    description: 'جاكيت جلد أسود لامع بسحّاب فضي مع بنطال جينز عصري',
  },
  {
    id: 'sporty_chic',
    name: 'طقم كاجوال سبور وردي',
    category: 'casual',
    primaryHex: '#EC4899',
    secondaryHex: '#FFF1F2',
    accentHex: '#38BDF8',
    badge: '👟',
    description: 'جاكيت رياضي مريح مع بنطال أبيض وحذاء عصري',
  },
  {
    id: 'golden_star',
    name: 'فستان السماء والذهب',
    category: 'dress',
    primaryHex: '#0284C7',
    secondaryHex: '#E0F2FE',
    accentHex: '#FACC15',
    badge: '🌟',
    description: 'فستان أزرق سماوي بتفاصيل ذهبية',
  },
  {
    id: 'royal_white',
    name: 'الفستان الأبيض الملكي',
    category: 'dress',
    primaryHex: '#F8FAFC',
    secondaryHex: '#E2E8F0',
    accentHex: '#C9A227',
    badge: '🤍',
    description: 'تصميم أبيض طويل مع تطريز فضي هادئ',
  },
  {
    id: 'midnight_black',
    name: 'فستان سهرة أسود',
    category: 'dress',
    primaryHex: '#111827',
    secondaryHex: '#374151',
    accentHex: '#E5E7EB',
    badge: '🖤',
    description: 'إطلالة مسائية سوداء بخطوط أنيقة',
  },
  {
    id: 'navy_elegance',
    name: 'فستان أزرق داكن',
    category: 'dress',
    primaryHex: '#1E3A8A',
    secondaryHex: '#93C5FD',
    accentHex: '#EAB308',
    badge: '💙',
    description: 'فستان رسمي أزرق داكن بلمسات ذهبية',
  },
  {
    id: 'burgundy_glam',
    name: 'فستان خمري فاخر',
    category: 'dress',
    primaryHex: '#7F1D1D',
    secondaryHex: '#B91C1C',
    accentHex: '#FDE68A',
    badge: '🍷',
    description: 'فستان خمري بلمعان خفيف يناسب المناسبات',
  },
  {
    id: 'sky_satin',
    name: 'فستان ساتان سماوي',
    category: 'dress',
    primaryHex: '#38BDF8',
    secondaryHex: '#E0F2FE',
    accentHex: '#FFFFFF',
    badge: '🩵',
    description: 'فستان ساتان بلون سماوي هادئ',
  },
  {
    id: 'floral_spring',
    name: 'فستان الربيع المزهر',
    category: 'dress',
    primaryHex: '#F9A8D4',
    secondaryHex: '#FDF2F8',
    accentHex: '#65A30D',
    badge: '🌷',
    description: 'فستان وردي بنقوش زهرية وتفاصيل خضراء',
  },
  {
    id: 'cream_chic',
    name: 'طقم كريمي رسمي',
    category: 'jacket',
    primaryHex: '#D6D3D1',
    secondaryHex: '#F5F5F4',
    accentHex: '#A16207',
    badge: '🤎',
    description: 'سترة كريمية بقصة رسمية مع بنطال متناسق',
  },
  {
    id: 'denim_day',
    name: 'إطلالة الجينز اليومية',
    category: 'casual',
    primaryHex: '#2563EB',
    secondaryHex: '#DBEAFE',
    accentHex: '#F8FAFC',
    badge: '👖',
    description: 'قميص بسيط مع بنطال جينز وحذاء أبيض',
  },
  {
    id: 'red_carpet',
    name: 'فستان السجادة الحمراء',
    category: 'dress',
    primaryHex: '#BE123C',
    secondaryHex: '#881337',
    accentHex: '#FDE68A',
    badge: '🌹',
    description: 'فستان أحمر للمناسبات الرسمية والتصوير',
  },
  {
    id: 'silver_glow',
    name: 'فستان فضي لامع',
    category: 'dress',
    primaryHex: '#9CA3AF',
    secondaryHex: '#F3F4F6',
    accentHex: '#E0E7FF',
    badge: '✨',
    description: 'فستان فضي بتفاصيل لامعة وانسيابية',
  },
  {
    id: 'violet_night',
    name: 'فستان بنفسجي ليلي',
    category: 'dress',
    primaryHex: '#6D28D9',
    secondaryHex: '#C4B5FD',
    accentHex: '#FDE68A',
    badge: '💜',
    description: 'فستان بنفسجي داكن بتفاصيل بنفسجية فاتحة',
  },
  {
    id: 'rose_suit',
    name: 'طقم وردي أنيق',
    category: 'jacket',
    primaryHex: '#DB2777',
    secondaryHex: '#FCE7F3',
    accentHex: '#F8FAFC',
    badge: '🩷',
    description: 'سترة وردية أنيقة مع تنورة أو بنطال فاتح',
  },
];

export interface MakeupState {
  lipColor: string | null;
  blushColor: string | null;
  eyeshadowColor: string | null;
  eyeliner: boolean;
  highlighter: boolean;
  cheekGlitter: boolean;
}

export const DEFAULT_MAKEUP_STATE: MakeupState = {
  lipColor: null,
  blushColor: null,
  eyeshadowColor: null,
  eyeliner: false,
  highlighter: false,
  cheekGlitter: false,
};

export interface ShadeOption {
  id: string;
  label: string;
  color: string;
}

export const LIPSTICK_SHADES: ShadeOption[] = [
  { id: 'rose_kiss', label: 'وردي رقيق', color: '#EC4899' },
  { id: 'ruby_queen', label: 'أحمر ياقوتي', color: '#BE123C' },
  { id: 'peach_glow', label: 'خوخي دافئ', color: '#FB7185' },
  { id: 'berry_velvet', label: 'توتي مخملي', color: '#9D174D' },
  { id: 'coral_crush', label: 'مرجاني مشرق', color: '#F97316' },
];

export const BLUSH_SHADES: ShadeOption[] = [
  { id: 'petal_pink', label: 'وردي ناعم', color: '#F472B6' },
  { id: 'apricot_sun', label: 'مشمشي دافئ', color: '#FB923C' },
  { id: 'rose_bloom', label: 'وردي ملكي', color: '#E11D48' },
];

export const EYESHADOW_SHADES: ShadeOption[] = [
  { id: 'lavender_mist', label: 'بنفسجي ساحر', color: '#A855F7' },
  { id: 'gold_shimmer', label: 'ذهبي لامع', color: '#F59E0B' },
  { id: 'rose_quartz', label: 'وردي لؤلؤي', color: '#F43F5E' },
  { id: 'sky_sapphire', label: 'سماوي متألق', color: '#0EA5E9' },
];

export interface StreetCatDef {
  id: string;
  name: string;
  furColor: string;
  earInnerColor: string;
  accentColor: string;
  homeX: number;
  homeY: number;
  patrolRadius: number;
}

export const STREET_CATS: StreetCatDef[] = [
  {
    id: 'stray_1',
    name: 'قطة الشارع مشمشة',
    furColor: '#FB923C',
    earInnerColor: '#FDBA74',
    accentColor: '#FFFFFF',
    homeX: 1520,
    homeY: 960,
    patrolRadius: 95,
  },
  {
    id: 'stray_2',
    name: 'قطة الشارع سحابة',
    furColor: '#F8FAFC',
    earInnerColor: '#FDA4AF',
    accentColor: '#94A3B8',
    homeX: 2120,
    homeY: 980,
    patrolRadius: 90,
  },
  {
    id: 'stray_3',
    name: 'قطة الشارع فلفل',
    furColor: '#334155',
    earInnerColor: '#F472B6',
    accentColor: '#E2E8F0',
    homeX: 1180,
    homeY: 1620,
    patrolRadius: 110,
  },
  {
    id: 'stray_4',
    name: 'قطة الشارع نوجا',
    furColor: '#FDE68A',
    earInnerColor: '#FDA4AF',
    accentColor: '#D97706',
    homeX: 2980,
    homeY: 1580,
    patrolRadius: 100,
  },
  {
    id: 'stray_5',
    name: 'قطة الشارع توتة',
    furColor: '#CBD5E1',
    earInnerColor: '#F9A8D4',
    accentColor: '#475569',
    homeX: 1800,
    homeY: 2380,
    patrolRadius: 115,
  },
  {
    id: 'stray_6',
    name: 'قطة الشارع لوزة',
    furColor: '#F59E0B',
    earInnerColor: '#FDE68A',
    accentColor: '#78350F',
    homeX: 3560,
    homeY: 2220,
    patrolRadius: 95,
  },
];

export interface ShopKittenDef {
  id: string;
  name: string;
  breed: string;
  price: number;
  furColor: string;
  collarColor: string;
  description: string;
}

export const SHOP_KITTENS: ShopKittenDef[] = [
  {
    id: 'mishmish',
    name: 'مشمش الذهبية',
    breed: 'قطة شيرازية صغيرة',
    price: 80,
    furColor: '#FDBA74',
    collarColor: '#F43F5E',
    description: 'قطة نشيطة تحب اللعب والقفز والسمك المشوي.',
  },
  {
    id: 'lulu',
    name: 'لؤلؤة البيضاء',
    breed: 'قطة ملكية ناصعة البياض',
    price: 130,
    furColor: '#FFFFFF',
    collarColor: '#EC4899',
    description: 'قطة ناعمة بفراء ثلجي وطوق وردي مرصّع بالقلوب!',
  },
  {
    id: 'sukkar',
    name: 'سُكّر الرمادية',
    breed: 'قطة بريطانية قصيرة الشعر',
    price: 180,
    furColor: '#CBD5E1',
    collarColor: '#A855F7',
    description: 'هادئة ومحبوبة جداً، تعشق الجلوس أمام المرآة معكِ!',
  },
  {
    id: 'caramel',
    name: 'كراميل الملكية',
    breed: 'قطة سيامي فاخرة',
    price: 240,
    furColor: '#FDE68A',
    collarColor: '#FACC15',
    description: 'قطة القصور الفاخرة التي تزداد تألقاً مع الرعاية والنمو!',
  },
];

export interface OwnedPetState {
  kittenId: string;
  name: string;
  furColor: string;
  collarColor: string;
  hunger: number; // 0-100 (100 = full)
  thirst: number; // 0-100 (100 = hydrated)
  happiness: number; // 0-100
  growthXp: number; // 0..100+
  stage: 1 | 2 | 3; // 1 = Kitten, 2 = Young Cat, 3 = Grown Royal Cat
}

export interface WorldBuilding {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | 'palace'
    | 'villa'
    | 'pet_shop'
    | 'salon'
    | 'cafe'
    | 'boutique'
    | 'bakery'
    | 'observatory'
    | 'gazebo'
    | 'house_pink'
    | 'house_mint'
    | 'house_sky'
    | 'flower_stand';
  roofColor: string;
  wallColor: string;
  trimColor: string;
  enterable: boolean;
  hasBed: boolean;
  hasSecondFloor?: boolean;
  hasMakeup?: boolean;
  hasWardrobe?: boolean;
  hasPetCorner?: boolean;
  hasPetShop?: boolean;
  hasCafeCounter?: boolean;
  hasObservatory?: boolean;
  doorX: number;
  doorY: number;
}

export interface WorldTree {
  x: number;
  y: number;
  radius: number;
  kind: 'sakura' | 'emerald' | 'cypress';
}

export interface WorldFountain {
  x: number;
  y: number;
  radius: number;
}

export interface WorldRoadSegment {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldCoinDef {
  id: number;
  x: number;
  y: number;
}

export interface WorldNpcDef {
  id: 'guard' | 'florist' | 'bestie' | 'cat' | 'shopkeeper';
  name: string;
  role: string;
  emoji: string;
  homeX: number;
  homeY: number;
  patrolRadiusX: number;
  patrolRadiusY: number;
  patrolSpeed: number;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
}

export interface DialogueLine {
  speaker: string;
  speakerTone: 'joudy' | 'npc';
  text: string;
}

export const WORLD_LAKE = {
  cx: 820,
  cy: 3060,
  rx: 380,
  ry: 210,
};

export const WORLD_ROADS: WorldRoadSegment[] = [
  // 1. Grand Northern Royal Boulevard
  { x: 360, y: 690, w: 4080, h: 135 },
  // 2. Central Mid-Town Avenue
  { x: 360, y: 1410, w: 4080, h: 135 },
  // 3. Southern Residential & Café Avenue
  { x: 360, y: 2130, w: 4080, h: 130 },
  // 4. Grand Outer Rose & Lake Parkway
  { x: 360, y: 2780, w: 4080, h: 125 },
  // 5. Western Café & Lake Boulevard (North-South)
  { x: 360, y: 690, w: 135, h: 2215 },
  // 6. Central-West Palace Park Axis (North-South)
  { x: 1480, y: 690, w: 125, h: 2215 },
  // 7. Grand Royal Central Axis (North-South)
  { x: 2335, y: 690, w: 135, h: 2215 },
  // 8. Eastern Pet Shop & Rose Boulevard (North-South)
  { x: 3320, y: 690, w: 130, h: 2215 },
  // 9. Far-East Villa District Road (North-South)
  { x: 4305, y: 690, w: 135, h: 2215 },
];

export const WORLD_BUILDINGS: WorldBuilding[] = [
  {
    id: 'royal_palace',
    name: 'القصر الملكي الكبير 👑',
    x: 1940,
    y: 130,
    w: 920,
    h: 350,
    kind: 'palace',
    roofColor: '#F43F5E',
    wallColor: '#FFF7FA',
    trimColor: '#FBBF24',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    hasMakeup: true,
    hasWardrobe: true,
    hasPetCorner: true,
    doorX: 2400,
    doorY: 505,
  },
  {
    id: 'princess_villa',
    name: 'فيلا الأميرة جودي 🏡',
    x: 680,
    y: 220,
    w: 390,
    h: 240,
    kind: 'villa',
    roofColor: '#EC4899',
    wallColor: '#FFF1F2',
    trimColor: '#FBBF24',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    hasMakeup: true,
    hasWardrobe: true,
    hasPetCorner: true,
    doorX: 875,
    doorY: 485,
  },
  {
    id: 'pet_shop',
    name: 'متجر القطط 🐾',
    x: 2740,
    y: 970,
    w: 390,
    h: 240,
    kind: 'pet_shop',
    roofColor: '#F97316',
    wallColor: '#FFF7ED',
    trimColor: '#FACC15',
    enterable: true,
    hasBed: false,
    hasPetShop: true,
    doorX: 2935,
    doorY: 1235,
  },
  {
    id: 'fashion_salon',
    name: 'صالون المكياج والأزياء 💄👗',
    x: 1740,
    y: 970,
    w: 380,
    h: 240,
    kind: 'salon',
    roofColor: '#DB2777',
    wallColor: '#FDF2F8',
    trimColor: '#FBBF24',
    enterable: true,
    hasBed: false,
    hasMakeup: true,
    hasWardrobe: true,
    doorX: 1930,
    doorY: 1235,
  },
  {
    id: 'villa_east',
    name: 'بيت الشوكولاتة 🍫',
    x: 3680,
    y: 220,
    w: 370,
    h: 240,
    kind: 'house_mint',
    roofColor: '#10B981',
    wallColor: '#ECFDF5',
    trimColor: '#6EE7B7',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    doorX: 3865,
    doorY: 485,
  },
  {
    id: 'villa_west',
    name: 'جناح الياسمين 🌸',
    x: 720,
    y: 970,
    w: 360,
    h: 230,
    kind: 'house_pink',
    roofColor: '#FB7185',
    wallColor: '#FFF5F7',
    trimColor: '#FDA4AF',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    doorX: 900,
    doorY: 1225,
  },
  {
    id: 'house_sugar',
    name: 'البيت الوردي السكّري 🏠',
    x: 3680,
    y: 970,
    w: 350,
    h: 230,
    kind: 'house_pink',
    roofColor: '#F472B6',
    wallColor: '#FFF1F2',
    trimColor: '#FDE047',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    hasWardrobe: true,
    doorX: 3855,
    doorY: 1225,
  },
  {
    id: 'house_pearl',
    name: 'منزل اللؤلؤ السماوي 🏡',
    x: 1740,
    y: 1690,
    w: 350,
    h: 230,
    kind: 'house_sky',
    roofColor: '#0EA5E9',
    wallColor: '#F0F9FF',
    trimColor: '#BAE6FD',
    enterable: true,
    hasBed: true,
    doorX: 1915,
    doorY: 1945,
  },
  {
    id: 'house_emerald',
    name: 'بيت الزمرد الهادئ 🏘️',
    x: 3680,
    y: 1690,
    w: 350,
    h: 230,
    kind: 'house_mint',
    roofColor: '#059669',
    wallColor: '#ECFDF5',
    trimColor: '#FBBF24',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    hasPetCorner: true,
    doorX: 3855,
    doorY: 1945,
  },
  {
    id: 'house_sunset',
    name: 'فيلا غروب الشمس 🌅',
    x: 1740,
    y: 2390,
    w: 360,
    h: 230,
    kind: 'villa',
    roofColor: '#F59E0B',
    wallColor: '#FFFBEB',
    trimColor: '#FB7185',
    enterable: true,
    hasBed: true,
    hasSecondFloor: true,
    doorX: 1920,
    doorY: 2645,
  },
  {
    id: 'princess_cafe',
    name: 'مقهى الأميرات السحري ☕',
    x: 720,
    y: 1690,
    w: 360,
    h: 230,
    kind: 'cafe',
    roofColor: '#EC4899',
    wallColor: '#FFFBEB',
    trimColor: '#F59E0B',
    enterable: true,
    hasBed: false,
    hasCafeCounter: true,
    doorX: 900,
    doorY: 1945,
  },
  {
    id: 'kitty_boutique',
    name: 'متجر الهدايا والورود 🎀',
    x: 2740,
    y: 1690,
    w: 360,
    h: 230,
    kind: 'boutique',
    roofColor: '#8B5CF6',
    wallColor: '#FDF4FF',
    trimColor: '#F472B6',
    enterable: true,
    hasBed: false,
    hasWardrobe: true,
    doorX: 2920,
    doorY: 1945,
  },
  {
    id: 'bakery_house',
    name: 'مخبز الحلويات الملكي 🧁',
    x: 720,
    y: 2390,
    w: 350,
    h: 225,
    kind: 'bakery',
    roofColor: '#F59E0B',
    wallColor: '#FFFBEB',
    trimColor: '#FB7185',
    enterable: true,
    hasBed: false,
    hasCafeCounter: true,
    doorX: 895,
    doorY: 2640,
  },
  {
    id: 'royal_observatory',
    name: 'مرصد النجوم الملكي 🔭',
    x: 2740,
    y: 2390,
    w: 340,
    h: 225,
    kind: 'observatory',
    roofColor: '#4F46E5',
    wallColor: '#EEF2FF',
    trimColor: '#FACC15',
    enterable: true,
    hasBed: false,
    hasObservatory: true,
    doorX: 2910,
    doorY: 2640,
  },
  {
    id: 'rose_stand',
    name: 'كشك بائعة الورد 🌹',
    x: 3740,
    y: 3060,
    w: 230,
    h: 150,
    kind: 'flower_stand',
    roofColor: '#E11D48',
    wallColor: '#FFF5F7',
    trimColor: '#34D399',
    enterable: false,
    hasBed: false,
    doorX: 3855,
    doorY: 3225,
  },
  {
    id: 'garden_gazebo',
    name: 'شرفة الورود الملكية ✨',
    x: 3200,
    y: 3180,
    w: 215,
    h: 165,
    kind: 'gazebo',
    roofColor: '#F59E0B',
    wallColor: '#FFFBEB',
    trimColor: '#FB7185',
    enterable: false,
    hasBed: false,
    doorX: 3307,
    doorY: 3360,
  },
];

export const WORLD_FOUNTAINS: WorldFountain[] = [
  { x: 2400, y: 1120, radius: 90 },
  { x: 2400, y: 1820, radius: 80 },
  { x: 1545, y: 1820, radius: 70 },
  { x: 3860, y: 2480, radius: 72 },
  { x: 4160, y: 3180, radius: 66 },
];

export const WORLD_TREES: WorldTree[] = [
  // Northern Palace & Villas Parks
  { x: 220, y: 240, radius: 48, kind: 'sakura' },
  { x: 430, y: 460, radius: 44, kind: 'emerald' },
  { x: 1320, y: 270, radius: 42, kind: 'cypress' },
  { x: 1680, y: 280, radius: 44, kind: 'sakura' },
  { x: 3160, y: 280, radius: 44, kind: 'sakura' },
  { x: 3420, y: 280, radius: 40, kind: 'cypress' },
  { x: 4380, y: 260, radius: 48, kind: 'sakura' },
  { x: 4520, y: 480, radius: 44, kind: 'emerald' },

  // Mid-Town & Salon District
  { x: 180, y: 960, radius: 46, kind: 'sakura' },
  { x: 180, y: 1260, radius: 44, kind: 'emerald' },
  { x: 1280, y: 1020, radius: 42, kind: 'sakura' },
  { x: 1280, y: 1280, radius: 42, kind: 'emerald' },
  { x: 2190, y: 1020, radius: 40, kind: 'cypress' },
  { x: 2600, y: 1020, radius: 40, kind: 'sakura' },
  { x: 3190, y: 1060, radius: 40, kind: 'emerald' },
  { x: 4580, y: 980, radius: 46, kind: 'sakura' },
  { x: 4580, y: 1260, radius: 44, kind: 'emerald' },

  // Southern Residential Boulevards
  { x: 180, y: 1700, radius: 44, kind: 'emerald' },
  { x: 180, y: 1980, radius: 42, kind: 'sakura' },
  { x: 1280, y: 1700, radius: 40, kind: 'sakura' },
  { x: 2190, y: 1700, radius: 40, kind: 'emerald' },
  { x: 2600, y: 1700, radius: 40, kind: 'cypress' },
  { x: 4580, y: 1700, radius: 46, kind: 'sakura' },
  { x: 4580, y: 1980, radius: 44, kind: 'emerald' },

  // Observatory & Café Row
  { x: 180, y: 2420, radius: 44, kind: 'sakura' },
  { x: 1280, y: 2420, radius: 42, kind: 'emerald' },
  { x: 2190, y: 2420, radius: 40, kind: 'sakura' },
  { x: 2600, y: 2420, radius: 40, kind: 'emerald' },
  { x: 4580, y: 2420, radius: 46, kind: 'sakura' },

  // Starlight Lake & Southern Rose Garden
  { x: 220, y: 3040, radius: 48, kind: 'sakura' },
  { x: 280, y: 3360, radius: 46, kind: 'emerald' },
  { x: 1380, y: 3060, radius: 44, kind: 'sakura' },
  { x: 1450, y: 3360, radius: 46, kind: 'emerald' },
  { x: 2920, y: 3080, radius: 42, kind: 'sakura' },
  { x: 4560, y: 3060, radius: 48, kind: 'sakura' },
  { x: 4520, y: 3360, radius: 46, kind: 'emerald' },
];

// 36 Golden Coins distributed generously across avenues & plazas (+15 coins each!)
export const WORLD_COINS: WorldCoinDef[] = [
  { id: 1, x: 960, y: 755 },
  { id: 2, x: 1260, y: 755 },
  { id: 3, x: 1740, y: 755 },
  { id: 4, x: 2080, y: 755 },
  { id: 5, x: 2780, y: 755 },
  { id: 6, x: 3120, y: 755 },
  { id: 7, x: 3680, y: 755 },
  { id: 8, x: 4080, y: 755 },

  { id: 9, x: 820, y: 1475 },
  { id: 10, x: 1240, y: 1475 },
  { id: 11, x: 1840, y: 1475 },
  { id: 12, x: 2180, y: 1475 },
  { id: 13, x: 2840, y: 1475 },
  { id: 14, x: 3180, y: 1475 },
  { id: 15, x: 3780, y: 1475 },
  { id: 16, x: 4120, y: 1475 },

  { id: 17, x: 900, y: 2195 },
  { id: 18, x: 1320, y: 2195 },
  { id: 19, x: 1920, y: 2195 },
  { id: 20, x: 2840, y: 2195 },
  { id: 21, x: 3620, y: 2195 },
  { id: 22, x: 4080, y: 2195 },

  { id: 23, x: 820, y: 2840 },
  { id: 24, x: 1260, y: 2840 },
  { id: 25, x: 1840, y: 2840 },
  { id: 26, x: 2260, y: 2840 },
  { id: 27, x: 2860, y: 2840 },
  { id: 28, x: 3440, y: 2840 },
  { id: 29, x: 3940, y: 2840 },

  { id: 30, x: 425, y: 1120 },
  { id: 31, x: 425, y: 1840 },
  { id: 32, x: 2400, y: 920 },
  { id: 33, x: 2400, y: 1580 },
  { id: 34, x: 3385, y: 1120 },
  { id: 35, x: 3385, y: 1840 },
  { id: 36, x: 4370, y: 1420 },
];

export const INITIAL_CAR_POSE = {
  x: 1840,
  y: 755,
  angle: 0,
};

export const INITIAL_PLAYER_POSE = {
  x: 2400,
  y: 590,
  angle: -Math.PI / 2,
};

export const WORLD_NPCS: WorldNpcDef[] = [
  {
    id: 'guard',
    name: 'الحارس الملكي',
    role: 'حارس بوابة القصر',
    emoji: '🛡️',
    homeX: 2230,
    homeY: 550,
    patrolRadiusX: 24,
    patrolRadiusY: 0,
    patrolSpeed: 0.7,
    hairColor: '#334155',
    outfitColor: '#2563EB',
    accentColor: '#FBBF24',
  },
  {
    id: 'bestie',
    name: 'صديقة القصر ليلى',
    role: 'وصيفة الأميرة ومنظمة الحفل',
    emoji: '🎀',
    homeX: 2575,
    homeY: 555,
    patrolRadiusX: 32,
    patrolRadiusY: 16,
    patrolSpeed: 0.85,
    hairColor: '#92400E',
    outfitColor: '#A855F7',
    accentColor: '#FDE047',
  },
  {
    id: 'shopkeeper',
    name: 'مسؤول متجر القطط',
    role: 'مسؤول متجر الحيوانات الأليفة',
    emoji: '🧑‍💼',
    homeX: 2935,
    homeY: 1295,
    patrolRadiusX: 28,
    patrolRadiusY: 12,
    patrolSpeed: 0.65,
    hairColor: '#475569',
    outfitColor: '#F97316',
    accentColor: '#FEF08A',
  },
  {
    id: 'florist',
    name: 'بائعة الورد ياسمين',
    role: 'ملكة حديقة الورود',
    emoji: '🌹',
    homeX: 3855,
    homeY: 3260,
    patrolRadiusX: 28,
    patrolRadiusY: 14,
    patrolSpeed: 0.75,
    hairColor: '#7C2D12',
    outfitColor: '#10B981',
    accentColor: '#F43F5E',
  },
  {
    id: 'cat',
    name: 'القطة المتكلمة بسبوسة',
    role: 'أذكى قطة في المملكة',
    emoji: '🐱',
    homeX: 1620,
    homeY: 1080,
    patrolRadiusX: 85,
    patrolRadiusY: 42,
    patrolSpeed: 1.05,
    hairColor: '#F59E0B',
    outfitColor: '#FDE68A',
    accentColor: '#FB7185',
  },
];

export function getQuestObjective(stage: QuestStage, isInCar: boolean): QuestObjectiveInfo {
  if (stage === 0) {
    return {
      stage: 0,
      stepLabel: `المهمة 1 من ${TOTAL_QUEST_COUNT}`,
      title: 'تحدّثي مع الحارس الملكي عند بوابة القصر',
      description: 'اقتربي من الحارس الملكي لمعرفة تفاصيل حفل التتويج اليوم.',
      targetX: 2230,
      targetY: 550,
      targetLabel: 'الحارس الملكي',
    };
  }
  if (stage === 1) {
    return {
      stage: 1,
      stepLabel: `المهمة 2 من ${TOTAL_QUEST_COUNT}`,
      title: isInCar
        ? 'توجّهي بالسيارة إلى بائعة الورد ياسمين في حديقة الورود 🌹'
        : 'اركبي السيارة الوردية وقُوديها إلى حديقة الورود (جنوب شرق)',
      description: 'أحضري باقة الورد الملكية للتتويج واجمعي العملات في طريقكِ.',
      targetX: 3855,
      targetY: 3260,
      targetLabel: 'حديقة الورود',
    };
  }
  if (stage === 2) {
    return {
      stage: 2,
      stepLabel: `المهمة 3 من ${TOTAL_QUEST_COUNT}`,
      title: 'عُودي إلى القصر وتحدّثي مع صديقة القصر ليلى للتتويج! 👑',
      description: 'الجميع بانتظار الباقة الملكية لبدء مراسم تتويجكِ أميرة للمملكة.',
      targetX: 2575,
      targetY: 555,
      targetLabel: 'صديقة القصر ليلى',
    };
  }
  if (stage === 3) {
    return {
      stage: 3,
      stepLabel: `المهمة 4 من ${TOTAL_QUEST_COUNT}`,
      title: 'ادخلي القصر الملكي الواسع واجلسي على عرش الأميرة جودي 👑🪑',
      description: 'تجوّلي داخل القصر الملكي الجديد الواسع جداً واقتربي من العرش أو الأريكة للجلوس الملكي!',
      targetX: 2400,
      targetY: 505,
      targetLabel: 'القصر الملكي الكبير',
    };
  }
  if (stage === 4) {
    return {
      stage: 4,
      stepLabel: `المهمة 5 من ${TOTAL_QUEST_COUNT}`,
      title: 'ضعي مكياجاً أمام المرآة الحقيقية وغيّري ملابسكِ! 💄👗',
      description:
        'اصعدي السلم للدور الثاني، اجلسي على كرسي التسريحة وضعي مكياجاً، ثم افتحي الخزانة وجرّبي فستاناً أو جاكيت جلد!',
      targetX: 2400,
      targetY: 505,
      targetLabel: 'الدور الثاني / الصالون',
    };
  }
  if (stage === 5) {
    return {
      stage: 5,
      stepLabel: `المهمة 6 من ${TOTAL_QUEST_COUNT}`,
      title: 'زُوري مقهى الأميرات السحري واحتسي قهوة ملكية دافئة ☕🧁',
      description: 'قُودي السيارة أو امشي إلى مقهى الأميرات السحري (الحي الغربي) أو المخبز الملكي لرفع طاقتكِ 100%.',
      targetX: 900,
      targetY: 1945,
      targetLabel: 'مقهى الأميرات السحري',
    };
  }
  if (stage === 6) {
    return {
      stage: 6,
      stepLabel: `المهمة 7 من ${TOTAL_QUEST_COUNT}`,
      title: 'اقتربي من إحدى قطط الشارع ثم زوري متجر القطط 🐱',
      description:
        'يمكنكِ التفاعل مع قطط الشارع، ثم زيارة متجر القطط لاختيار قطة خاصة بكِ.',
      targetX: 2935,
      targetY: 1295,
      targetLabel: 'بائع متجر القطط',
    };
  }
  if (stage === 7) {
    return {
      stage: 7,
      stepLabel: `المهمة 8 من ${TOTAL_QUEST_COUNT}`,
      title: 'اجمعي العملات الذهبية واشترِي قطة من متجر القطط! 🐾🪙',
      description:
        'ادخلي متجر القطط ومعكِ 80 عملة على الأقل لاختيار قطة تعيش في مملكتكِ.',
      targetX: 2935,
      targetY: 1235,
      targetLabel: 'متجر القطط',
    };
  }
  if (stage === 8) {
    return {
      stage: 8,
      stepLabel: `المهمة 9 من ${TOTAL_QUEST_COUNT}`,
      title: 'عُودي للقصر الملكي وأطعمي قطتكِ واسقيها الماء حتى تكبر! 🐟💧',
      description:
        'ادخلي القصر، اصعدي السلم للدور الثاني لركن القطط، أطعمي قطتكِ واسقيها واعتني بها حتى تنمو وتكبر!',
      targetX: 2400,
      targetY: 505,
      targetLabel: 'القصر الملكي (الدور 2)',
    };
  }
  if (stage === 9) {
    return {
      stage: 9,
      stepLabel: `المهمة 10 من ${TOTAL_QUEST_COUNT}`,
      title: 'زُوري مرصد النجوم الملكي وشاهدي النجوم بالتلسكوب! 🔭✨',
      description: 'توجّهي إلى مرصد النجوم الملكي في الحي الجنوبي واستخدمي التلسكوب الذهبي لاكتشاف كوكب جودي!',
      targetX: 2910,
      targetY: 2640,
      targetLabel: 'مرصد النجوم الملكي',
    };
  }
  if (stage === 10) {
    return {
      stage: 10,
      stepLabel: `المهمة 11 من ${TOTAL_QUEST_COUNT} (الختام)`,
      title: 'تحدّثي مع ليلى لاستلام الوسام وإكمال اللعبة.',
      description: 'أتممتِ معظم المهام. عودي إلى ليلى أمام القصر لاستلام الوسام الختامي.',
      targetX: 2575,
      targetY: 555,
      targetLabel: 'الاحتفال الختامي (ليلى)',
    };
  }
  return {
    stage: 11,
    stepLabel: `تختيم كامل ${TOTAL_QUEST_COUNT}/${TOTAL_QUEST_COUNT} 🏆`,
    title: 'أحسنتِ! لقد أكملتِ لعبة عالم جودي الملكي.',
    description: 'يمكنكِ الآن استكشاف المملكة واستخدام القصر واستوديو المكياج وغرفة الملابس والمرصد ومتجر القطط.',
    targetX: 2400,
    targetY: 590,
    targetLabel: 'القصر الملكي',
  };
}

export function getNpcDialogue(
  npcId: WorldNpcDef['id'],
  stage: QuestStage,
  context: {
    hasCarriedCat: boolean;
    hasOwnedCat: boolean;
    coins: number;
  },
): {
  lines: DialogueLine[];
  nextStage?: QuestStage;
  rewardCoins?: number;
  triggersCoronation?: boolean;
  triggersGameCompletion?: boolean;
  openPetShopAfter?: boolean;
} {
  if (npcId === 'guard') {
    if (stage === 0) {
      return {
        lines: [
          {
            speaker: 'الحارس الملكي 🛡️',
            speakerTone: 'npc',
            text: 'مرحباً بكِ يا جودي في مملكتكِ. أصبح القصر أكثر اتساعاً، ويضم قاعة ملكية وطابقاً ثانياً وغرفاً مخصصة للملابس والعناية الشخصية.',
          },
          {
            speaker: 'الأميرة جودي 👑',
            speakerTone: 'joudy',
            text: 'أشكرك. سأبدأ باستكشاف المملكة وتنفيذ المهام المحددة على الخريطة.',
          },
          {
            speaker: 'الحارس الملكي 🛡️',
            speakerTone: 'npc',
            text: 'ابدئي بالقيادة إلى حديقة الورود في الجنوب الشرقي، واحصلي من ياسمين على باقة التتويج. ستحصلين على 40 عملة عند إتمام المهمة.',
          },
        ],
        nextStage: 1,
        rewardCoins: 40,
      };
    }
    return {
      lines: [
        {
          speaker: 'الحارس الملكي 🛡️',
          speakerTone: 'npc',
          text:
            stage === 1
              ? 'تنتظركِ ياسمين في حديقة الورود بالجنوب الشرقي. استخدمي التيربو عند الحاجة لتقليل وقت الوصول.'
              : stage >= 11
                ? 'تهانينا يا جودي. لقد أتممتِ مهام المملكة بنجاح، وأصبح القصر مفتوحاً أمامكِ للاستكشاف.'
                : 'تهانينا على التتويج يا جودي. يمكنكِ الآن استكشاف القصر وغرفه ومرافق المملكة.',
        },
      ],
    };
  }

  if (npcId === 'florist') {
    if (stage === 1) {
      return {
        lines: [
          {
            speaker: 'بائعة الورد ياسمين 🌹',
            speakerTone: 'npc',
            text: 'مرحباً بكِ يا جودي في حديقة الورود. يسعدني استقبالُكِ.',
          },
          {
            speaker: 'الأميرة جودي 👑',
            speakerTone: 'joudy',
            text: 'أرسلني الحارس الملكي للحصول على باقة التتويج.',
          },
          {
            speaker: 'بائعة الورد ياسمين 🌹',
            speakerTone: 'npc',
            text: 'تفضّلي باقة التتويج. أضيف إلى رصيدكِ 50 عملة. عودي إلى ليلى أمام القصر لإتمام مراسم التتويج.',
          },
        ],
        nextStage: 2,
        rewardCoins: 50,
      };
    }
    return {
      lines: [
        {
          speaker: 'بائعة الورد ياسمين 🌹',
          speakerTone: 'npc',
          text:
            stage === 0
              ? 'مرحباً يا جودي. تحدثي أولاً مع الحارس الملكي عند بوابة القصر لبدء المهام.'
              : 'تهانينا يا جودي على التتويج. أصبحتِ قادرة على متابعة بقية مهام المملكة.',
        },
      ],
    };
  }

  if (npcId === 'bestie') {
    if (stage === 2) {
      return {
        lines: [
          {
            speaker: 'ليلى، منسقة القصر',
            speakerTone: 'npc',
            text: 'وصلت باقة التتويج يا جودي. اكتملت المرحلة الأولى من المراسم، وأضيف إلى رصيدكِ 60 عملة.',
          },
          {
            speaker: 'ليلى، منسقة القصر',
            speakerTone: 'npc',
            text: 'توجّهي الآن إلى القصر، واستكشفي القاعة الملكية، ثم انتقلي إلى الطابق الثاني لزيارة غرفة الملابس واستوديو المكياج.',
          },
        ],
        nextStage: 3,
        rewardCoins: 60,
        triggersCoronation: true,
      };
    }
    if (stage === 10) {
      return {
        lines: [
          {
            speaker: 'ليلى، منسقة القصر',
            speakerTone: 'npc',
            text: 'أتممتِ مهام القصر، وجرّبتِ المكياج والأزياء، واعتنيتِ بقطتكِ، وزرتِ المرصد الملكي. لقد أنجزتِ جميع الأنشطة المطلوبة.',
          },
          {
            speaker: 'الأميرة جودي 👑',
            speakerTone: 'joudy',
            text: 'شكراً لكِ يا ليلى. كانت رحلة مميزة، وقد استمتعت باستكشاف مرافق المملكة.',
          },
          {
            speaker: 'ليلى، منسقة القصر',
            speakerTone: 'npc',
            text: 'نمنحكِ وسام التميّز الملكي، ونضيف إلى رصيدكِ 200 عملة. تهانينا على إكمال جميع مهام اللعبة.',
          },
        ],
        nextStage: 11,
        rewardCoins: 200,
        triggersGameCompletion: true,
      };
    }
    return {
      lines: [
        {
          speaker: 'ليلى، منسقة القصر',
          speakerTone: 'npc',
          text:
            stage < 2
              ? 'اتبعي العلامة الذهبية للوصول إلى المهمة الحالية، ثم عودي إليّ.'
              : stage === 3
                ? 'ادخلي القصر الملكي واجلسي على العرش الموجود في وسط القاعة.'
                : stage === 4
                  ? 'اصعدي إلى الطابق الثاني لزيارة غرفة الملابس واستوديو المكياج.'
                  : stage === 5
                    ? 'زوري المقهى الملكي لتناول مشروب واستعادة نشاطكِ.'
                    : stage < 10
                      ? 'أكملي مهام متجر القطط والمرصد الملكي، ثم عودي إليّ لإتمام مراسم التتويج.'
                      : 'أكملتِ اللعبة بنجاح يا جودي. أصبحت جميع مرافق المملكة متاحة للاستكشاف.',
        },
      ],
    };
  }

  if (npcId === 'shopkeeper') {
    if (stage === 6) {
      return {
        lines: [
          {
            speaker: 'مسؤول متجر القطط 🧑‍💼🐱',
            speakerTone: 'npc',
            text: 'مرحباً بكِ في متجر القطط يا جودي. لدينا مجموعة من القطط، ولكل واحدة صفاتها واحتياجاتها الخاصة.',
          },
          {
            speaker: 'الأميرة جودي 👑',
            speakerTone: 'joudy',
            text: context.hasCarriedCat
              ? 'وجدتُ قطة في الشارع. أودّ اختيار قطة تعيش معي في المملكة.'
              : 'أودّ معرفة القطط المتاحة وكيفية الاعتناء بها في القصر.',
          },
          {
            speaker: 'مسؤول متجر القطط 🧑‍💼🐱',
            speakerTone: 'npc',
            text: 'قطط الشارع تعيش بحرية ويمكنكِ التفاعل معها، أما القطط المعروضة هنا فيمكن اختيار واحدة منها لتعيش في المملكة. ستحتاج إلى الطعام والماء والرعاية المنتظمة. (+60 عملة ترحيبية)',
          },
        ],
        nextStage: 7,
        rewardCoins: 60,
        openPetShopAfter: true,
      };
    }
    return {
      lines: [
        {
          speaker: 'مسؤول متجر القطط 🧑‍💼🐱',
          speakerTone: 'npc',
          text:
            context.hasOwnedCat
              ? 'أصبحت قطتكِ في القصر الآن. احرصي على توفير الطعام والماء لها، ويمكنكِ زيارة المتجر مجدداً متى شئتِ.'
              : `مرحباً جودي. لديكِ الآن ${context.coins} عملة ذهبية. تبدأ أسعار القطط من 80 عملة؛ يمكنكِ جمع العملات أو تصفّح المتجر.`,
        },
      ],
      openPetShopAfter: true,
    };
  }

  // Talking Cat NPC Basbousa
  return {
    lines: [
      {
        speaker: 'القطة المتكلمة بسبوسة 🐱',
        speakerTone: 'npc',
        text:
          stage < 3
            ? 'مياو~ أهلاً بالأميرة جودي! ابدئي مع الحارس وزهور ياسمين لحفل تتويجكِ!'
            : stage <= 5
              ? 'مياو! قصركِ الآن أصبح واسعاً جداً وفيه عرش للجلوس ومقهى رائع في الحي الغربي!'
              : stage <= 8
                ? 'مياو! يمكنكِ زيارة متجر القطط لاختيار رفيقة جديدة تعيش في القصر.'
                : 'مياو~ لا تنسي النظر بالتلسكوب في مرصد النجوم الملكي قبل الحفل الختامي! 🔭✨',
      },
    ],
  };
}
