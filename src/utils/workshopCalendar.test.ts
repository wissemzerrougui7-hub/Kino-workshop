import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_WORKSHOP } from './theme';
import {
  buildWorkshopMonthView,
  CALENDAR_WEEKDAYS,
  parseArabicMonthIndex,
  parseArabicWeekdayIndex,
  parseSlotDayNumber,
  resolveWorkshopInitialMonth,
  shiftCalendarMonth,
} from './workshopCalendar';

test('parses Arabic month names, weekdays, and Latin/Arabic numerals', () => {
  assert.equal(parseArabicMonthIndex('نوفمبر'), 10);
  assert.equal(parseArabicMonthIndex('جانفي'), 0);
  assert.equal(parseArabicMonthIndex('ديسمبر'), 11);
  assert.equal(parseArabicWeekdayIndex('السبت'), 6);
  assert.equal(parseArabicWeekdayIndex('الجمعة'), 5);
  assert.equal(parseSlotDayNumber('21'), 21);
  assert.equal(parseSlotDayNumber('٢٧'), 27);
  assert.equal(parseSlotDayNumber('99'), null);
});

test('resolves November 2026 for CURRENT_WORKSHOP slots matching Saturday 21 & Friday 27', () => {
  const resolved = resolveWorkshopInitialMonth(CURRENT_WORKSHOP.slots, 2026);
  assert.deepEqual(resolved, { year: 2026, monthIndex: 10 });
});

test('builds complete 7-column month grid highlighting available workshop dates', () => {
  const view = buildWorkshopMonthView(2026, 10, CURRENT_WORKSHOP.slots);
  assert.equal(view.monthNameAr, 'نوفمبر');
  assert.equal(view.monthLabelJp, '11月');
  assert.equal(view.availableSlotCountInMonth, 2);
  assert.equal(view.cells.length % 7, 0);
  assert.equal(CALENDAR_WEEKDAYS.length, 7);

  const day21Cell = view.cells.find((c) => c.dayNumber === 21);
  const day27Cell = view.cells.find((c) => c.dayNumber === 27);
  const day15Cell = view.cells.find((c) => c.dayNumber === 15);

  assert.equal(day21Cell?.slot?.id, 'slot-sat-21');
  assert.equal(day27Cell?.slot?.id, 'slot-fri-27');
  assert.equal(day15Cell?.slot, null);

  // Verify Saturday-first alignment: Nov 21, 2026 is Saturday (column index 0)
  const idx21 = view.cells.findIndex((c) => c.dayNumber === 21);
  assert.equal(idx21 % 7, 0);
  // Nov 27, 2026 is Friday (column index 6)
  const idx27 = view.cells.findIndex((c) => c.dayNumber === 27);
  assert.equal(idx27 % 7, 6);
});

test('shiftCalendarMonth rolls cleanly across year boundaries', () => {
  assert.deepEqual(shiftCalendarMonth(2026, 11, 1), {
    year: 2027,
    monthIndex: 0,
  });
  assert.deepEqual(shiftCalendarMonth(2026, 0, -1), {
    year: 2025,
    monthIndex: 11,
  });
});
