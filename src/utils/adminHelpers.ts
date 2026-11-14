import type { ArtworkChoice } from './registration';
import {
  WORKSHOP_THEMES,
  type WorkshopConfig,
  type WorkshopSlot,
  type WorkshopThemeId,
} from './theme';

export const WORKSHOP_COLLECTION = 'workshop';
export const WORKSHOP_DOC_ID = 'current';
export const REGISTRATIONS_COLLECTION = 'registrations';
export const REVIEWS_COLLECTION = 'reviews';

export interface RegistrationRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  instagram: string;
  gmail: string;
  workshopTitle: string;
  selectedSlotIds: string[];
  selectedSlotLabels: string[];
  artworkChoice: ArtworkChoice;
  artworkNote?: string;
  uploadedImageUrl: string;
  createdAtText: string;
  createdAtMs: number;
}

export interface ReviewRecord {
  id: string;
  name: string;
  text: string;
  photo: string;
  approved: boolean;
  createdAtText: string;
  createdAtMs?: number;
}

export interface SlotRegistrationCount {
  slotId: string;
  label: string;
  count: number;
}

export function computeSlotCounts(
  registrations: RegistrationRecord[],
  slots: readonly [WorkshopSlot, WorkshopSlot]
): SlotRegistrationCount[] {
  return slots.map((slot) => {
    const count = registrations.reduce((acc, reg) => {
      return acc + (reg.selectedSlotIds.includes(slot.id) ? 1 : 0);
    }, 0);
    return {
      slotId: slot.id,
      label: `${slot.weekday} ${slot.dayNumber} ${slot.month} · ${slot.time}`,
      count,
    };
  });
}

function escapeCsvCell(value: string): string {
  const safe = String(value ?? '').replace(/\r?\n/g, ' ');
  if (/[",]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function getArtworkChoiceLabel(choice: ArtworkChoice): string {
  switch (choice) {
    case 'hand-draw':
      return 'نرسم لوحتي بيدي';
    case 'upload-image':
      return 'نبعث صورة';
    case 'surprise-me':
      return 'فاجئوني';
  }
}

export function generateRegistrationsCsv(
  registrations: RegistrationRecord[]
): string {
  const headers = [
    'الاسم',
    'اللقب',
    'رقم الهاتف',
    'Instagram',
    'Gmail',
    'الورشة',
    'المواعيد المختارة',
    'اختيار اللوحة',
    'ملاحظة اللوحة',
    'رابط الصورة المرفوعة',
    'تاريخ التسجيل',
  ];

  const rows = registrations.map((reg) => [
    reg.firstName,
    reg.lastName,
    reg.phone,
    reg.instagram,
    reg.gmail,
    reg.workshopTitle,
    reg.selectedSlotLabels.join(' | '),
    getArtworkChoiceLabel(reg.artworkChoice),
    reg.artworkNote ?? '',
    reg.uploadedImageUrl,
    reg.createdAtText,
  ]);

  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvCell).join(',')
  );

  // Prefix UTF-8 BOM so Excel displays Arabic Darija text cleanly
  return `\uFEFF${lines.join('\n')}`;
}

export function sanitizeSlotId(raw: string, fallback: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
  return cleaned.length > 0 ? cleaned.slice(0, 64) : fallback;
}

export function sanitizeGoogleMapsUrl(raw: unknown): string {
  const trimmed = String(raw ?? '').trim().slice(0, 500);
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString().slice(0, 500);
    }
    return '';
  } catch {
    return '';
  }
}

export function sanitizeWorkshopPayload(
  input: WorkshopConfig
): WorkshopConfig {
  const safeThemeKey: WorkshopThemeId =
    input.themeKey in WORKSHOP_THEMES ? input.themeKey : 'autumn';
  const safeSeats = Math.max(
    0,
    Math.min(200, Math.round(Number(input.seatsLeft) || 0))
  );

  const sanitizeSlot = (slot: WorkshopSlot, idx: number): WorkshopSlot => ({
    id: sanitizeSlotId(slot.id, `slot-${idx + 1}`),
    weekday: slot.weekday.trim().slice(0, 40) || 'السبت',
    dayNumber: slot.dayNumber.trim().slice(0, 10) || '1',
    month: slot.month.trim().slice(0, 40) || 'نوفمبر',
    time: slot.time.trim().slice(0, 40) || '4:00 مساءً',
  });

  return {
    id: sanitizeSlotId(input.id || 'workshops', 'workshops'),
    title: input.title.trim().slice(0, 120) || 'ورشة كينو',
    themeName:
      input.themeName.trim().slice(0, 80) ||
      `ثيم ${WORKSHOP_THEMES[safeThemeKey].labelAr}`,
    themeKey: safeThemeKey,
    description: input.description.trim().slice(0, 1000) || 'ورشة فنية مميزة.',
    seatsLeft: safeSeats,
    imageSrc:
      input.imageSrc.trim().slice(0, 350000) ||
      '/src/assets/images/autumn_kinusaiga_workshop_1794587096606.jpg',
    imageAlt:
      (input.imageAlt || input.title).trim().slice(0, 300) ||
      'لوحة ورشة كينو',
    locationName: String(input.locationName ?? '').trim().slice(0, 160),
    locationMapsUrl: sanitizeGoogleMapsUrl(input.locationMapsUrl),
    slots: [
      sanitizeSlot(input.slots[0], 0),
      sanitizeSlot(input.slots[1], 1),
    ],
  };
}

/**
 * Compresses a user-selected image File into a lightweight JPEG data URL (< 280KB)
 * so it renders crisply in /admin and satisfies Firestore's 1MB document ceiling.
 */
export async function compressImageFileToDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('تعذّرت قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });

  if (typeof document === 'undefined') {
    return rawDataUrl.slice(0, 340000);
  }

  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 680;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl.slice(0, 340000));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let compressed = canvas.toDataURL('image/jpeg', 0.75);
      if (compressed.length > 280000) {
        compressed = canvas.toDataURL('image/jpeg', 0.52);
      }
      resolve(compressed);
    };
    img.onerror = () => resolve(rawDataUrl.slice(0, 340000));
    img.src = rawDataUrl;
  });
}
