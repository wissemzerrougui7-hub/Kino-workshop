import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Play, X } from 'lucide-react';
import {
  INTRO_ASSETS,
  INTRO_CONTENT,
  INTRO_VIDEO_URL,
  resolveAssetUrl,
} from '../utils/theme';
import { parseVideoSource } from '../utils/video';
import { playWoodTap } from '../utils/soundEffects';

const ARABIC_STEP_DIGITS = ['١', '٢', '٣'] as const;

interface IntroSectionProps {
  lighthouseSrc?: string;
  lighthouseAlt?: string;
  japanCircleSrc?: string;
  japanCircleAlt?: string;
  videoPosterSrc?: string;
  videoPosterAlt?: string;
}

export const IntroSection: React.FC<IntroSectionProps> = ({
  lighthouseSrc = INTRO_ASSETS.lighthouseSrc,
  lighthouseAlt = 'لوحة منارة بحرية مصنوعة بفن الكينوسايغا داخل إطار خشبي',
  japanCircleSrc = INTRO_ASSETS.japanCircleSrc,
  japanCircleAlt = 'مشهد تقليدي للحرفية اليابانية وأقمشة الكيمونو',
  videoPosterSrc = INTRO_ASSETS.videoPosterSrc,
  videoPosterAlt = 'لقطة تحضير لوحة كينوسايغا بالقماش والخشب',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoSource = useMemo(() => parseVideoSource(INTRO_VIDEO_URL), []);
  const resolvedLighthouseSrc = resolveAssetUrl(
    lighthouseSrc || INTRO_ASSETS.lighthouseSrc
  );
  const resolvedJapanCircleSrc = resolveAssetUrl(
    japanCircleSrc || INTRO_ASSETS.japanCircleSrc
  );
  const resolvedVideoPosterSrc = resolveAssetUrl(
    videoPosterSrc || INTRO_ASSETS.videoPosterSrc
  );

  return (
    <section
      id={INTRO_CONTENT.id}
      aria-labelledby={`heading-${INTRO_CONTENT.id}`}
      className="relative overflow-x-clip bg-[var(--kino-surface-cream)] kino-seigaiha-light kino-tucked-seam py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Row: Darija Intro + Vertical Stitched Steps & Hanging Lighthouse Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Right Column in RTL: Title, Copy, and 3 Steps on Dashed Vertical Stitch Line */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-dashed border-[#55734a]/30 dark:border-[#a9bf9c]/30">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-base font-bold tabular-nums"
                  style={{ color: 'var(--kino-accent)' }}
                >
                  {INTRO_CONTENT.indexLabel}
                </span>
                <h2
                  id={`heading-${INTRO_CONTENT.id}`}
                  className="text-[28px] sm:text-[32px] leading-snug font-bold text-[#2d3f27] dark:text-[#f2eee2]"
                >
                  {INTRO_CONTENT.title}
                </h2>
              </div>
              <span className="font-jp text-sm tracking-wider text-[#55734a] dark:text-[#a9bf9c]">
                {INTRO_CONTENT.subtitleJp}
              </span>
            </div>

            <p className="text-[18px] leading-[1.85] text-[#3a4f32] dark:text-[#d2decb]">
              {INTRO_CONTENT.body}
            </p>

            {/* Three steps on a dashed vertical stitch line */}
            <ol
              aria-label="مراحل صنع لوحة الكينوسايغا"
              className="relative pr-6 pt-2 space-y-5"
            >
              {/* Continuous vertical dashed thread line */}
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-5 right-[15px] border-r-2 border-dashed border-[#55734a]/55 dark:border-[#a9bf9c]/45"
              />

              {INTRO_CONTENT.steps.map((step, idx) => (
                <li
                  key={step}
                  className="relative flex items-start gap-4 group transition-transform duration-150 hover:-translate-x-1"
                >
                  <span
                    aria-hidden="true"
                    className="relative z-10 -mr-6 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#faf9f5] dark:bg-[#243220] border-2 border-dashed text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] shrink-0 shadow-xs transition-colors duration-200"
                    style={{ borderColor: 'var(--kino-accent)' }}
                  >
                    {ARABIC_STEP_DIGITS[idx]}
                  </span>
                  <span className="text-[18px] leading-relaxed font-semibold text-[#2d3f27] dark:text-[#f2eee2]">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Left Column in RTL: Hanging Tilted Wooden Frame + Circular Japan Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex justify-center pt-6 pb-8"
          >
            <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
              {/* Hanging brass nail + string V-cord */}
              <div
                aria-hidden="true"
                className="relative mx-auto w-56 h-14 flex items-start justify-center -mb-2 z-0"
              >
                <span className="relative z-10 w-3.5 h-3.5 rounded-full bg-[#9c7a54] border-2 border-[#4a3520] shadow-sm" />
                <svg
                  viewBox="0 0 220 56"
                  className="absolute inset-0 w-full h-full overflow-visible"
                >
                  <line
                    x1="110"
                    y1="7"
                    x2="24"
                    y2="56"
                    stroke="#6b4e31"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <line
                    x1="110"
                    y1="7"
                    x2="196"
                    y2="56"
                    stroke="#6b4e31"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                </svg>
              </div>

              {/* Tilted wooden frame holding the Kinusaiga lighthouse artwork */}
              <div className="kino-gentle-sway relative z-10 rounded-[6px] border-[10px] border-[#6b4e31] bg-[#faf9f5] dark:bg-[#243220] p-2 shadow-[0_20px_42px_rgba(45,63,39,0.22)]">
                <div className="overflow-hidden rounded-[2px] border border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#eef2ea] dark:bg-[#1a2417] aspect-[3/4]">
                  <img
                    src={resolvedLighthouseSrc}
                    alt={lighthouseAlt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallbackFor === resolvedLighthouseSrc) return;
                      img.dataset.fallbackFor = resolvedLighthouseSrc;
                      img.src = resolveAssetUrl(INTRO_ASSETS.lighthouseSrc);
                    }}
                    className="w-full h-full object-cover block"
                  />
                </div>
              </div>

              {/* Circular Japan photo overlapping bottom-left corner of the frame */}
              <div className="absolute -bottom-5 -left-1 sm:-bottom-6 sm:-left-8 z-20 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#faf9f5] dark:bg-[#243220] p-1.5 border-[3px] border-[#6b4e31] shadow-[0_12px_28px_rgba(30,44,25,0.3)]">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-dashed border-[#55734a]/70 dark:border-[#a9bf9c]/55 bg-[#eef2ea] dark:bg-[#1a2417]">
                  <img
                    src={resolvedJapanCircleSrc}
                    alt={japanCircleAlt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallbackFor === resolvedJapanCircleSrc) return;
                      img.dataset.fallbackFor = resolvedJapanCircleSrc;
                      img.src = resolveAssetUrl(INTRO_ASSETS.japanCircleSrc);
                    }}
                    className="w-full h-full object-cover block"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Portrait 9:16 Video Block Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 sm:mt-20 flex flex-col items-center space-y-4"
        >
          <div className="relative w-full max-w-[340px] sm:max-w-[390px] aspect-[9/16] rounded-[8px] overflow-hidden border-[6px] border-[#6b4e31] bg-[#2d3f27] shadow-[0_18px_40px_rgba(45,63,39,0.22)]">
            {!isPlaying ? (
              <div className="relative w-full h-full">
                <img
                  src={resolvedVideoPosterSrc}
                  alt={videoPosterAlt}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackFor === resolvedVideoPosterSrc) return;
                    img.dataset.fallbackFor = resolvedVideoPosterSrc;
                    img.src = resolveAssetUrl(INTRO_ASSETS.videoPosterSrc);
                  }}
                  className="w-full h-full object-cover block"
                />
                {/* Scrim + inner stitched border */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[#2d3f27]/35"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-3 sm:inset-4 rounded-[4px] border border-dashed border-[#faf9f5]/55"
                />

                {/* Big Play Button in Current Accent Colour */}
                <button
                  type="button"
                  onClick={() => {
                    playWoodTap();
                    setIsPlaying(true);
                  }}
                  aria-label={`تشغيل الفيديو: ${INTRO_CONTENT.videoCaption}`}
                  className="group absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-2 border-dashed border-[#faf9f5] shadow-[0_10px_28px_rgba(20,29,17,0.45)] cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#faf9f5]"
                  style={{
                    backgroundColor: 'var(--kino-accent)',
                    color: 'var(--kino-accent-contrast)',
                  }}
                >
                  <Play
                    size={34}
                    className="fill-current translate-x-[2px] transition-transform duration-150 group-hover:scale-110"
                  />
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full bg-[#2d3f27]">
                {videoSource.kind === 'youtube' ? (
                  <iframe
                    src={videoSource.embedUrl}
                    title={INTRO_CONTENT.videoCaption}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    src={resolveAssetUrl(videoSource.src)}
                    poster={resolvedVideoPosterSrc}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover bg-[#2d3f27]"
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    playWoodTap();
                    setIsPlaying(false);
                  }}
                  aria-label="إغلاق مشغل الفيديو"
                  className="absolute top-3 left-3 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#2d3f27]/85 text-[#faf9f5] border border-dashed border-[#faf9f5]/70 hover:bg-[#2d3f27] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="w-full max-w-[340px] sm:max-w-[390px] flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[18px] font-semibold text-[#2d3f27] dark:text-[#f2eee2]">
              {INTRO_CONTENT.videoCaption}
            </p>
            <span className="font-jp text-sm text-[#55734a] dark:text-[#a9bf9c]">
              キノサイガの作り方
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
