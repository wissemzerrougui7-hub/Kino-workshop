import type { WorkshopSlot } from './theme';

export interface CalendarDayCell {
  key: string;
  dayNumber: number | null;
  isCurrentMonth: boolean;
  slot: WorkshopSlot | null;
}

export interface WorkshopMonthView {
  year: number;
  monthIndex: number; // 0-11
  monthNameAr: string;
  monthLabelJp: string;
  cells: CalendarDayCell[];
  availableSlotCountInMonth: number;
}

export interface CalendarWeekdayHeader {
  dayOfWeek: number; // 0=Sun..6=Sat
  shortAr: string;
  fullAr: string;
}

/** Saturday-first week matching Algerian weekend/workshop rhythm */
export const CALENDAR_WEEKDAYS: readonly CalendarWeekdayHeader[] = [
  { dayOfWeek: 6, shortAr: 'سبت', fullAr: 'السبت' },
  { dayOfWeek: 0, shortAr: 'أحد', fullAr: 'الأحد' },
  { dayOfWeek: 1, shortAr: 'إثن', fullAr: 'الإثنين' },
  { dayOfWeek: 2, shortAr: 'ثلا', fullAr: 'الثلاثاء' },
  { dayOfWeek: 3, shortAr: 'أرب', fullAr: 'الأربعاء' },
  { dayOfWeek: 4, shortAr: 'خمي', fullAr: 'الخميس' },
  { dayOfWeek: 5, shortAr: 'جمع', fullAr: 'الجمعة' },
];

export const ARABIC_MONTH_NAMES: readonly string[] = [
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان',
  'جويلية',
  'أوت',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const MONTH_ALIASES: Record<string, number> = {
  جانفي: 0,
  يناير: 0,
  فيفري: 1,
  فبراير: 1,
  مارس: 2,
  أفريل: 3,
  ابريل: 3,
  إبريل: 3,
  ماي: 4,
  مايو: 4,
  جوان: 5,
  يونيو: 5,
  جويلية: 6,
  يوليو: 6,
  أوت: 7,
  اوت: 7,
  أغسطس: 7,
  اغسطس: 7,
  سبتمبر: 8,
  أكتوبر: 9,
  اكتوبر: 9,
  نوفمبر: 10,
  ديسمبر: 11,
};

const WEEKDAY_ALIASES: Record<string, number> = {
  الأحد: 0,
  الاحد: 0,
  الإثنين: 1,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الاربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

export function normalizeDigits(input: string): string {
  const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
  return input.replace(/[٠-٩]/g, (ch) => String(arabicIndic.indexOf(ch)));
}

export function parseSlotDayNumber(dayStr: string): number | null {
  const parsed = Number.parseInt(normalizeDigits(dayStr).trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) return null;
  return parsed;
}

export function parseArabicMonthIndex(monthStr: string): number | null {
  const cleaned = monthStr.trim();
  if (cleaned in MONTH_ALIASES) {
    return MONTH_ALIASES[cleaned];
  }
  return null;
}

export function parseArabicWeekdayIndex(weekdayStr: string): number | null {
  const cleaned = weekdayStr.trim();
  if (cleaned in WEEKDAY_ALIASES) {
    return WEEKDAY_ALIASES[cleaned];
  }
  return null;
}

/**
 * Resolves the initial (year, monthIndex) to display for a workshop's slots,
 * matching the slot's weekday near referenceYear so calendar columns line up accurately.
 */
export function resolveWorkshopInitialMonth(
  slots: readonly WorkshopSlot[],
  referenceYear = 2026
): { year: number; monthIndex: number } {
  const firstValid = slots.find(
    (s) =>
      parseArabicMonthIndex(s.month) !== null &&
      parseSlotDayNumber(s.dayNumber) !== null
  );
  if (!firstValid) {
    return { year: referenceYear, monthIndex: 10 };
  }

  const monthIndex = parseArabicMonthIndex(firstValid.month) ?? 10;
  const day = parseSlotDayNumber(firstValid.dayNumber) ?? 1;
  const targetWeekday = parseArabicWeekdayIndex(firstValid.weekday);

  if (targetWeekday !== null) {
    const candidates = [referenceYear, referenceYear + 1, referenceYear - 1, referenceYear + 2];
    for (const candidateYear of candidates) {
      const date = new Date(Date.UTC(candidateYear, monthIndex, day));
      if (
        date.getUTCMonth() === monthIndex &&
        date.getUTCDate() === day &&
        date.getUTCDay() === targetWeekday
      ) {
        return { year: candidateYear, monthIndex };
      }
    }
  }

  return { year: referenceYear, monthIndex };
}

export function shiftCalendarMonth(
  year: number,
  monthIndex: number,
  deltaMonths: number
): { year: number; monthIndex: number } {
  const total = year * 12 + monthIndex + Math.trunc(deltaMonths);
  const nextYear = Math.floor(total / 12);
  const nextMonth = ((total % 12) + 12) % 12;
  return { year: nextYear, monthIndex: nextMonth };
}

export function buildWorkshopMonthView(
  year: number,
  monthIndex: number,
  slots: readonly WorkshopSlot[]
): WorkshopMonthView {
  const safeMonth = ((Math.trunc(monthIndex) % 12) + 12) % 12;
  const daysInMonth = new Date(Date.UTC(year, safeMonth + 1, 0)).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(year, safeMonth, 1)).getUTCDay(); // 0=Sun..6=Sat

  // Offset relative to Saturday-first week (Sat=0, Sun=1, Mon=2, ..., Fri=6)
  const leadingEmptyCount = (firstDayOfWeek + 1) % 7;

  const slotByDay = new Map<number, WorkshopSlot>();
  for (const slot of slots) {
    const slotMonth = parseArabicMonthIndex(slot.month);
    const slotDay = parseSlotDayNumber(slot.dayNumber);
    if (slotMonth === safeMonth && slotDay !== null && slotDay <= daysInMonth) {
      slotByDay.set(slotDay, slot);
    }
  }

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < leadingEmptyCount; i++) {
    cells.push({
      key: `pad-start-${year}-${safeMonth}-${i}`,
      dayNumber: null,
      isCurrentMonth: false,
      slot: null,
    });
  }

  let availableSlotCountInMonth = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const matchedSlot = slotByDay.get(day) ?? null;
    if (matchedSlot) availableSlotCountInMonth += 1;
    cells.push({
      key: `day-${year}-${safeMonth}-${day}`,
      dayNumber: day,
      isCurrentMonth: true,
      slot: matchedSlot,
    });
  }

  const trailingRemainder = cells.length % 7;
  if (trailingRemainder !== 0) {
    const needed = 7 - trailingRemainder;
    for (let i = 0; i < needed; i++) {
      cells.push({
        key: `pad-end-${year}-${safeMonth}-${i}`,
        dayNumber: null,
        isCurrentMonth: false,
        slot: null,
      });
    }
  }

  return {
    year,
    monthIndex: safeMonth,
    monthNameAr: ARABIC_MONTH_NAMES[safeMonth] ?? 'نوفمبر',
    monthLabelJp: `${safeMonth + 1}月`,
    cells,
    availableSlotCountInMonth,
  };
}
