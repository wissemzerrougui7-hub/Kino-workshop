import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import {
  CURRENT_WORKSHOP,
  formatSeatsLeft,
  resolveAssetUrl,
  type WorkshopConfig,
  type WorkshopSlot,
} from '../utils/theme';
import { playSoftClick, playWoodTap } from '../utils/soundEffects';
import {
  buildWorkshopMonthView,
  CALENDAR_WEEKDAYS,
  resolveWorkshopInitialMonth,
  shiftCalendarMonth,
} from '../utils/workshopCalendar';

interface UpcomingWorkshopSectionProps {
  workshop: WorkshopConfig;
  selectedSlotIds: string[];
  onSelectSlot: (slotId: string) => void;
}

export const UpcomingWorkshopSection: React.FC<
  UpcomingWorkshopSectionProps
> = ({ workshop, selectedSlotIds, onSelectSlot }) => {
  const resolvedDefaultMonth = useMemo(
    () => resolveWorkshopInitialMonth(workshop.slots),
    [workshop.slots]
  );

  const [calendarCursor, setCalendarCursor] = useState(resolvedDefaultMonth);

  useEffect(() => {
    setCalendarCursor(resolvedDefaultMonth);
  }, [resolvedDefaultMonth]);

  const monthView = useMemo(
    () =>
      buildWorkshopMonthView(
        calendarCursor.year,
        calendarCursor.monthIndex,
        workshop.slots
      ),
    [calendarCursor.year, calendarCursor.monthIndex, workshop.slots]
  );

  const activeSelectedSlot =
    workshop.slots.find((slot) => selectedSlotIds.includes(slot.id)) ??
    workshop.slots[0];

  const handleTicketClick = (slot: WorkshopSlot) => {
    playWoodTap();
    onSelectSlot(slot.id);
    const reserveEl = document.getElementById('reserve');
    if (reserveEl) {
      reserveEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCalendarSlotSelect = (slot: WorkshopSlot) => {
    playWoodTap();
    onSelectSlot(slot.id);
  };

  const handleShiftMonth = (delta: number) => {
    playSoftClick();
    setCalendarCursor((prev) =>
      shiftCalendarMonth(prev.year, prev.monthIndex, delta)
    );
  };

  return (
    <section
      id="workshops"
      aria-labelledby="heading-workshops"
      className="relative overflow-x-clip bg-[var(--kino-surface-sage)] kino-linen-weave kino-tucked-seam py-16 sm:py-20 md:py-24 px-3 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Right Column in RTL: Workshop Info + Notched Tickets + Monthly Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-dashed border-[#55734a]/30 dark:border-[#a9bf9c]/30">
            <div className="flex items-baseline gap-3">
              <span
                className="kino-accent-transition text-base font-bold tabular-nums"
                style={{ color: 'var(--kino-accent)' }}
              >
                ٠٢
              </span>
              <h2
                id="heading-workshops"
                className="text-[28px] sm:text-[32px] leading-snug font-bold text-[#2d3f27] dark:text-[#f2eee2]"
              >
                الورشة الجاية
              </h2>
            </div>
            <span className="font-jp text-sm tracking-wider text-[#55734a] dark:text-[#a9bf9c]">
              今月のワークショップ
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-[#2d3f27] dark:text-[#f2eee2]">
              {workshop.title}
            </h3>

            {/* Unboxed metadata with typographic separator */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm sm:text-base font-semibold text-[#55734a] dark:text-[#a9bf9c]">
              <span>{workshop.themeName}</span>
              <span aria-hidden="true">·</span>
              <span
                className="kino-accent-transition font-bold tabular-nums"
                style={{ color: 'var(--kino-accent)' }}
              >
                {formatSeatsLeft(workshop.seatsLeft)}
              </span>
            </div>

            <p className="text-[18px] leading-[1.85] text-[#3a4f32] dark:text-[#d2decb]">
              {workshop.description}
            </p>

            {(workshop.locationName || workshop.locationMapsUrl) && (
              <div
                data-testid="workshop-location-row"
                className="flex flex-wrap items-center justify-between gap-3 pt-2 rounded-[6px] border border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#faf9f5]/85 dark:bg-[#243220]/85 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0 text-sm sm:text-base text-[#2d3f27] dark:text-[#f2eee2]">
                  <MapPin
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--kino-accent)' }}
                    aria-hidden="true"
                  />
                  <span className="font-bold shrink-0">مكان الورشة:</span>
                  <span
                    data-testid="workshop-location-name"
                    className="font-semibold text-[#3a4f32] dark:text-[#d2decb] truncate"
                  >
                    {workshop.locationName || 'عنابة'}
                  </span>
                </div>

                {workshop.locationMapsUrl && (
                  <a
                    href={workshop.locationMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="workshop-maps-link"
                    onClick={() => playSoftClick()}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-[4px] border border-dashed border-[#55734a]/50 dark:border-[#a9bf9c]/50 bg-[#fffdf9] dark:bg-[#182215] text-xs sm:text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] hover:border-[var(--kino-accent)] hover:text-[var(--kino-accent)] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                  >
                    <span>الموقع في قوقل ماب</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Two Ticket-Shaped Slot Cards (notches on both sides) */}
          <div
            role="group"
            aria-label="مواعيد الورشة الجاية"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
          >
            {workshop.slots.map((slot) => {
              const isSelected = selectedSlotIds.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleTicketClick(slot)}
                  aria-pressed={isSelected}
                  data-testid={`workshop-ticket-${slot.id}`}
                  className={`kino-accent-transition relative group text-right w-full rounded-[6px] bg-[#faf9f5] dark:bg-[#243220] px-5 py-4 border-2 transition-transform duration-150 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
                    isSelected
                      ? 'shadow-[0_10px_24px_rgba(45,63,39,0.14)] -translate-y-0.5'
                      : 'border-[#55734a]/35 dark:border-[#a9bf9c]/35 hover:border-[#2d3f27] dark:hover:border-[#f2eee2]'
                  }`}
                  style={
                    isSelected
                      ? { borderColor: 'var(--kino-accent)' }
                      : undefined
                  }
                >
                  {/* Left & Right Ticket Semicircular Notches */}
                  <span
                    aria-hidden="true"
                    className={`kino-accent-transition absolute top-1/2 -translate-y-1/2 -right-[10px] w-5 h-5 rounded-full bg-[var(--kino-surface-sage)] border-l-2 ${
                      isSelected
                        ? ''
                        : 'border-[#55734a]/35 dark:border-[#a9bf9c]/35 group-hover:border-[#2d3f27] dark:group-hover:border-[#f2eee2]'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: 'var(--kino-accent)' }
                        : undefined
                    }
                  />
                  <span
                    aria-hidden="true"
                    className={`kino-accent-transition absolute top-1/2 -translate-y-1/2 -left-[10px] w-5 h-5 rounded-full bg-[var(--kino-surface-sage)] border-r-2 ${
                      isSelected
                        ? ''
                        : 'border-[#55734a]/35 dark:border-[#a9bf9c]/35 group-hover:border-[#2d3f27] dark:group-hover:border-[#f2eee2]'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: 'var(--kino-accent)' }
                        : undefined
                    }
                  />

                  <div className="flex items-center gap-4">
                    {/* Red Hanko Stamp with Day Number and Month */}
                    <div
                      aria-hidden="true"
                      className="shrink-0 w-14 h-16 rounded-[3px] border-2 border-[#b8322a] dark:border-[#e66c64] bg-[#b8322a]/[0.05] dark:bg-[#b8322a]/15 text-[#b8322a] dark:text-[#ff928a] flex flex-col items-center justify-center rotate-[-3deg] group-hover:rotate-0 transition-transform duration-200 shadow-[inset_0_0_0_1px_rgba(184,50,42,0.18)]"
                    >
                      <span className="text-xl font-bold leading-none tabular-nums">
                        {slot.dayNumber}
                      </span>
                      <span className="text-[11px] font-bold mt-1 leading-none">
                        {slot.month}
                      </span>
                    </div>

                    {/* Dashed Vertical Tear Line */}
                    <span
                      aria-hidden="true"
                      className="h-12 border-r border-dashed border-[#55734a]/35 dark:border-[#a9bf9c]/35 shrink-0"
                    />

                    {/* Weekday & Time */}
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-lg font-bold text-[#2d3f27] dark:text-[#f2eee2] leading-snug">
                        {slot.weekday}
                      </p>
                      <p className="text-sm sm:text-base text-[#3a4f32] dark:text-[#d2decb] tabular-nums">
                        {slot.time}
                      </p>
                      <p
                        className={`kino-accent-transition text-xs font-bold pt-0.5 ${
                          isSelected ? '' : 'text-[#55734a] dark:text-[#a9bf9c]'
                        }`}
                        style={
                          isSelected
                            ? { color: 'var(--kino-accent)' }
                            : undefined
                        }
                      >
                        {isSelected ? 'الموعد المختار' : 'اضغطي لاختيار الموعد'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Monthly Schedule Calendar Grid */}
          <div
            data-testid="workshop-calendar"
            aria-label="تقويم مواعيد الورشة الشهري"
            className="rounded-[6px] border-2 border-dashed border-[#55734a]/35 dark:border-[#a9bf9c]/35 bg-[#faf9f5] dark:bg-[#243220] px-1 py-2.5 sm:p-4 shadow-[0_8px_22px_rgba(45,63,39,0.08)] space-y-3"
          >
            {/* Calendar Header & Month Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 border-b border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={19}
                  aria-hidden="true"
                  className="text-[#b8322a] dark:text-[#ff928a] shrink-0"
                />
                <h4
                  data-testid="calendar-month-title"
                  className="text-base sm:text-lg font-bold text-[#2d3f27] dark:text-[#f2eee2] tabular-nums"
                >
                  {monthView.monthNameAr} {monthView.year}
                </h4>
                <span className="font-jp text-xs text-[#55734a] dark:text-[#a9bf9c]">
                  {monthView.monthLabelJp}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="calendar-prev-month"
                  onClick={() => handleShiftMonth(-1)}
                  aria-label="الشهر السابق"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#eef2ea]/70 dark:bg-[#1a2417] text-[#2d3f27] dark:text-[#f2eee2] hover:border-[#2d3f27] dark:hover:border-[#faf9f5] active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-testid="calendar-next-month"
                  onClick={() => handleShiftMonth(1)}
                  aria-label="الشهر التالي"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#eef2ea]/70 dark:bg-[#1a2417] text-[#2d3f27] dark:text-[#f2eee2] hover:border-[#2d3f27] dark:hover:border-[#faf9f5] active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Compact Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-semibold text-[#55734a] dark:text-[#a9bf9c]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-[2px] border border-dashed border-[#b8322a] dark:border-[#e66c64] bg-[#b8322a]/15"
                  />
                  <span>يوم متاح للورشة</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-[2px]"
                    style={{ backgroundColor: 'var(--kino-accent)' }}
                  />
                  <span>الموعد المختار</span>
                </span>
              </div>
              <span className="tabular-nums">
                {monthView.availableSlotCountInMonth > 0
                  ? `${monthView.availableSlotCountInMonth} مواعيد متاحة`
                  : 'لا توجد مواعيد في هذا الشهر'}
              </span>
            </div>

            {/* 7-Column Weekday Headers */}
            <div
              role="row"
              className="grid grid-cols-7 gap-[1px] sm:gap-1.5 text-center"
            >
              {CALENDAR_WEEKDAYS.map((day) => (
                <div
                  key={day.dayOfWeek}
                  role="columnheader"
                  aria-label={day.fullAr}
                  className="py-1 text-[11px] sm:text-xs font-bold text-[#55734a] dark:text-[#a9bf9c]"
                >
                  <span className="sm:hidden">{day.shortAr}</span>
                  <span className="hidden sm:inline">{day.fullAr}</span>
                </div>
              ))}
            </div>

            {/* Monthly Grid Days */}
            <div
              role="grid"
              aria-label={`جدول أيام ${monthView.monthNameAr} ${monthView.year}`}
              className="grid grid-cols-7 gap-[1px] sm:gap-1.5"
            >
              {monthView.cells.map((cell) => {
                if (cell.dayNumber === null) {
                  return (
                    <div
                      key={cell.key}
                      aria-hidden="true"
                      className="min-h-[44px] rounded-[4px] bg-[#eef2ea]/30 dark:bg-[#1a2417]/35"
                    />
                  );
                }

                const slot = cell.slot;
                if (slot) {
                  const isSelected = selectedSlotIds.includes(slot.id);
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      data-testid={`calendar-day-${cell.dayNumber}`}
                      data-available="true"
                      aria-pressed={isSelected}
                      aria-label={`${slot.weekday} ${cell.dayNumber} ${monthView.monthNameAr} — ${slot.time}${isSelected ? ' (الموعد المختار)' : ' (متاح للحجز)'}`}
                      onClick={() => handleCalendarSlotSelect(slot)}
                      className={`relative flex flex-col items-center justify-center min-h-[44px] w-full rounded-[4px] tabular-nums cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
                        isSelected
                          ? 'border-2 border-[#faf9f5]/85 shadow-[0_6px_14px_rgba(45,63,39,0.2)] font-extrabold'
                          : 'border-2 border-dashed border-[#b8322a]/70 dark:border-[#e66c64]/75 bg-[#b8322a]/[0.08] dark:bg-[#b8322a]/20 text-[#2d3f27] dark:text-[#faf9f5] hover:bg-[#b8322a]/15 dark:hover:bg-[#b8322a]/30 font-bold'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'var(--kino-accent)',
                              color: 'var(--kino-accent-contrast)',
                            }
                          : undefined
                      }
                    >
                      <span className="text-sm sm:text-base leading-none">
                        {cell.dayNumber}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`mt-1 w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-current opacity-90'
                            : 'bg-[#b8322a] dark:bg-[#ff928a]'
                        }`}
                      />
                    </button>
                  );
                }

                return (
                  <div
                    key={cell.key}
                    className="flex items-center justify-center min-h-[44px] rounded-[4px] border border-transparent text-xs sm:text-sm font-medium text-[#3a4f32]/70 dark:text-[#d2decb]/65 tabular-nums select-none"
                  >
                    {cell.dayNumber}
                  </div>
                );
              })}
            </div>

            {/* Selected Slot Summary / Jump Back */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2 border-t border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25 text-xs sm:text-sm">
              <p className="text-[#3a4f32] dark:text-[#d2decb] font-semibold">
                الموعد المختار:{' '}
                <span className="font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                  {activeSelectedSlot.weekday} {activeSelectedSlot.dayNumber}{' '}
                  {activeSelectedSlot.month} · {activeSelectedSlot.time}
                </span>
              </p>

              {monthView.availableSlotCountInMonth === 0 && (
                <button
                  type="button"
                  data-testid="calendar-reset-month"
                  onClick={() => {
                    playSoftClick();
                    setCalendarCursor(resolvedDefaultMonth);
                  }}
                  className="inline-flex items-center min-h-[44px] px-3 rounded-[4px] border border-dashed border-[#55734a]/50 dark:border-[#a9bf9c]/50 text-xs font-bold text-[#2d3f27] dark:text-[#f2eee2] hover:bg-[#eef2ea] dark:hover:bg-[#1a2417] cursor-pointer"
                >
                  العودة لشهر الورشة
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Left Column in RTL: Tilted Wooden Frame Artwork */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex justify-center py-4"
        >
          <div className="relative w-full max-w-[320px] sm:max-w-[380px] rotate-[2.2deg] hover:rotate-0 motion-reduce:hover:rotate-[2.2deg] motion-reduce:transition-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-[6px] border-[10px] border-[#6b4e31] bg-[#faf9f5] dark:bg-[#243220] p-2.5 shadow-[0_20px_42px_rgba(45,63,39,0.22)]">
            <div className="overflow-hidden rounded-[2px] border border-dashed border-[#55734a]/45 dark:border-[#a9bf9c]/40 bg-[#eef2ea] dark:bg-[#1a2417] aspect-[3/4]">
              <img
                src={resolveAssetUrl(workshop.imageSrc || CURRENT_WORKSHOP.imageSrc)}
                alt={workshop.imageAlt}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget;
                  const target = resolveAssetUrl(workshop.imageSrc);
                  if (img.dataset.fallbackFor === target) return;
                  img.dataset.fallbackFor = target;
                  img.src = resolveAssetUrl(CURRENT_WORKSHOP.imageSrc);
                }}
                className="w-full h-full object-cover block"
              />
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-xs font-semibold text-[#55734a] dark:text-[#a9bf9c]">
              <span>{workshop.title}</span>
              <span>{workshop.themeName}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
