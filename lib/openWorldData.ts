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
    primaryHex: '#A9BDA5',
    secondaryHex: '#F0ECDD',
    accentHex: '#C8A96A',
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
  height?: number;
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
  id: string;
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

// North edge of the playable city is the Mediterranean. The collision ellipse
// keeps the player on land while the 3D scene renders the open sea.
export const WORLD_LAKE = {
  cx: 2400,
  cy: -900,
  rx: 3900,
  ry: 1320,
};

// A compact west-to-east slice of Alexandria: the coastal road plus the
// inland streets that connect the six playable neighbourhoods.
export const WORLD_ROADS: WorldRoadSegment[] = [
  { x: 160, y: 760, w: 4480, h: 260 }, // Corniche / coastal highway
  { x: 160, y: 1190, w: 4480, h: 160 },
  { x: 160, y: 1870, w: 4480, h: 170 },
  { x: 160, y: 2670, w: 4480, h: 180 },
  { x: 620, y: 740, w: 155, h: 2660 },
  { x: 1360, y: 740, w: 155, h: 2660 },
  { x: 2150, y: 740, w: 155, h: 2660 },
  { x: 2940, y: 740, w: 155, h: 2660 },
  { x: 3720, y: 740, w: 155, h: 2660 },
  { x: 4440, y: 740, w: 155, h: 2660 },
];

export const WORLD_BUILDINGS: WorldBuilding[] = [
  // Bahary & Anfoushi — low-rise, faded coastal colours
  { id: 'bahary-1', name: 'بحري والأنفوشي', x: 220, y: 900, w: 320, h: 250, kind: 'house_sky', roofColor: '#B7A58B', wallColor: '#E9D9BC', trimColor: '#7C6F61', enterable: false, hasBed: false, height: 10.5, doorX: 380, doorY: 1170 },
  { id: 'bahary-2', name: 'عمارات الأنفوشي القديمة', x: 780, y: 1450, w: 360, h: 285, kind: 'house_pink', roofColor: '#B2A18A', wallColor: '#E5D6C2', trimColor: '#6D7A82', enterable: false, hasBed: false, height: 11.5, doorX: 960, doorY: 1745 },
  { id: 'fisher-market', name: 'سوق الصيادين', x: 260, y: 1850, w: 300, h: 220, kind: 'cafe', roofColor: '#477C91', wallColor: '#E9E2D5', trimColor: '#F0C36C', enterable: false, hasBed: false, height: 6.5, doorX: 410, doorY: 2080 },

  // Mansheya & Raml Station — ornate Italian / French façades
  { id: 'mansheya-arcades', name: 'ميدان المنشية', x: 1000, y: 900, w: 440, h: 300, kind: 'villa', roofColor: '#65717B', wallColor: '#E8D9C5', trimColor: '#9A795D', enterable: false, hasBed: false, height: 17, doorX: 1220, doorY: 1210 },
  { id: 'saad-zaghloul', name: 'شارع سعد زغلول', x: 1580, y: 1450, w: 410, h: 270, kind: 'house_sky', roofColor: '#5D6772', wallColor: '#E9DFD2', trimColor: '#8E6D50', enterable: false, hasBed: false, height: 15, doorX: 1785, doorY: 1730 },
  { id: 'raml-cafes', name: 'محطة الرمل والكافيهات', x: 930, y: 2130, w: 390, h: 260, kind: 'cafe', roofColor: '#69574A', wallColor: '#DCCBB2', trimColor: '#B48A62', enterable: false, hasBed: false, height: 13, doorX: 1125, doorY: 2410 },

  // Shatby & Azarita — campus and the modern library
  { id: 'shatby-campus', name: 'مجمع الكليات النظرية', x: 1740, y: 900, w: 360, h: 330, kind: 'villa', roofColor: '#66747A', wallColor: '#D8D6C9', trimColor: '#A58A6A', enterable: false, hasBed: false, height: 14, doorX: 1920, doorY: 1240 },
  { id: 'azarita-homes', name: 'الأزاريطة', x: 2340, y: 1460, w: 390, h: 290, kind: 'house_mint', roofColor: '#66727B', wallColor: '#E7D9C7', trimColor: '#A07B5C', enterable: false, hasBed: false, height: 16, doorX: 2535, doorY: 1760 },

  // Stanley & Gleem — coastal apartments and modern hotels
  { id: 'stanley-tower-west', name: 'أبراج ستانلي', x: 2600, y: 900, w: 260, h: 340, kind: 'house_sky', roofColor: '#526879', wallColor: '#D6E0E1', trimColor: '#94A8AE', enterable: false, hasBed: false, height: 25, doorX: 2730, doorY: 1250 },
  { id: 'gleem-residences', name: 'جليم', x: 3050, y: 1450, w: 420, h: 280, kind: 'house_mint', roofColor: '#566B78', wallColor: '#E5E1D5', trimColor: '#9B8067', enterable: false, hasBed: false, height: 18, doorX: 3260, doorY: 1740 },

  // San Stefano & Sidi Bishr — contemporary towers and busy retail strips
  { id: 'san-stefano-tower-a', name: 'سان ستيفانو — البرج الغربي', x: 3450, y: 900, w: 250, h: 340, kind: 'house_sky', roofColor: '#496579', wallColor: '#D6E4E7', trimColor: '#A8BBC2', enterable: false, hasBed: false, height: 31, doorX: 3575, doorY: 1250 },
  { id: 'san-stefano-tower-b', name: 'سان ستيفانو — البرج الشرقي', x: 3760, y: 900, w: 250, h: 340, kind: 'house_sky', roofColor: '#496579', wallColor: '#D6E4E7', trimColor: '#A8BBC2', enterable: false, hasBed: false, height: 29, doorX: 3885, doorY: 1250 },
  { id: 'sidi-bishr-shops', name: 'شارع خالد بن الوليد', x: 3420, y: 2110, w: 450, h: 300, kind: 'cafe', roofColor: '#334B62', wallColor: '#D9D5CB', trimColor: '#E7B65A', enterable: false, hasBed: false, height: 12, doorX: 3645, doorY: 2420 },

  // Mandara & Montaza — quieter residential blocks and royal gardens
  { id: 'mandara-homes', name: 'المندرة', x: 4080, y: 1450, w: 360, h: 280, kind: 'house_mint', roofColor: '#60716B', wallColor: '#E7E0D2', trimColor: '#A88E6B', enterable: false, hasBed: false, height: 13, doorX: 4260, doorY: 1740 },
  { id: 'montaza-palace', name: 'قصر المنتزه الملكي', x: 4120, y: 2180, w: 520, h: 360, kind: 'palace', roofColor: '#987A4F', wallColor: '#E8DCC7', trimColor: '#C5A66E', enterable: false, hasBed: false, height: 17, doorX: 4380, doorY: 2550 },
  { id: 'montaza-park', name: 'حدائق المنتزه', x: 4000, y: 2900, w: 520, h: 330, kind: 'villa', roofColor: '#5C7461', wallColor: '#D5DCCB', trimColor: '#A9B88D', enterable: false, hasBed: false, height: 8, doorX: 4260, doorY: 3240 },
];

export const WORLD_FOUNTAINS: WorldFountain[] = [];

export const WORLD_TREES: WorldTree[] = [
  { x: 240, y: 1350, radius: 45, kind: 'emerald' }, { x: 480, y: 1550, radius: 42, kind: 'cypress' },
  { x: 920, y: 1010, radius: 40, kind: 'emerald' }, { x: 1240, y: 1770, radius: 38, kind: 'cypress' },
  { x: 1640, y: 2200, radius: 42, kind: 'emerald' }, { x: 1960, y: 2520, radius: 40, kind: 'cypress' },
  { x: 2470, y: 1510, radius: 38, kind: 'emerald' }, { x: 2850, y: 1880, radius: 42, kind: 'cypress' },
  { x: 3180, y: 2420, radius: 40, kind: 'emerald' }, { x: 3500, y: 1800, radius: 38, kind: 'cypress' },
  { x: 3980, y: 1960, radius: 42, kind: 'emerald' }, { x: 4200, y: 2780, radius: 48, kind: 'cypress' },
  { x: 4480, y: 2880, radius: 46, kind: 'emerald' }, { x: 4600, y: 3180, radius: 42, kind: 'cypress' },
  { x: 710, y: 2840, radius: 38, kind: 'emerald' }, { x: 1540, y: 3020, radius: 42, kind: 'cypress' },
  { x: 2310, y: 3060, radius: 40, kind: 'emerald' }, { x: 3000, y: 3180, radius: 42, kind: 'cypress' },
];

export const WORLD_COINS: WorldCoinDef[] = [
  { id: 1, x: 860, y: 890 }, { id: 2, x: 1250, y: 890 }, { id: 3, x: 1740, y: 890 },
  { id: 4, x: 2260, y: 890 }, { id: 5, x: 2780, y: 890 }, { id: 6, x: 3310, y: 890 },
  { id: 7, x: 3820, y: 890 }, { id: 8, x: 4290, y: 890 },
  { id: 9, x: 470, y: 1080 }, { id: 10, x: 1140, y: 1080 }, { id: 11, x: 1850, y: 1080 },
  { id: 12, x: 2550, y: 1080 }, { id: 13, x: 3260, y: 1080 }, { id: 14, x: 3970, y: 1080 },
  { id: 15, x: 880, y: 1630 }, { id: 16, x: 1640, y: 1630 }, { id: 17, x: 2380, y: 1630 },
  { id: 18, x: 3090, y: 1630 }, { id: 19, x: 3810, y: 1630 }, { id: 20, x: 4430, y: 1630 },
  { id: 21, x: 520, y: 2380 }, { id: 22, x: 1260, y: 2380 }, { id: 23, x: 1950, y: 2380 },
  { id: 24, x: 2680, y: 2380 }, { id: 25, x: 3420, y: 2380 }, { id: 26, x: 4140, y: 2380 },
  { id: 27, x: 830, y: 3020 }, { id: 28, x: 1570, y: 3020 }, { id: 29, x: 2300, y: 3020 },
  { id: 30, x: 3000, y: 3020 }, { id: 31, x: 3720, y: 3020 }, { id: 32, x: 4440, y: 3020 },
];

export const INITIAL_CAR_POSE = { x: 970, y: 890, angle: 0 };
export const INITIAL_PLAYER_POSE = { x: 850, y: 890, angle: -Math.PI / 2 };

export const WORLD_NPCS: WorldNpcDef[] = [
  { id: 'fish-vendor', name: 'عم صبحي — صياد بحري', role: 'صياد في بحري', emoji: '🐟', homeX: 720, homeY: 940, patrolRadiusX: 48, patrolRadiusY: 28, patrolSpeed: 0.65, hairColor: '#514338', outfitColor: '#256A83', accentColor: '#D6B17A' },
  { id: 'corn-vendor', name: 'أم دنيا — بائعة ذرة', role: 'عربة ذرة على الكورنيش', emoji: '🌽', homeX: 1120, homeY: 940, patrolRadiusX: 35, patrolRadiusY: 18, patrolSpeed: 0.78, hairColor: '#4B3428', outfitColor: '#C47D36', accentColor: '#F4D06F' },
  { id: 'tram-driver', name: 'عم رجب — سائق الترام', role: 'سائق ترام الرمل', emoji: '🚋', homeX: 1515, homeY: 1570, patrolRadiusX: 22, patrolRadiusY: 44, patrolSpeed: 0.58, hairColor: '#4A4038', outfitColor: '#234D69', accentColor: '#F1C45B' },
  { id: 'student', name: 'مريم — طالبة في الشاطبي', role: 'طالبة جامعية', emoji: '🎓', homeX: 2180, homeY: 1250, patrolRadiusX: 55, patrolRadiusY: 32, patrolSpeed: 0.92, hairColor: '#7D4B32', outfitColor: '#8B6AB0', accentColor: '#E7D1A7' },
  { id: 'photographer', name: 'كريم — مصور ستانلي', role: 'مصور على كوبري ستانلي', emoji: '📷', homeX: 2940, homeY: 960, patrolRadiusX: 52, patrolRadiusY: 22, patrolSpeed: 0.82, hairColor: '#42342E', outfitColor: '#3C6C83', accentColor: '#E5C88B' },
  { id: 'cafe-owner', name: 'عماد — صاحب كافيه جليم', role: 'صاحب مقهى', emoji: '☕', homeX: 3180, homeY: 1640, patrolRadiusX: 36, patrolRadiusY: 25, patrolSpeed: 0.62, hairColor: '#463B35', outfitColor: '#647B62', accentColor: '#D4B483' },
  { id: 'shopper', name: 'سلمى — من سكان سيدي بشر', role: 'من سكان المنطقة', emoji: '🛍️', homeX: 3800, homeY: 2070, patrolRadiusX: 46, patrolRadiusY: 28, patrolSpeed: 0.9, hairColor: '#5A3D2B', outfitColor: '#B65F65', accentColor: '#E7D1A7' },
  { id: 'icecream-vendor', name: 'عم فوزي — بائع آيس كريم', role: 'عربة آيس كريم', emoji: '🍦', homeX: 4210, homeY: 900, patrolRadiusX: 32, patrolRadiusY: 18, patrolSpeed: 0.7, hairColor: '#584033', outfitColor: '#5A88A1', accentColor: '#F2C76D' },
  { id: 'park-visitor', name: 'ليلى — زائرة المنتزه', role: 'زائرة حدائق المنتزه', emoji: '🌳', homeX: 4380, homeY: 2940, patrolRadiusX: 70, patrolRadiusY: 42, patrolSpeed: 0.72, hairColor: '#75462F', outfitColor: '#63836A', accentColor: '#E8D4AB' },
  { id: 'student-two', name: 'يوسف — طالب', role: 'طالب جامعي', emoji: '📚', homeX: 1910, homeY: 2140, patrolRadiusX: 60, patrolRadiusY: 30, patrolSpeed: 1.0, hairColor: '#49392F', outfitColor: '#405B7B', accentColor: '#C9B48A' },
  { id: 'resident', name: 'ندى — من سكان المندرة', role: 'من سكان المندرة', emoji: '🏙️', homeX: 4500, homeY: 1710, patrolRadiusX: 45, patrolRadiusY: 34, patrolSpeed: 0.75, hairColor: '#6A4933', outfitColor: '#8D7393', accentColor: '#DCC9A7' },
  { id: 'street-vendor', name: 'عم حسن — بائع حمص الشام', role: 'عربة حمص الشام', emoji: '🥣', homeX: 760, homeY: 2300, patrolRadiusX: 34, patrolRadiusY: 22, patrolSpeed: 0.66, hairColor: '#55443B', outfitColor: '#A65F3F', accentColor: '#E0C28C' },
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
  if (stage >= 11) {
    const cityLines: Record<string, { speaker: string; text: string }> = {
      'fish-vendor': { speaker: 'عم صبحي — صياد بحري', text: 'البحر هادي النهارده، والمراكب راجعة من المينا. اتفرجي على قلعة قايتباي من الناحية دي!' },
      'corn-vendor': { speaker: 'أم دنيا — بائعة ذرة', text: 'ذرة سخنة يا آنسة؟ الكورنيش بالليل له جو تاني خالص.' },
      'tram-driver': { speaker: 'عم رجب — سائق الترام', text: 'ترام الرمل ماشي من زمان في شوارع إسكندرية. خلي بالك من السكة وإنتِ بتعدّي.' },
      student: { speaker: 'مريم — طالبة في الشاطبي', text: 'مكتبة إسكندرية قريبة من هنا، المكان حواليها هادي ولطيف للمشي.' },
      photographer: { speaker: 'كريم — مصور ستانلي', text: 'كوبري ستانلي أحلى وقت للتصوير قبل الغروب، البحر بيبقى لونه تحفة.' },
      'cafe-owner': { speaker: 'عماد — صاحب كافيه جليم', text: 'أهلاً بيكي في جليم! اقعدي على البحر واطلبي حاجة ساقعة.' },
      shopper: { speaker: 'سلمى — من سكان سيدي بشر', text: 'شارع خالد بن الوليد زحمة شوية، بس هتلاقي محلات وأكل في كل حتة.' },
      'icecream-vendor': { speaker: 'عم فوزي — بائع آيس كريم', text: 'آيس كريم يا حلوين! الجو على البحر محتاج حاجة ساقعة.' },
      'park-visitor': { speaker: 'ليلى — زائرة المنتزه', text: 'حدائق المنتزه واسعة جداً، خدي لفة بين الشجر والبحر.' },
      'student-two': { speaker: 'يوسف — طالب', text: 'الشاطبي والأزاريطة دايماً فيهم حركة طلبة ومكتبات وكافيهات.' },
      resident: { speaker: 'ندى — من سكان المندرة', text: 'المنطقة هنا أهدى من وسط البلد، خصوصاً ناحية المندرة.' },
      'street-vendor': { speaker: 'عم حسن — بائع حمص الشام', text: 'حمص الشام سخن! ده أحسن حاجة في الليالي الساقعة على الكورنيش.' },
    };
    const line = cityLines[npcId] ?? { speaker: 'أحد سكان إسكندرية', text: 'أهلاً بيكي في إسكندرية! استمتعي بالتمشية على البحر.' };
    return { lines: [{ speaker: line.speaker, speakerTone: 'npc', text: line.text }] };
  }

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
