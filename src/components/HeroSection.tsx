import React, { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { HankoStamp } from './HankoStamp';
import { ThemeAccentBar } from './ThemeAccentBar';
import {
  HERO_CONTENT,
  HERO_HILL_LAYERS,
  KINO_GIRL_ARCH_SRC,
  KINO_LOGO_SRC,
  resolveAssetUrl,
  type HeroHillLayer,
  type WorkshopThemeId,
} from '../utils/theme';
import { playSoftClick } from '../utils/soundEffects';

interface HeroSectionProps {
  activeTheme: WorkshopThemeId;
  onSelectTheme: (id: WorkshopThemeId) => void;
  logoSrc?: string;
  heroGirlSrc?: string;
  heroGirlAlt?: string;
}

interface HillLayerSvgProps {
  hill: HeroHillLayer;
  scrollYProgress: MotionValue<number>;
  prefersReducedMotion: boolean | null;
  zIndexClass: string;
}

const renderPatternDef = (hill: HeroHillLayer) => {
  const pid = `pattern-${hill.patternId}`;
  switch (hill.patternId) {
    case 'dots':
      return (
        <pattern
          id={pid}
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="4.5"
            cy="4.5"
            r="1.8"
            fill={hill.patternStroke}
            fillOpacity="0.34"
          />
          <circle
            cx="13.5"
            cy="13.5"
            r="1.8"
            fill="#faf9f5"
            fillOpacity="0.28"
          />
        </pattern>
      );
    case 'gingham':
      return (
        <pattern
          id={pid}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="12"
            height="24"
            fill={hill.patternStroke}
            fillOpacity="0.16"
          />
          <rect
            width="24"
            height="12"
            fill={hill.patternStroke}
            fillOpacity="0.16"
          />
          <line
            x1="0"
            y1="12"
            x2="24"
            y2="12"
            stroke="#faf9f5"
            strokeOpacity="0.14"
            strokeWidth="0.7"
          />
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="24"
            stroke="#faf9f5"
            strokeOpacity="0.14"
            strokeWidth="0.7"
          />
        </pattern>
      );
    case 'circles':
      return (
        <pattern
          id={pid}
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={hill.patternStroke}
            strokeOpacity="0.22"
            strokeWidth="1"
          />
          <circle
            cx="18"
            cy="18"
            r="10"
            fill="none"
            stroke={hill.patternStroke}
            strokeOpacity="0.22"
            strokeWidth="1"
          />
          <circle
            cx="18"
            cy="18"
            r="5"
            fill="none"
            stroke={hill.patternStroke}
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        </pattern>
      );
    case 'stripes':
      return (
        <pattern
          id={pid}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="16"
            stroke={hill.patternStroke}
            strokeOpacity="0.32"
            strokeWidth="4"
          />
          <line
            x1="8"
            y1="0"
            x2="8"
            y2="16"
            stroke="#a9bf9c"
            strokeOpacity="0.14"
            strokeWidth="1"
          />
        </pattern>
      );
  }
};

const HillLayerSvg: React.FC<HillLayerSvgProps> = ({
  hill,
  scrollYProgress,
  prefersReducedMotion,
  zIndexClass,
}) => {
  const y = useTransform(scrollYProgress, [0, 1], [0, -hill.scrollParallaxPx]);

  return (
    <motion.div
      aria-hidden="true"
      data-testid={`hero-hill-${hill.patternId}`}
      style={prefersReducedMotion ? undefined : { y }}
      className={`pointer-events-none absolute inset-x-0 -bottom-16 h-[250px] sm:h-[300px] md:h-[340px] ${zIndexClass}`}
    >
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <defs>{renderPatternDef(hill)}</defs>

        {/* Base dyed fabric color */}
        <path
          d={hill.pathD}
          fill={
            hill.patternId === 'stripes'
              ? 'var(--kino-surface-hero-front)'
              : hill.baseColor
          }
        />

        {/* Woven fabric pattern overlay */}
        <path d={hill.pathD} fill={`url(#pattern-${hill.patternId})`} />

        {/* Carved wooden Kinusaiga groove edge shadow */}
        <path
          d={hill.pathD.replace(' L1440,340 L0,340 Z', '')}
          fill="none"
          stroke="#22311d"
          strokeOpacity="0.45"
          strokeWidth="4.5"
        />

        {/* Dashed stitched seam along tucked edge */}
        <path
          d={hill.stitchD}
          fill="none"
          stroke={hill.stitchColor}
          strokeOpacity="0.88"
          strokeWidth="2"
          strokeDasharray="10 7"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeTheme,
  onSelectTheme,
  logoSrc = KINO_LOGO_SRC,
  heroGirlSrc = KINO_GIRL_ARCH_SRC,
  heroGirlAlt = 'لوحة فتاة الكينوسايجا مع أزهار الوستيريا والمروحة',
}) => {
  const resolvedLogoSrc = resolveAssetUrl(logoSrc || KINO_LOGO_SRC);
  const resolvedHeroGirlSrc = resolveAssetUrl(heroGirlSrc || KINO_GIRL_ARCH_SRC);
  const heroRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const sunY = useTransform(scrollYProgress, [0, 1], [0, 32]);
  const archY = useTransform(scrollYProgress, [0, 1], [0, -10]);

  return (
    <section
      id="hero"
      ref={heroRef}
      aria-labelledby="hero-title"
      className="kino-hero-bg relative overflow-hidden pt-6 sm:pt-10 pb-44 sm:pb-52 md:pb-56 px-4 sm:px-6 lg:px-8 text-[#faf9f5]"
    >
      {/* Subtle seigaiha wave textile texture over dark green gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 kino-seigaiha-dark opacity-90"
      />

      {/* Large Accent Sun Circle behind the hills & arch */}
      <motion.div
        aria-hidden="true"
        data-testid="hero-sun-circle"
        style={{
          backgroundColor: 'var(--kino-accent)',
          ...(prefersReducedMotion ? {} : { y: sunY }),
        }}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-[15%] bottom-36 sm:bottom-44 md:bottom-48 w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full z-[5] transition-colors duration-300 shadow-[0_0_0_10px_rgba(250,249,245,0.06)]"
      >
        <div className="kino-sun-breathe w-full h-full rounded-full border-2 border-dashed border-[#faf9f5]/45 scale-[0.91]" />
      </motion.div>

      {/* Main Content Grid */}
      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end">
        {/* Right Column in RTL: Japanese Kicker, Large Logo, H1, Darija Subtext, Actions */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 relative z-30 space-y-4 pb-2 lg:pb-12"
        >
          <p className="font-jp text-sm sm:text-base tracking-[0.24em] text-[#a9bf9c]">
            {HERO_CONTENT.jpKicker}
          </p>

          {/* Large Attached Kino Logo (tightly framed without empty padding) */}
          <div className="relative flex items-center justify-center h-24 w-40 sm:h-28 sm:w-48 overflow-hidden rounded-[6px] bg-[#384c31] border border-dashed border-[#a9bf9c]/45 shadow-[0_8px_22px_rgba(20,29,17,0.35)]">
            <img
              src={resolvedLogoSrc}
              alt="شعار كينو الكبير Kino"
              referrerPolicy="no-referrer"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackFor === resolvedLogoSrc) return;
                img.dataset.fallbackFor = resolvedLogoSrc;
                img.src = resolveAssetUrl(KINO_LOGO_SRC);
              }}
              className="w-full h-[180px] sm:h-[210px] object-cover object-[50%_47%] select-none pointer-events-none"
            />
          </div>

          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl md:text-[52px] font-bold text-[#faf9f5] leading-[1.24]"
          >
            {HERO_CONTENT.h1}
          </h1>

          {/* Primary & Secondary Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-3.5">
            <a
              href="#workshops"
              onClick={() => playSoftClick()}
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 text-base font-bold rounded-[4px] bg-[#faf9f5] text-[#2d3f27] border-2 border-dashed border-[#55734a] hover:bg-[var(--kino-accent)] hover:text-[#faf9f5] hover:border-[#faf9f5] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              {HERO_CONTENT.primaryCta}
            </a>

            <a
              href="#try"
              onClick={() => playSoftClick()}
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 text-base font-bold rounded-[4px] bg-[#2d3f27]/70 text-[#faf9f5] border-2 border-dashed border-[#a9bf9c]/80 hover:border-[#faf9f5] hover:bg-[#3a4f32] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              {HERO_CONTENT.secondaryCta}
            </a>
          </div>

          <div className="pt-1">
            <ThemeAccentBar
              activeTheme={activeTheme}
              onSelectTheme={onSelectTheme}
              variant="dark"
            />
          </div>
        </motion.div>

        {/* Left Column in RTL: Cream Arch Frame (multiply blend) standing on the hills */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={prefersReducedMotion ? undefined : { y: archY }}
          className="lg:col-span-5 relative z-[15] flex justify-center lg:justify-end -mb-16 sm:-mb-24 md:-mb-28"
        >
          <div className="relative w-full max-w-[290px] sm:max-w-[330px] rounded-t-full rounded-b-[6px] bg-[#faf9f5] border-[6px] border-[#6b4e31] p-2.5 pb-12 sm:pb-14 shadow-[0_18px_40px_rgba(18,27,15,0.45)]">
            <div className="relative rounded-t-full rounded-b-[3px] border border-dashed border-[#55734a]/55 bg-[#faf9f5] pt-4 px-2.5 pb-3 overflow-hidden">
              <img
                src={resolvedHeroGirlSrc}
                alt={heroGirlAlt}
                referrerPolicy="no-referrer"
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackFor === resolvedHeroGirlSrc) return;
                  img.dataset.fallbackFor = resolvedHeroGirlSrc;
                  img.src = resolveAssetUrl(KINO_GIRL_ARCH_SRC);
                }}
                className="w-full h-auto block object-contain mix-blend-multiply select-none"
              />

              {/* Red Hanko Seal on the cream arch */}
              <div className="absolute bottom-3.5 left-3.5">
                <HankoStamp text="キノ" size="sm" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom 4 Layered Wavy Hills with 4 Distinct Fabric Patterns & Scroll Speeds */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[230px] sm:h-[270px] md:h-[300px]">
        <HillLayerSvg
          hill={HERO_HILL_LAYERS[0]}
          scrollYProgress={scrollYProgress}
          prefersReducedMotion={prefersReducedMotion}
          zIndexClass="z-10"
        />
        <HillLayerSvg
          hill={HERO_HILL_LAYERS[1]}
          scrollYProgress={scrollYProgress}
          prefersReducedMotion={prefersReducedMotion}
          zIndexClass="z-[12]"
        />
        <HillLayerSvg
          hill={HERO_HILL_LAYERS[2]}
          scrollYProgress={scrollYProgress}
          prefersReducedMotion={prefersReducedMotion}
          zIndexClass="z-[18]"
        />
        <HillLayerSvg
          hill={HERO_HILL_LAYERS[3]}
          scrollYProgress={scrollYProgress}
          prefersReducedMotion={prefersReducedMotion}
          zIndexClass="z-20"
        />
      </div>
    </section>
  );
};
