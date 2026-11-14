import type { GalleryFrameItem } from './galleryAndReviews';
import { sanitizeSlotId } from './adminHelpers';
import {
  INTRO_ASSETS,
  KINO_GIRL_ARCH_SRC,
  KINO_LOGO_SRC,
  normalizePublicAssetPath,
} from './theme';

export const SITE_ASSETS_COLLECTION = 'site_assets';
export const GALLERY_ITEMS_COLLECTION = 'gallery_items';
export const GALLERY_SEEDED_KEY = 'gallery-seeded';

export type SiteAssetKey =
  | 'hero-girl'
  | 'logo'
  | 'intro-lighthouse'
  | 'intro-japan-circle'
  | 'intro-video-poster'
  | 'review-starter-1'
  | 'review-starter-2'
  | 'review-starter-3';

export interface SiteAssetSlotMeta {
  key: SiteAssetKey;
  label: string;
  sectionHint: string;
  defaultSrc: string;
  defaultAlt: string;
}

export interface SiteAssetRecord {
  key: SiteAssetKey;
  label: string;
  src: string;
  alt: string;
  isCustom: boolean;
}

export type SiteAssetsMap = Record<SiteAssetKey, SiteAssetRecord>;

export interface EditableGalleryFrameItem extends GalleryFrameItem {
  orderIndex: number;
}

export const SITE_ASSET_SLOTS: readonly SiteAssetSlotMeta[] = [
  {
    key: 'hero-girl',
    label: 'صورة القوس في الواجهة الرئيسية',
    sectionHint: 'تظهر داخل الإطار المقوّس أعلى الصفحة الرئيسية',
    defaultSrc: KINO_GIRL_ARCH_SRC,
    defaultAlt: 'لوحة فتاة الكينوسايجا مع أزهار الوستيريا والمروحة',
  },
  {
    key: 'logo',
    label: 'شعار Kino',
    sectionHint: 'يظهر في شاشة التحميل، الشريط العلوي، الواجهة الرئيسية، وأسفل الصفحة',
    defaultSrc: KINO_LOGO_SRC,
    defaultAlt: 'شعار ورشات كينو Kino',
  },
  {
    key: 'intro-lighthouse',
    label: 'صورة الإطار الخشبي المعلّق (المنارة)',
    sectionHint: 'تظهر في قسم «وشنو هي الكينوسايجا؟» داخل الإطار المائل',
    defaultSrc: INTRO_ASSETS.lighthouseSrc,
    defaultAlt: 'لوحة منارة بحرية مصنوعة بفن الكينوسايغا داخل إطار خشبي',
  },
  {
    key: 'intro-japan-circle',
    label: 'الصورة الدائرية الصغيرة (الحرفية اليابانية)',
    sectionHint: 'تظهر بشكل دائري في ركن الإطار المائل بقسم التعريف',
    defaultSrc: INTRO_ASSETS.japanCircleSrc,
    defaultAlt: 'مشهد تقليدي للحرفية اليابانية وأقمشة الكيمونو',
  },
  {
    key: 'intro-video-poster',
    label: 'صورة غلاف الفيديو التعريفي (بالطول 9:16)',
    sectionHint: 'تظهر قبل الضغط على زر تشغيل الفيديو في قسم التعريف',
    defaultSrc: INTRO_ASSETS.videoPosterSrc,
    defaultAlt: 'لقطة تحضير لوحة كينوسايغا بالقماش والخشب',
  },
  {
    key: 'review-starter-1',
    label: 'صورة رأي المشاركة ١ (ياسمين ب.)',
    sectionHint: 'تظهر في بطاقة الرأي الأولى في قسم «وشنو قالو البنات؟»',
    defaultSrc: '/assets/aistudio/6032864214365443106_38d71dd8.jpg',
    defaultAlt: 'لوحة من ورشة كينو للمشاركة ياسمين ب.',
  },
  {
    key: 'review-starter-2',
    label: 'صورة رأي المشاركة ٢ (مريم م.)',
    sectionHint: 'تظهر في بطاقة الرأي الثانية في قسم «وشنو قالو البنات؟»',
    defaultSrc: '/assets/aistudio/6032864214365443104_ad22e835.jpg',
    defaultAlt: 'لوحة من ورشة كينو للمشاركة مريم م.',
  },
  {
    key: 'review-starter-3',
    label: 'صورة رأي المشاركة ٣ (نور الهدى)',
    sectionHint: 'تظهر في بطاقة الرأي الثالثة في قسم «وشنو قالو البنات؟»',
    defaultSrc: '/assets/aistudio/6032864214365443105_33d9c12c.jpg',
    defaultAlt: 'لوحة من ورشة كينو للمشاركة نور الهدى',
  },
] as const;

const VALID_ASSET_KEYS = new Set<SiteAssetKey>(
  SITE_ASSET_SLOTS.map((slot) => slot.key)
);

export function getDefaultSiteAssetsMap(): SiteAssetsMap {
  const map = {} as SiteAssetsMap;
  for (const slot of SITE_ASSET_SLOTS) {
    map[slot.key] = {
      key: slot.key,
      label: slot.label,
      src: slot.defaultSrc,
      alt: slot.defaultAlt,
      isCustom: false,
    };
  }
  return map;
}

export function mergeSiteAssets(
  docs: ReadonlyArray<Record<string, unknown>>
): {
  assets: SiteAssetsMap;
  gallerySeeded: boolean;
} {
  const assets = getDefaultSiteAssetsMap();
  let gallerySeeded = false;

  for (const docData of docs) {
    const rawKey = typeof docData.key === 'string' ? docData.key.trim() : '';
    if (rawKey === GALLERY_SEEDED_KEY) {
      gallerySeeded = true;
      continue;
    }
    if (!VALID_ASSET_KEYS.has(rawKey as SiteAssetKey)) continue;
    const key = rawKey as SiteAssetKey;
    const rawSrc = typeof docData.src === 'string' ? docData.src.trim() : '';
    const src = normalizePublicAssetPath(rawSrc);
    if (!src) continue;
    const defaultEntry = assets[key];
    const alt =
      typeof docData.alt === 'string' && docData.alt.trim().length > 0
        ? docData.alt.trim().slice(0, 300)
        : defaultEntry.alt;
    const label =
      typeof docData.label === 'string' && docData.label.trim().length > 0
        ? docData.label.trim().slice(0, 120)
        : defaultEntry.label;

    assets[key] = {
      key,
      label,
      src: src.slice(0, 350000),
      alt,
      isCustom: true,
    };
  }

  return { assets, gallerySeeded };
}

export function sanitizeSiteAssetPayload(input: {
  key: SiteAssetKey;
  label?: string;
  src: string;
  alt?: string;
}): {
  key: SiteAssetKey;
  label: string;
  src: string;
  alt: string;
} {
  const meta =
    SITE_ASSET_SLOTS.find((s) => s.key === input.key) ?? SITE_ASSET_SLOTS[0];
  const src = normalizePublicAssetPath(input.src).slice(0, 350000) || meta.defaultSrc;
  const label = (input.label ?? meta.label).trim().slice(0, 120) || meta.label;
  const alt = (input.alt ?? meta.defaultAlt).trim().slice(0, 300);

  return {
    key: meta.key,
    label,
    src,
    alt,
  };
}

export const GALLERY_FRAME_PRESETS: ReadonlyArray<{
  aspectClass: string;
  sizeSpanClass: string;
  offsetClass: string;
  rotationDeg: number;
  stringDropPx: number;
  frameColor: string;
}> = [
  {
    aspectClass: 'aspect-[3/4]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-4',
    offsetClass: 'lg:mt-0',
    rotationDeg: -2.4,
    stringDropPx: 34,
    frameColor: '#6b4e31',
  },
  {
    aspectClass: 'aspect-[4/5]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-5',
    offsetClass: 'lg:mt-8',
    rotationDeg: 2.1,
    stringDropPx: 40,
    frameColor: '#5a4128',
  },
  {
    aspectClass: 'aspect-square',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-3',
    offsetClass: 'lg:mt-3',
    rotationDeg: -1.8,
    stringDropPx: 30,
    frameColor: '#7a5938',
  },
];

export function getGalleryFramePreset(index: number) {
  const safeIdx = Math.abs(Math.floor(index));
  return GALLERY_FRAME_PRESETS[safeIdx % GALLERY_FRAME_PRESETS.length];
}

export function sanitizeGalleryItemPayload(
  input: Partial<EditableGalleryFrameItem> & {
    id: string;
    src: string;
    title: string;
  },
  fallbackOrderIndex = 0
): EditableGalleryFrameItem {
  const preset = getGalleryFramePreset(fallbackOrderIndex);
  const category: GalleryFrameItem['category'] =
    input.category === 'كواليس الورشة' ? 'كواليس الورشة' : 'لوحة كينوسايجا';

  const rawRot = Number(input.rotationDeg);
  const rotationDeg = Number.isFinite(rawRot)
    ? Math.max(-12, Math.min(12, rawRot))
    : preset.rotationDeg;

  const rawDrop = Number(input.stringDropPx);
  const stringDropPx = Number.isFinite(rawDrop)
    ? Math.round(Math.max(12, Math.min(80, rawDrop)))
    : preset.stringDropPx;

  const rawOrder = Number(input.orderIndex);
  const orderIndex = Number.isFinite(rawOrder)
    ? Math.round(Math.max(0, Math.min(500, rawOrder)))
    : Math.max(0, Math.min(500, Math.round(fallbackOrderIndex)));

  return {
    id: sanitizeSlotId(input.id, `gallery-item-${orderIndex + 1}`),
    src: normalizePublicAssetPath(input.src).slice(0, 350000),
    title:
      input.title.trim().slice(0, 200) || 'لوحة كينوسايجا من الورشة',
    category,
    aspectClass:
      (input.aspectClass ?? preset.aspectClass).trim().slice(0, 40) ||
      preset.aspectClass,
    sizeSpanClass:
      (input.sizeSpanClass ?? preset.sizeSpanClass).trim().slice(0, 60) ||
      preset.sizeSpanClass,
    offsetClass: (input.offsetClass ?? preset.offsetClass).trim().slice(0, 40),
    rotationDeg,
    stringDropPx,
    frameColor:
      (input.frameColor ?? preset.frameColor).trim().slice(0, 20) || '#6b4e31',
    orderIndex,
  };
}
