export type WorkshopThemeId = 'forest' | 'autumn' | 'sakura' | 'sun';

export interface WorkshopTheme {
  id: WorkshopThemeId;
  labelAr: string;
  labelJp: string;
  accentHex: string;
  accentSoftHex: string;
  threadContrastHex: string;
}

export interface WorkshopSlot {
  id: string;
  weekday: string;
  dayNumber: string;
  month: string;
  time: string;
}

export interface WorkshopConfig {
  id: string;
  title: string;
  themeName: string;
  themeKey: WorkshopThemeId;
  description: string;
  seatsLeft: number;
  imageSrc: string;
  imageAlt: string;
  locationName?: string;
  locationMapsUrl?: string;
  slots: readonly [WorkshopSlot, WorkshopSlot];
}

export interface NavLinkItem {
  id: string;
  href: string;
  label: string;
}

export interface SectionShellSlot {
  id: string;
  indexLabel: string;
  title: string;
  subtitleJp: string;
  fabricBg: string;
  fabricTone: 'light' | 'sage' | 'forest' | 'cream';
  seigaiha: boolean;
}

export interface PetalSpec {
  id: number;
  leftPercent: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  driftPx: number;
  spinDeg: number;
  opacity: number;
}

export const KINO_LOGO_SRC = '/assets/aistudio/6032864214365442981_c4dd4344.jpg';

export const KINO_INSTAGRAM = {
  handle: '@kino__workshop',
  url: 'https://www.instagram.com/kino__workshop?srtk=OTJhNHhwOTI1c2Ez',
} as const;

export const KINO_PALETTE = {
  greenDeep: '#2d3f27',
  greenBase: '#3a4f32',
  greenLeaf: '#55734a',
  greenSage: '#a9bf9c',
  cream: '#faf9f5',
  hankoRed: '#b8322a',
  woodDark: '#4a3520',
  woodMid: '#6b4e31',
} as const;

export const WORKSHOP_THEMES: Record<WorkshopThemeId, WorkshopTheme> = {
  forest: {
    id: 'forest',
    labelAr: 'غابة',
    labelJp: '森',
    accentHex: '#55734a',
    accentSoftHex: '#dce6d6',
    threadContrastHex: '#faf9f5',
  },
  autumn: {
    id: 'autumn',
    labelAr: 'خريف',
    labelJp: '紅葉',
    accentHex: '#c2692a',
    accentSoftHex: '#f5e1d2',
    threadContrastHex: '#faf9f5',
  },
  sakura: {
    id: 'sakura',
    labelAr: 'ساكورا',
    labelJp: '桜',
    accentHex: '#d4607f',
    accentSoftHex: '#f6dce4',
    threadContrastHex: '#faf9f5',
  },
  sun: {
    id: 'sun',
    labelAr: 'دوار الشمس',
    labelJp: '向日葵',
    accentHex: '#d9a014',
    accentSoftHex: '#f8ecd0',
    threadContrastHex: '#2d3f27',
  },
};

export function formatSeatsLeft(seatsLeft: number): string {
  return `باقيين ${seatsLeft} بلايص`;
}

export const CURRENT_WORKSHOP: WorkshopConfig = {
  id: 'workshops',
  title: 'ورشة الخريف',
  themeName: 'ثيم الخريف',
  themeKey: 'autumn',
  description:
    'في هاد الورشة نخدمو مع بعض لوحة مستوحاة من ألوان الخريف الدافية، بأقمشة ناعمة وأجواء هادية بين صحباتك، وتخرجي بلوحتك مؤطّرة للدار.',
  seatsLeft: 12,
  imageSrc: '/assets/images/autumn_kinusaiga_workshop_1794587096606.jpg',
  imageAlt: 'لوحة ورشة الخريف بفن الكينوسايغا بأوراق القيقب البرتقالية والذهبية',
  locationName: 'عنابة — وسط المدينة',
  locationMapsUrl: 'https://maps.google.com/?q=Annaba,Algeria',
  slots: [
    {
      id: 'slot-sat-21',
      weekday: 'السبت',
      dayNumber: '21',
      month: 'نوفمبر',
      time: '4:00 مساءً',
    },
    {
      id: 'slot-fri-27',
      weekday: 'الجمعة',
      dayNumber: '27',
      month: 'نوفمبر',
      time: '10:00 صباحاً',
    },
  ],
};

export const HEADER_NAV_LINKS: NavLinkItem[] = [
  { id: 'hero', href: '#hero', label: 'الرئيسية' },
  { id: 'story', href: '#story', label: 'حكاية الفن' },
  { id: 'workshops', href: '#workshops', label: 'الورشات' },
  { id: 'try', href: '#try', label: 'جرّبي الفن' },
  { id: 'reserve', href: '#reserve', label: 'سجلي معانا' },
];

export const INTRO_VIDEO_URL =
  '/assets/aistudio/video6032864213905454358_61c01e10.mp4';

export const INTRO_ASSETS = {
  lighthouseSrc: '/assets/images/lighthouse_kinusaiga_1794586750826.jpg',
  japanCircleSrc: '/assets/images/japan_craft_circle_1794586751846.jpg',
  videoPosterSrc: '/assets/images/kinusaiga_video_poster_1794586751519.jpg',
} as const;

export const INTRO_CONTENT = {
  id: 'story',
  indexLabel: '٠١',
  subtitleJp: '木目込みの物語',
  title: 'وشنو هي الكينوسايجا؟',
  body: 'فن ياباني يخليك تصنعي لوحة فنية بقطع قماش صغيرة! بلا خياطة، بلا إبرة، وبلا ما تعرفي ترسمي.',
  steps: [
    'تخيري لون ونوع الرسمة',
    'نوفرولك المستلزمات وتقصّي القماش وتحطّيه في الشقوق',
    'نأطّرو اللوحة وتخرجي بتحفة من إبداعك',
  ] as const,
  videoCaption: 'شوفي كيفاش تتصنع لوحة كينوسايجا',
} as const;

export const SHELL_SECTIONS: SectionShellSlot[] = [
  {
    id: 'gallery',
    indexLabel: '٠٤',
    title: 'أعمال البنات',
    subtitleJp: '布と木の調和',
    fabricBg: '#eef2ea',
    fabricTone: 'sage',
    seigaiha: true,
  },
];

export type HillPatternId = 'dots' | 'gingham' | 'circles' | 'stripes';

export interface HeroHillLayer {
  id: string;
  patternId: HillPatternId;
  baseColor: string;
  patternStroke: string;
  stitchColor: string;
  scrollParallaxPx: number;
  pathD: string;
  stitchD: string;
}

export const KINO_GIRL_ARCH_SRC = '/assets/images/kino_girl_arch_1794586132755.jpg';

export function normalizePublicAssetPath(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/assets/images/');
  }
  return trimmed;
}

export const HERO_CONTENT = {
  jpKicker: 'キノサイガ',
  h1: 'ورشات الكينوسايجا',
  primaryCta: 'شوفي الورشة الجاية',
  secondaryCta: 'جرّبي الفن دوكا',
} as const;

export const HERO_HILL_LAYERS: HeroHillLayer[] = [
  {
    id: 'hill-dots',
    patternId: 'dots',
    baseColor: '#a9bf9c',
    patternStroke: '#55734a',
    stitchColor: '#faf9f5',
    scrollParallaxPx: 14,
    pathD: 'M0,104 C210,48 420,136 690,82 C960,28 1210,118 1440,68 L1440,340 L0,340 Z',
    stitchD: 'M0,112 C210,56 420,144 690,90 C960,36 1210,126 1440,76',
  },
  {
    id: 'hill-gingham',
    patternId: 'gingham',
    baseColor: '#55734a',
    patternStroke: '#a9bf9c',
    stitchColor: '#faf9f5',
    scrollParallaxPx: 28,
    pathD: 'M0,146 C260,188 510,96 810,142 C1080,184 1260,112 1440,136 L1440,340 L0,340 Z',
    stitchD: 'M0,154 C260,196 510,104 810,150 C1080,192 1260,120 1440,144',
  },
  {
    id: 'hill-circles',
    patternId: 'circles',
    baseColor: '#3a4f32',
    patternStroke: '#a9bf9c',
    stitchColor: '#a9bf9c',
    scrollParallaxPx: 44,
    pathD: 'M0,192 C240,148 490,224 760,182 C1040,138 1250,212 1440,174 L1440,340 L0,340 Z',
    stitchD: 'M0,200 C240,156 490,232 760,190 C1040,146 1250,220 1440,182',
  },
  {
    id: 'hill-stripes',
    patternId: 'stripes',
    baseColor: '#2d3f27',
    patternStroke: '#55734a',
    stitchColor: '#faf9f5',
    scrollParallaxPx: 62,
    pathD: 'M0,236 C280,268 560,198 860,238 C1130,274 1290,216 1440,234 L1440,340 L0,340 Z',
    stitchD: 'M0,244 C280,276 560,206 860,246 C1130,282 1290,224 1440,242',
  },
];

export function getWorkshopTheme(id: WorkshopThemeId): WorkshopTheme {
  return WORKSHOP_THEMES[id] ?? WORKSHOP_THEMES.sakura;
}

export function getThemeCssVars(id: WorkshopThemeId): Record<string, string> {
  const theme = getWorkshopTheme(id);
  return {
    '--kino-accent': theme.accentHex,
    '--kino-accent-soft': theme.accentSoftHex,
    '--kino-accent-contrast': theme.threadContrastHex,
  };
}

/**
 * Generates deterministic falling sakura petals so SSR/renders and tests stay predictable.
 */
export function generatePetalSpecs(count: number): PetalSpec[] {
  const safeCount = Math.max(0, Math.min(24, Math.floor(count)));
  const petals: PetalSpec[] = [];
  for (let i = 0; i < safeCount; i++) {
    const seed = (i * 37 + 13) % 100;
    const alt = (i * 53 + 7) % 100;
    petals.push({
      id: i,
      leftPercent: 4 + ((i * 92) / Math.max(1, safeCount)) + (seed % 5) - 2,
      sizePx: 11 + (seed % 8),
      durationSec: 11 + (alt % 8),
      delaySec: -((i * 1.9) % 14),
      driftPx: (i % 2 === 0 ? -1 : 1) * (24 + (seed % 34)),
      spinDeg: (i % 2 === 0 ? 1 : -1) * (160 + (alt % 180)),
      opacity: 0.45 + (seed % 30) / 100,
    });
  }
  return petals;
}
