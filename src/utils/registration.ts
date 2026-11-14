import { CURRENT_WORKSHOP } from './theme';

export type ArtworkChoice = 'hand-draw' | 'upload-image' | 'surprise-me';

export interface ArtworkTileOption {
  id: ArtworkChoice;
  title: string;
  hint: string;
}

export const ARTWORK_TILE_OPTIONS: ArtworkTileOption[] = [
  {
    id: 'hand-draw',
    title: 'نرسم لوحتي بيدي',
    hint: 'تجي للورشة بفكرتك ونعاونوك ترسميها على الخشب.',
  },
  {
    id: 'upload-image',
    title: 'نبعث صورة',
    hint: 'ارفعي الصورة اللي عجبتك ونحضّرولك الشقوق تاعها.',
  },
  {
    id: 'surprise-me',
    title: 'فاجئوني',
    hint: 'نختارولك تصميم كينوسايغا عشوائي ومميز نهار الورشة.',
  },
];

export const SURPRISE_ARTWORK_TITLES = [
  'زهرة الساكورا الربيعية',
  'منارة البحر والغيوم',
  'أوراق القيقب الخريفية',
  'مروحة الحرير اليابانية',
] as const;

export interface RegistrationFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  instagram: string;
  gmail: string;
  selectedSlotIds: string[];
  artworkChoice: ArtworkChoice;
  artworkFileName: string | null;
}

export type RegistrationFieldKey =
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'instagram'
  | 'gmail'
  | 'selectedSlotIds'
  | 'artworkFile';

export type RegistrationErrors = Partial<Record<RegistrationFieldKey, string>>;

export function normalizePhoneInput(raw: string): string {
  return raw.replace(/[\s\-().]/g, '').trim();
}

export function isValidPhone(raw: string): boolean {
  const cleaned = normalizePhoneInput(raw);
  // Accepts Algerian mobile/landline (05/06/07/02/03/04..., +213...) or standard international 9-15 digit numbers
  return /^(?:\+?213[567234]\d{8}|0[567234]\d{8}|\+?\d{9,15})$/.test(cleaned);
}

export function normalizeInstagramHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '');
}

export function isValidInstagramHandle(raw: string): boolean {
  const handle = normalizeInstagramHandle(raw);
  return /^[a-zA-Z0-9._]{2,30}$/.test(handle) && !handle.endsWith('.');
}

export function isValidEmailAddress(raw: string): boolean {
  const trimmed = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function validateRegistrationForm(
  values: RegistrationFormValues,
  allowedSlotIds: string[] = CURRENT_WORKSHOP.slots.map((s) => s.id)
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (values.firstName.trim().length < 2) {
    errors.firstName = 'اكتبي اسمك من فضلك';
  }

  if (values.lastName.trim().length < 2) {
    errors.lastName = 'اكتبي اللقب من فضلك';
  }

  if (!values.phone.trim()) {
    errors.phone = 'اكتبي رقم الهاتف من فضلك';
  } else if (!isValidPhone(values.phone)) {
    errors.phone = 'رقم الهاتف غير صحيح (مثلاً 0550123456)';
  }

  if (!values.instagram.trim()) {
    errors.instagram = 'اكتبي حساب Instagram من فضلك';
  } else if (!isValidInstagramHandle(values.instagram)) {
    errors.instagram = 'حساب Instagram لازم يكون صحيح بدون مسافات';
  }

  if (!values.gmail.trim()) {
    errors.gmail = 'اكتبي بريدك Gmail من فضلك';
  } else if (!isValidEmailAddress(values.gmail)) {
    errors.gmail = 'اكتبي عنوان Gmail صحيح (مثلاً name@gmail.com)';
  }

  const validSlotIdSet = new Set(allowedSlotIds);
  const validChosenSlots = values.selectedSlotIds.filter((id) =>
    validSlotIdSet.has(id)
  );
  if (validChosenSlots.length === 0) {
    errors.selectedSlotIds = 'اختاري موعد واحد على الأقل من الورشة';
  }

  if (values.artworkChoice === 'upload-image' && !values.artworkFileName) {
    errors.artworkFile = 'ارفعي صورة اللوحة اللي حابّة تخدميها';
  }

  return errors;
}

export function toggleWorkshopSlotSelection(
  currentSlotIds: string[],
  slotId: string
): string[] {
  if (currentSlotIds.includes(slotId)) {
    return currentSlotIds.filter((id) => id !== slotId);
  }
  return [...currentSlotIds, slotId];
}

export function pickRandomSurpriseArtwork(
  rng: () => number = Math.random
): string {
  const idx =
    Math.floor(rng() * SURPRISE_ARTWORK_TITLES.length) %
    SURPRISE_ARTWORK_TITLES.length;
  return SURPRISE_ARTWORK_TITLES[idx];
}

export function formatRegistrationSuccessMessage(firstName: string): string {
  const cleanName = firstName.trim();
  return `شكراً ${cleanName}! وصلنا طلبك. نتواصلو معاك مني نأكدو الموعد`;
}
