export type WorldParticleMode = 'petals' | 'fireflies' | 'stars';

export interface WorldTheme {
  id: number;
  name: string;
  subtitle: string;
  bgImage: string;
  tintOverlay: string;
  isNight: boolean;
  particleMode: WorldParticleMode;
  accentHex: string;
  cardBgClass: string;
  borderClass: string;
}

export interface LevelConfig {
  level: number;
  worldId: number;
  worldName: string;
  bgImage: string;
  tintOverlay: string;
  isNight: boolean;
  particleMode: WorldParticleMode;
  targetScore: number;
  speedMultiplier: number;
  spawnIntervalSec: number;
  obstacleChance: number;
  windStrength: number;
  secretNote: string;
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    id: 1,
    name: 'الحدائق المفتوحة',
    subtitle: 'المستويات 1 – 5 · المستويات 1–5 · تحديات البداية',
    bgImage: '/images/anime-meadow.jpg',
    tintOverlay: 'rgba(255, 245, 250, 0.22)',
    isNight: false,
    particleMode: 'petals',
    accentHex: '#E11D48',
    cardBgClass: 'from-[#FFF4F8] to-[#FFFDF9]',
    borderClass: 'border-rose-200',
  },
  {
    id: 2,
    name: 'غابة الزمرد',
    subtitle: 'المستويات 6 – 10 · المستويات 6–10 · مسارات الغابة',
    bgImage: '/images/anime-forest.jpg',
    tintOverlay: 'rgba(236, 253, 245, 0.16)',
    isNight: false,
    particleMode: 'fireflies',
    accentHex: '#059669',
    cardBgClass: 'from-[#F0FDF7] to-[#FAFDF9]',
    borderClass: 'border-emerald-200',
  },
  {
    id: 3,
    name: 'الوادي الذهبي',
    subtitle: 'المستويات 11 – 15 · المستويات 11–15 · مسارات الوادي',
    bgImage: '/images/anime-meadow.jpg',
    tintOverlay: 'rgba(254, 215, 170, 0.28)',
    isNight: false,
    particleMode: 'petals',
    accentHex: '#D97706',
    cardBgClass: 'from-[#FFFBEB] to-[#FFF5F5]',
    borderClass: 'border-amber-200',
  },
  {
    id: 4,
    name: 'المدينة الساحلية',
    subtitle: 'المستويات 16 – 20 · المستويات 16–20 · طرق الساحل',
    bgImage: '/images/anime-sunset.jpg',
    tintOverlay: 'rgba(251, 113, 133, 0.14)',
    isNight: false,
    particleMode: 'petals',
    accentHex: '#DB2777',
    cardBgClass: 'from-[#FFF1F5] to-[#FFF3EB]',
    borderClass: 'border-pink-200',
  },
  {
    id: 5,
    name: 'المنطقة الجبلية',
    subtitle: 'المستويات 21 – 25 · المستويات 21–25 · تضاريس مرتفعة',
    bgImage: '/images/anime-sunset.jpg',
    tintOverlay: 'rgba(76, 29, 149, 0.34)',
    isNight: true,
    particleMode: 'stars',
    accentHex: '#7C3AED',
    cardBgClass: 'from-[#F5F3FF] to-[#FAF5FF]',
    borderClass: 'border-violet-200',
  },
  {
    id: 6,
    name: 'المركز الحضري الليلي',
    subtitle: 'المستويات 26 – 30 · المستويات 26–30 · التحدي النهائي',
    bgImage: '/images/anime-night.jpg',
    tintOverlay: 'rgba(15, 23, 42, 0.18)',
    isNight: true,
    particleMode: 'stars',
    accentHex: '#4F46E5',
    cardBgClass: 'from-[#EEF2FF] to-[#F5F3FF]',
    borderClass: 'border-indigo-200',
  },
];

const SECRET_NOTES = [
  'بداية موفقة يا جودي. واصلي التقدم خطوةً بعد أخرى.',
  'يعكس أداؤكِ تقدماً واضحاً. حافظي على هذا المستوى من التركيز.',
  'تتطور مهاراتكِ مع كل مرحلة، وتزداد قدرتكِ على تجاوز التحديات.',
  'كل مهمة تنجزينها تضيف إنجازاً جديداً إلى رحلتكِ.',
  'اكتمل العالم الأول بنجاح. استعدي لاستكشاف غابة الزمرد.',
  'أظهرتِ تركيزاً جيداً في هذا المستوى. تابعي بثبات.',
  'تمنح جودي كل مغامرة طابعاً مميزاً بفضل إصرارها.',
  'استراحة قصيرة قد تساعدكِ على مواصلة التقدم بنشاط.',
  'اقتربتِ من إكمال ثلث المغامرة. إنجاز يستحق التقدير.',
  'وصلتِ إلى المستوى العاشر. تنتظركِ تحديات جديدة في غابة الزمرد.',
  'أصبحتِ الآن في الوادي الذهبي. واصلي الاستكشاف.',
  'تؤكد نتائجكِ أن الاستمرار والتركيز يصنعان فارقاً واضحاً.',
  'تستحق كل خطوة ناجحة تقديراً يليق بمجهودكِ.',
  'توازنين بين السرعة والدقة بصورة أفضل مع كل مرحلة.',
  'اجتزتِ نصف الطريق. تابعي بالمستوى نفسه من الانتباه.',
  'مرحباً بكِ في عالم غروب الأفق. استكشفي تفاصيله بعناية.',
  'كل نقطة تجمعينها تقرّبكِ من إنجاز جديد.',
  'تستمتع القطط بوقتها في المملكة بفضل اهتمام جودي بها.',
  'يقدم هذا المستوى تحدياً جديداً. ثقي بقدرتكِ على تجاوزه.',
  'أكملتِ عشرين مستوى. هذا تقدم ملحوظ يستحق الاحتفاء.',
  'فُتحت أبواب المنطقة الجبلية. تابعي رحلتكِ.',
  'أداؤكِ ثابت تحت أضواء الشفق. اقتربتِ من المرحلة التالية.',
  'تجاوزتِ مستوى صعباً بتركيز جيد وقدرة على اتخاذ القرار.',
  'تقتربين من المفاجأة الختامية. واصلي التقدم.',
  'أكملتِ خمسةً وعشرين مستوى. لم يتبقَّ سوى خمس مراحل.',
  'وصلتِ إلى المرحلة الأخيرة: المركز الحضري الليلي.',
  'اقتربتِ من نهاية الرحلة. بقيت خطوات قليلة على الإنجاز.',
  'لم يتبقَّ سوى مستويين للوصول إلى التتويج. واصلي بثبات.',
  'اكتمل المستوى قبل الأخير. استعدي للمرحلة النهائية.',
  'أكملتِ المستويات الثلاثين بنجاح. إنجاز مميز يا جودي.',
];

const TARGET_SCORES = [
  300, 330, 360, 390, 420,
  450, 480, 510, 540, 570,
  600, 630, 660, 690, 720,
  750, 780, 810, 840, 870,
  900, 930, 960, 990, 1020,
  1050, 1080, 1110, 1150, 1200,
];

export const LEVELS: LevelConfig[] = Array.from({ length: 30 }, (_, idx) => {
  const level = idx + 1;
  const worldIndex = Math.floor(idx / 5);
  const world = WORLD_THEMES[worldIndex];
  const progress = idx / 29; // 0 to 1

  return {
    level,
    worldId: world.id,
    worldName: world.name,
    bgImage: world.bgImage,
    tintOverlay: world.tintOverlay,
    isNight: world.isNight,
    particleMode: world.particleMode,
    targetScore: TARGET_SCORES[idx],
    speedMultiplier: Number((1.15 + progress * 1.05).toFixed(2)),
    spawnIntervalSec: Number((0.56 - progress * 0.28).toFixed(2)),
    obstacleChance: Number((0.22 + progress * 0.18).toFixed(2)),
    windStrength: Number((12 + progress * 48).toFixed(1)),
    secretNote: SECRET_NOTES[idx],
  };
});

export function getLevelConfig(levelNumber: number): LevelConfig {
  const clamped = Math.max(1, Math.min(30, Math.round(levelNumber)));
  return LEVELS[clamped - 1];
}
