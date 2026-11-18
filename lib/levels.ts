export type WorldParticleMode = 'petals' | 'fireflies' | 'stars';
export type LevelWeatherMode = 'clear' | 'winter-storm';

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
  timeOfDayPhase: number;
  weatherMode: LevelWeatherMode;
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
    name: 'وادي مواجهة الزعيم',
    subtitle: 'المستويات 11–15 · الطريق إلى المواجهة الكبرى',
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
    name: 'مدينة الظلال',
    subtitle: 'المستويات 16–20 · الموسم الثاني يبدأ هنا',
    bgImage: '/images/anime-night.jpg',
    tintOverlay: 'rgba(15, 23, 42, 0.58)',
    isNight: true,
    particleMode: 'stars',
    accentHex: '#8B5CF6',
    cardBgClass: 'from-[#17152D] to-[#090D1B]',
    borderClass: 'border-violet-300/30',
  },
  {
    id: 5,
    name: 'غابة الكائنات الغريبة',
    subtitle: 'المستويات 21 – 25 · مخلوقات وظلال متحركة',
    bgImage: '/images/anime-forest.jpg',
    tintOverlay: 'rgba(8, 19, 31, 0.72)',
    isNight: true,
    particleMode: 'fireflies',
    accentHex: '#22D3EE',
    cardBgClass: 'from-[#0C2630] to-[#0B1320]',
    borderClass: 'border-cyan-300/25',
  },
  {
    id: 6,
    name: 'قلعة الزعيم الأخير',
    subtitle: 'المستويات 26 – 30 · الطريق إلى المواجهة النهائية',
    bgImage: '/images/anime-night.jpg',
    tintOverlay: 'rgba(4, 7, 18, 0.78)',
    isNight: true,
    particleMode: 'stars',
    accentHex: '#F43F5E',
    cardBgClass: 'from-[#220F24] to-[#080B16]',
    borderClass: 'border-rose-300/30',
  },
];


// Backdrops rotate at every level so consecutive stages feel like new places.
// The art files are reused with distinct colour grading because the project
// currently ships four painted world panoramas.
const LEVEL_BACKDROPS = [
  '/images/anime-meadow.jpg', '/images/anime-sunset.jpg', '/images/anime-forest.jpg', '/images/anime-night.jpg',
  '/images/anime-meadow.jpg', '/images/anime-forest.jpg', '/images/anime-sunset.jpg', '/images/anime-night.jpg',
  '/images/anime-forest.jpg', '/images/anime-meadow.jpg', '/images/anime-night.jpg', '/images/anime-sunset.jpg',
  '/images/anime-meadow.jpg', '/images/anime-forest.jpg', '/images/anime-night.jpg',
  '/images/anime-night.jpg', '/images/anime-sunset.jpg', '/images/anime-forest.jpg', '/images/anime-night.jpg',
  '/images/anime-meadow.jpg', '/images/anime-forest.jpg', '/images/anime-sunset.jpg', '/images/anime-night.jpg',
  '/images/anime-forest.jpg', '/images/anime-meadow.jpg', '/images/anime-night.jpg', '/images/anime-sunset.jpg',
  '/images/anime-forest.jpg', '/images/anime-night.jpg', '/images/anime-night.jpg',
] as const;

const LEVEL_TINTS = [
  'rgba(255, 226, 235, .18)', 'rgba(255, 190, 156, .18)', 'rgba(120, 210, 167, .16)', 'rgba(50, 72, 125, .20)',
  'rgba(255, 240, 192, .16)', 'rgba(18, 105, 81, .22)', 'rgba(255, 174, 126, .18)', 'rgba(24, 34, 82, .26)',
  'rgba(62, 120, 96, .18)', 'rgba(255, 226, 170, .19)', 'rgba(22, 28, 67, .32)', 'rgba(170, 104, 91, .20)',
  'rgba(255, 203, 184, .18)', 'rgba(34, 73, 92, .22)', 'rgba(120, 154, 190, .43)',
  'rgba(35, 29, 85, .42)', 'rgba(154, 82, 91, .24)', 'rgba(21, 77, 78, .30)', 'rgba(25, 26, 73, .42)',
  'rgba(255, 224, 176, .16)', 'rgba(22, 78, 78, .31)', 'rgba(170, 93, 77, .24)', 'rgba(19, 30, 84, .40)',
  'rgba(16, 73, 75, .34)', 'rgba(255, 222, 160, .16)', 'rgba(26, 21, 70, .44)', 'rgba(145, 77, 95, .26)',
  'rgba(18, 68, 74, .34)', 'rgba(20, 22, 67, .48)', 'rgba(5, 8, 28, .58)',
] as const;

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

// أهداف النقاط: أول 15 مرحلة كما طلبت جودي، ثم تصاعد الموسم الثاني حتى مواجهة 30.
const TARGET_SCORES = [
  1_000, 3_000, 4_000, 5_000, 7_000,
  8_000, 8_500, 9_000, 10_000, 12_000,
  13_000, 14_000, 15_000, 18_000, 25_000,
  28_000, 31_000, 34_000, 37_000, 40_000,
  43_000, 46_000, 49_000, 52_000, 55_000,
  58_000, 61_000, 64_000, 67_000, 70_000,
];

export const LEVELS: LevelConfig[] = Array.from({ length: 30 }, (_, idx) => {
  const level = idx + 1;
  const worldIndex = Math.floor(idx / 5);
  const world = WORLD_THEMES[worldIndex];
  const firstSeasonProgress = Math.max(0, Math.min(1, (level - 1) / 13));
  const secondSeasonProgress = Math.max(0, Math.min(1, (level - 16) / 13));
  const isFirstBoss = level === 15;
  const isFinalBoss = level === 30;

  // The first chapter ramps firmly from stage 1. Stage 15 is a distinct boss wall;
  // chapter two starts harder and stage 30 is intentionally the toughest encounter.
  const speedMultiplier = level <= 14
    ? 1.12 + firstSeasonProgress * 0.56
    : isFirstBoss
      ? 2.05
      : isFinalBoss
        ? 4.0
        : 2.20 + secondSeasonProgress * 0.75;
  const spawnIntervalSec = level <= 14
    ? 0.92 - firstSeasonProgress * 0.38
    : isFirstBoss
      ? 0.30
      : isFinalBoss
        ? 0.13
        : 0.28 - secondSeasonProgress * 0.10;
  const obstacleChance = level === 1
    ? 0.16
    : isFirstBoss
      ? 0.54
      : isFinalBoss
        ? 0.68
        : level < 5
          ? 0.14 + ((level - 2) / 2) * 0.06
          : level < 15
            ? 0.24 + ((level - 5) / 9) * 0.20
            : 0.56 + secondSeasonProgress * 0.08;

  const timeOfDayPhase = level === 15 ? 0.91 : Number(((level * 0.317 + (level % 4) * 0.083) % 1).toFixed(3));
  const isNight = timeOfDayPhase < 0.13 || timeOfDayPhase > 0.87;
  const environmentIndex = idx;

  return {
    level,
    worldId: world.id,
    worldName: world.name,
    bgImage: LEVEL_BACKDROPS[environmentIndex],
    tintOverlay: LEVEL_TINTS[environmentIndex],
    isNight,
    particleMode: level === 15 ? 'stars' : world.particleMode,
    timeOfDayPhase,
    weatherMode: level === 15 ? 'winter-storm' : 'clear',
    targetScore: TARGET_SCORES[idx],
    speedMultiplier: Number(speedMultiplier.toFixed(2)),
    spawnIntervalSec: Number(spawnIntervalSec.toFixed(2)),
    obstacleChance: Number(obstacleChance.toFixed(3)),
    windStrength: Number((level <= 14 ? 10 + firstSeasonProgress * 34 : isFirstBoss ? 52 : isFinalBoss ? 105 : 58 + secondSeasonProgress * 42).toFixed(1)),
    secretNote: SECRET_NOTES[idx],
  };
});

export function getLevelConfig(levelNumber: number): LevelConfig {
  const clamped = Math.max(1, Math.min(30, Math.round(levelNumber)));
  return LEVELS[clamped - 1];
}
