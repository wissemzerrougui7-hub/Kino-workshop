import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import {
  ALL_SWATCHES,
  FLOWER_REGIONS,
  THEME_FABRIC_SWATCHES,
  generateRandomFlowerFill,
  type FabricSwatch,
  type FlowerRegion,
} from '../utils/kinusaigaCraft';
import { WORKSHOP_THEMES, type WorkshopThemeId } from '../utils/theme';
import { CraftFabricPatternDefs, SwatchPreviewSvg } from './FabricPatternSvg';
import {
  playFabricTuckTap,
  playSoftClick,
  playSurpriseChime,
  playWoodTap,
} from '../utils/soundEffects';

interface TryKinusaigaSectionProps {
  activeTheme: WorkshopThemeId;
  onSelectTheme: (id: WorkshopThemeId) => void;
}

const THEME_ORDER: WorkshopThemeId[] = ['forest', 'autumn', 'sakura', 'sun'];

export const TryKinusaigaSection: React.FC<TryKinusaigaSectionProps> = ({
  activeTheme,
  onSelectTheme,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const themeSwatches = THEME_FABRIC_SWATCHES[activeTheme];

  const [selectedSwatchId, setSelectedSwatchId] = useState<string>(
    () => THEME_FABRIC_SWATCHES[activeTheme][0].id
  );
  const [regionFills, setRegionFills] = useState<Record<string, string>>({});
  const [pressCounts, setPressCounts] = useState<Record<string, number>>({});
  const [tapRipple, setTapRipple] = useState<{
    key: number;
    cx: number;
    cy: number;
  } | null>(null);

  const swatchById = useMemo(() => {
    const map = new Map<string, FabricSwatch>();
    for (const s of ALL_SWATCHES) {
      map.set(s.id, s);
    }
    return map;
  }, []);

  // Ensure the active swatch matches one of the active theme's 6 swatches
  const activeSwatch = useMemo(() => {
    const found = themeSwatches.find((s) => s.id === selectedSwatchId);
    return found ?? themeSwatches[0];
  }, [themeSwatches, selectedSwatchId]);

  const handleThemeChipClick = (nextTheme: WorkshopThemeId) => {
    playSoftClick();
    const currentKind = activeSwatch.patternKind;
    onSelectTheme(nextTheme);
    const nextThemeSwatches = THEME_FABRIC_SWATCHES[nextTheme];
    const matchingKind =
      nextThemeSwatches.find((s) => s.patternKind === currentKind) ??
      nextThemeSwatches[0];
    setSelectedSwatchId(matchingKind.id);
  };

  const handleRegionTap = (region: FlowerRegion, regionIndex: number) => {
    playFabricTuckTap(regionIndex);
    setRegionFills((prev) => ({
      ...prev,
      [region.id]: activeSwatch.id,
    }));
    setPressCounts((prev) => ({
      ...prev,
      [region.id]: (prev[region.id] ?? 0) + 1,
    }));
    setTapRipple({
      key: Date.now() + regionIndex,
      cx: region.cx,
      cy: region.cy,
    });
  };

  const handleRandomFill = () => {
    playSurpriseChime();
    const nextFills = generateRandomFlowerFill(activeTheme);
    setRegionFills(nextFills);
    setPressCounts((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const region of FLOWER_REGIONS) {
        next[region.id] = (next[region.id] ?? 0) + 1;
      }
      return next;
    });
    setTapRipple({ key: Date.now(), cx: 200, cy: 192 });
  };

  const handleReset = () => {
    playWoodTap();
    setRegionFills({});
    setTapRipple(null);
  };

  const filledCount = Object.keys(regionFills).length;
  const totalRegions = FLOWER_REGIONS.length;

  return (
    <section
      id="try"
      aria-labelledby="heading-try"
      className="relative overflow-x-clip py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--kino-surface-try)] text-[#faf9f5] kino-seigaiha-dark kino-tucked-seam"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 'some' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto"
      >
        {/* Section Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-dashed border-[#a9bf9c]/35">
          <div className="flex items-baseline gap-3">
            <span
              className="kino-accent-transition text-base font-bold tabular-nums"
              style={{ color: 'var(--kino-accent-soft)' }}
            >
              ٠٣
            </span>
            <h2
              id="heading-try"
              className="text-[28px] leading-snug font-bold text-[#faf9f5]"
            >
              جرّبي الكينوسايجا أونلاين
            </h2>
          </div>

          <span className="font-jp text-sm tracking-wider text-[#a9bf9c]">
            きぬさいが体験
          </span>
        </div>

        {/* Main Interactive Studio Layout */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Right Column in RTL (Controls: Theme Chips, 6 Swatches, Actions) */}
          <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
            <p className="text-[18px] text-[#faf9f5]/90 leading-relaxed">
              اختاري ثيم الألوان، مسّي قطعة القماش اللي تعجبك ومن بعد ضغطي على أي جزء في اللوحة باش يتغطّى داخل الشق الخشبي.
            </p>

            {/* Theme Chips (Switch swatches + site-wide accent) */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-[#a9bf9c]">
                ثيم الأقمشة والورشة:
              </p>
              <div
                role="group"
                aria-label="اختيار ثيم الأقمشة"
                className="flex flex-wrap gap-2"
              >
                {THEME_ORDER.map((id) => {
                  const theme = WORKSHOP_THEMES[id];
                  const isActive = activeTheme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`craft-theme-chip-${id}`}
                      onClick={() => handleThemeChipClick(id)}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-[13px] sm:text-sm font-bold rounded-[4px] border transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5] ${
                        isActive
                          ? 'bg-[#faf9f5] text-[#2d3f27] border-[#faf9f5] -translate-y-0.5 shadow-sm'
                          : 'bg-[#2d3f27]/85 dark:bg-[#1c2818] text-[#faf9f5] border-[#a9bf9c]/45 hover:border-[#faf9f5] hover:-translate-y-0.5'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-3.5 h-3.5 rounded-[2px] border border-dashed border-[#faf9f5]/75 shrink-0"
                        style={{ backgroundColor: theme.accentHex }}
                      />
                      <span>{theme.labelAr}</span>
                      <span
                        className={`font-jp text-xs ${
                          isActive ? 'text-[#55734a]' : 'text-[#a9bf9c]'
                        }`}
                      >
                        {theme.labelJp}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6 Fabric Swatches */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-[#a9bf9c]">
                  قطع القماش ({WORKSHOP_THEMES[activeTheme].labelAr}):
                </p>
                <span className="text-xs text-[#faf9f5]/75">
                  المختارة: <strong className="text-[#faf9f5]">{activeSwatch.labelAr}</strong>
                </span>
              </div>

              <div
                role="group"
                aria-label="قطع القماش المتاحة"
                className="grid grid-cols-3 gap-2.5"
              >
                {themeSwatches.map((swatch) => {
                  const isSelected = activeSwatch.id === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      data-testid={`craft-swatch-${swatch.id}`}
                      onClick={() => {
                        playSoftClick();
                        setSelectedSwatchId(swatch.id);
                      }}
                      aria-pressed={isSelected}
                      className={`kino-accent-transition flex flex-col items-center justify-center gap-2 min-h-[82px] p-2.5 rounded-[5px] border-2 cursor-pointer active:scale-[0.96] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5] ${
                        isSelected
                          ? 'bg-[#faf9f5] text-[#2d3f27] -translate-y-0.5 shadow-[0_6px_16px_rgba(14,22,12,0.38)]'
                          : 'bg-[#2d3f27]/75 dark:bg-[#1c2818] text-[#faf9f5] border-[#a9bf9c]/35 hover:border-[#faf9f5] hover:-translate-y-0.5'
                      }`}
                      style={
                        isSelected
                          ? { borderColor: 'var(--kino-accent)' }
                          : undefined
                      }
                    >
                      <SwatchPreviewSvg swatch={swatch} className="w-11 h-11" />
                      <span className="text-xs sm:text-sm font-bold leading-none">
                        {swatch.labelAr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Surprise Me + Reset */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="craft-random-btn"
                onClick={handleRandomFill}
                className="kino-accent-transition inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 text-base font-bold rounded-[4px] border-2 border-dashed border-[#faf9f5]/85 shadow-sm hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
                style={{
                  backgroundColor: 'var(--kino-accent)',
                  color: 'var(--kino-accent-contrast)',
                }}
              >
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>فاجئيني</span>
              </button>

              <button
                type="button"
                data-testid="craft-reset-btn"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 text-base font-bold rounded-[4px] bg-[#2d3f27]/85 dark:bg-[#1c2818] text-[#faf9f5] border-2 border-dashed border-[#a9bf9c]/70 hover:border-[#faf9f5] hover:bg-[#2d3f27] dark:hover:bg-[#243220] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>عاودي من الأول</span>
              </button>
            </div>

            {/* Unboxed Clean Progress Readout */}
            <p
              data-testid="craft-progress-count"
              className="text-sm text-[#a9bf9c] tabular-nums"
            >
              القطع المركّبة في اللوحة:{' '}
              <strong className="text-[#faf9f5]">
                {filledCount} / {totalRegions}
              </strong>
            </p>
          </div>

          {/* Left Column in RTL: 400x400 SVG Flower Panel in Wooden Frame */}
          <div className="lg:col-span-6 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-[440px]">
              <div className="kino-wood-frame rounded-[6px] border-[10px] border-[#6b4e31] bg-[#4a3520] p-2.5 sm:p-3.5 shadow-[0_22px_46px_rgba(14,22,12,0.5)]">
                <div className="rounded-[3px] border border-dashed border-[#d9c3a3]/55 p-1 bg-[#2b1f13]">
                  <svg
                    viewBox="0 0 400 400"
                    data-testid="kinusaiga-flower-svg"
                    role="group"
                    aria-label="لوحة زهرة كينوسايجا التفاعلية من 19 قطعة"
                    className="w-full h-auto block select-none rounded-[2px] bg-[#efe9da]"
                  >
                    <CraftFabricPatternDefs />

                    {FLOWER_REGIONS.map((region, regionIndex) => {
                      const assignedSwatchId = regionFills[region.id];
                      const assignedSwatch = assignedSwatchId
                        ? swatchById.get(assignedSwatchId)
                        : undefined;
                      const pressKey = pressCounts[region.id] ?? 0;
                      const isFilled = Boolean(assignedSwatch);

                      return (
                        <motion.g
                          key={`${region.id}-${pressKey}`}
                          style={{
                            transformOrigin: `${region.cx}px ${region.cy}px`,
                          }}
                          initial={
                            pressKey > 0 && !prefersReducedMotion
                              ? {
                                  scale:
                                    region.group === 'background' ? 0.985 : 0.93,
                                }
                              : false
                          }
                          animate={{ scale: 1 }}
                          transition={{
                            duration: 0.24,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          <path
                            d={region.pathD}
                            role="button"
                            tabIndex={0}
                            data-region-id={region.id}
                            data-filled-swatch={assignedSwatchId ?? ''}
                            aria-label={`${region.labelAr}${
                              assignedSwatch
                                ? ` — قماش ${assignedSwatch.labelAr}`
                                : ' — غير مملوءة، اضغطي لتركيب القماش'
                            }`}
                            onClick={() => handleRegionTap(region, regionIndex)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleRegionTap(region, regionIndex);
                              }
                            }}
                            fill={
                              isFilled
                                ? `url(#craft-swatch-${assignedSwatchId})`
                                : 'url(#craft-unfilled-board)'
                            }
                            stroke="#1f2b1b"
                            strokeWidth={isFilled ? 2.5 : 2}
                            strokeLinejoin="round"
                            className="cursor-pointer transition-opacity duration-150 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-[#faf9f5] focus-visible:stroke-[#faf9f5] focus-visible:stroke-[3]"
                          />
                        </motion.g>
                      );
                    })}

                    {tapRipple && !prefersReducedMotion && (
                      <motion.circle
                        key={tapRipple.key}
                        cx={tapRipple.cx}
                        cy={tapRipple.cy}
                        fill="none"
                        stroke="var(--kino-accent)"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        className="pointer-events-none"
                        initial={{ r: 6, opacity: 0.95 }}
                        animate={{ r: 34, opacity: 0 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
