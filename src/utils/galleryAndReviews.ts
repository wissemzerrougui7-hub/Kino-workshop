import type { ReviewRecord } from './adminHelpers';

export interface GalleryFrameItem {
  id: string;
  src: string;
  title: string;
  category: 'لوحة كينوسايجا' | 'كواليس الورشة';
  aspectClass: string;
  sizeSpanClass: string;
  offsetClass: string;
  rotationDeg: number;
  stringDropPx: number;
  frameColor: string;
}

export interface ReviewPinVisual {
  pinColor: string;
  pinHighlight: string;
  rotationDeg: number;
  noteBg: string;
  noteBgDark: string;
}

export const GALLERY_WALL_CONTENT = {
  id: 'gallery',
  indexLabel: '٠٤',
  title: 'جدار المعرض',
  subtitleJp: 'ギャラリー壁',
  lead: 'لوحات خدموها أيادي البنات ولقطات من طاولات الورشات، معلّقة على الحيط بالخيط والخشب.',
} as const;

export const REVIEWS_WALL_CONTENT = {
  id: 'reviews',
  indexLabel: '٠٤',
  title: 'وشنو قالو البنات؟',
  subtitleJp: '参加者の声',
  lead: 'كلمات من قلب الورشة و ذكريات البنات اللي جاو وخلّاو بصمتهم، مدبّسين على لوحتنا.',
} as const;

export const GALLERY_WALL_ITEMS: GalleryFrameItem[] = [
  {
    id: 'gallery-succulent-tools',
    src: '/assets/aistudio/6032864214365443104_ad22e835.jpg',
    title: 'لوحة الصبّار الأخضر بأقمشة ملوّنة مع أدوات القص والتثبيت',
    category: 'لوحة كينوسايجا',
    aspectClass: 'aspect-[3/4]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-4',
    offsetClass: 'lg:mt-0',
    rotationDeg: -2.6,
    stringDropPx: 34,
    frameColor: '#6b4e31',
  },
  {
    id: 'gallery-workshop-sunrise-wip',
    src: '/assets/aistudio/6032864214365443107_3284c600.jpg',
    title: 'أجواء الخدمة على الطاولة: قص أقمشة المربعات وتركيب التلال والشمس',
    category: 'كواليس الورشة',
    aspectClass: 'aspect-[4/5]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-5',
    offsetClass: 'lg:mt-10',
    rotationDeg: 2.2,
    stringDropPx: 42,
    frameColor: '#5a4128',
  },
  {
    id: 'gallery-atelier-prep',
    src: '/src/assets/images/kinusaiga_video_poster_1794586751519.jpg',
    title: 'لقطة من طاولة التحضير: اختيار القماش قبل التثبيت في الشقوق',
    category: 'كواليس الورشة',
    aspectClass: 'aspect-[4/3]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-3',
    offsetClass: 'lg:mt-3',
    rotationDeg: -1.8,
    stringDropPx: 28,
    frameColor: '#7a5938',
  },
  {
    id: 'gallery-autumn-leaves',
    src: '/src/assets/images/autumn_kinusaiga_workshop_1794587096606.jpg',
    title: 'لوحة أوراق الخريف بأقمشة قطنية دافية وإطار خشب طبيعي',
    category: 'لوحة كينوسايجا',
    aspectClass: 'aspect-square',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-3',
    offsetClass: 'lg:mt-6',
    rotationDeg: 2.9,
    stringDropPx: 32,
    frameColor: '#6b4e31',
  },
  {
    id: 'gallery-twin-succulents',
    src: '/assets/aistudio/6032864214365443105_33d9c12c.jpg',
    title: 'ثنائي لوحات نباتات منزلية بتدرّجات الأخضر والتراب والكتان',
    category: 'لوحة كينوسايجا',
    aspectClass: 'aspect-[4/5]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-5',
    offsetClass: 'lg:mt-2',
    rotationDeg: -2.1,
    stringDropPx: 38,
    frameColor: '#5a4128',
  },
  {
    id: 'gallery-sun-waves',
    src: '/assets/aistudio/6032864214365443106_38d71dd8.jpg',
    title: 'شروق الشمس بالأصفر والدوامات فوق أمواج من قماش الدنيم',
    category: 'لوحة كينوسايجا',
    aspectClass: 'aspect-[3/4]',
    sizeSpanClass: 'sm:col-span-6 lg:col-span-4',
    offsetClass: 'lg:mt-8',
    rotationDeg: 2.5,
    stringDropPx: 36,
    frameColor: '#7a5938',
  },
];

const PIN_SWATCHES: ReadonlyArray<{
  pinColor: string;
  pinHighlight: string;
  noteBg: string;
  noteBgDark: string;
}> = [
  { pinColor: '#b8322a', pinHighlight: '#f28b82', noteBg: '#fffdf7', noteBgDark: '#263322' },
  { pinColor: '#c2692a', pinHighlight: '#f0b284', noteBg: '#fdfaf0', noteBgDark: '#2b3021' },
  { pinColor: '#55734a', pinHighlight: '#a9bf9c', noteBg: '#f9fbf6', noteBgDark: '#212e20' },
  { pinColor: '#d4607f', pinHighlight: '#f5b3c6', noteBg: '#fff9fb', noteBgDark: '#2c2529' },
  { pinColor: '#d9a014', pinHighlight: '#fae08c', noteBg: '#fffdf2', noteBgDark: '#2a2d1e' },
];

const NOTE_ROTATIONS = [-2.4, 2.1, -1.6, 2.5, -2.0, 1.7] as const;

export function getReviewNoteVisuals(index: number): ReviewPinVisual {
  const safeIdx = Math.abs(Math.floor(index));
  const pin = PIN_SWATCHES[safeIdx % PIN_SWATCHES.length];
  const rotationDeg = NOTE_ROTATIONS[safeIdx % NOTE_ROTATIONS.length];
  return {
    pinColor: pin.pinColor,
    pinHighlight: pin.pinHighlight,
    rotationDeg,
    noteBg: pin.noteBg,
    noteBgDark: pin.noteBgDark,
  };
}

export const STARTER_APPROVED_REVIEWS: ReviewRecord[] = [
  {
    id: 'starter-review-1',
    name: 'ياسمين ب.',
    text: 'أول مرة نجرب الكينوسايجا وخرجت بلوحة للدار ما صدقتش بلي خدمتها بيدي! القعدة هادية والمرافقة تشرح خطوة بخطوة.',
    photo: '/assets/aistudio/6032864214365443106_38d71dd8.jpg',
    approved: true,
    createdAtText: 'من ورشة سابقة',
    createdAtMs: 3,
  },
  {
    id: 'starter-review-2',
    name: 'مريم م.',
    text: 'تنساي التليفون والستراس تاع الأسبوع كامل، وتبقاي غير تقطعي في القماش وتنسقي الألوان مع صحباتك ومع كاس أتاي دافي.',
    photo: '/assets/aistudio/6032864214365443104_ad22e835.jpg',
    approved: true,
    createdAtText: 'من ورشة سابقة',
    createdAtMs: 2,
  },
  {
    id: 'starter-review-3',
    name: 'نور الهدى',
    text: 'بلا خياطة وبلا إبرة وتخرج النتيجة ناعمة ومرتبة بزاف. أكيد نرجع للورشة الجاية مع ختي.',
    photo: '/assets/aistudio/6032864214365443105_33d9c12c.jpg',
    approved: true,
    createdAtText: 'من ورشة سابقة',
    createdAtMs: 1,
  },
];

export interface PublicReviewValidationErrors {
  name?: string;
  text?: string;
}

export function validatePublicReviewForm(input: {
  name: string;
  text: string;
}): PublicReviewValidationErrors {
  const errors: PublicReviewValidationErrors = {};
  const trimmedName = input.name.trim();
  const trimmedText = input.text.trim();

  if (trimmedName.length < 2 || trimmedName.length > 80) {
    errors.name = 'اكتبي اسمك (من حرفين على الأقل) باش نكتبوه تحت الملاحظة';
  }
  if (trimmedText.length < 2 || trimmedText.length > 1000) {
    errors.text = 'اكتبي رأيك في الورشة ولو في سطرين';
  }

  return errors;
}
