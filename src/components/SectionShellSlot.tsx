import React from 'react';
import { motion } from 'motion/react';
import type { SectionShellSlot as SectionShellSlotData } from '../utils/theme';

interface SectionShellSlotProps {
  section: SectionShellSlotData;
}

export const SectionShellSlot: React.FC<SectionShellSlotProps> = ({
  section,
}) => {
  const isForest = section.fabricTone === 'forest';
  const headingColor = isForest ? 'text-[#faf9f5]' : 'text-[#2d3f27]';
  const mutedTextColor = isForest ? 'text-[#a9bf9c]' : 'text-[#55734a]';
  const frameBorderColor = isForest
    ? 'border-[#a9bf9c]/40 bg-[#2d3f27]/45'
    : 'border-[#55734a]/35 bg-[#faf9f5]/75';

  return (
    <section
      id={section.id}
      aria-labelledby={`heading-${section.id}`}
      style={{ backgroundColor: section.fabricBg }}
      className={`relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 kino-tucked-seam ${
        section.seigaiha
          ? isForest
            ? 'kino-seigaiha-dark'
            : 'kino-seigaiha-light'
          : 'kino-linen-weave'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-dashed border-[#55734a]/30">
          <div className="flex items-baseline gap-3">
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: 'var(--kino-accent)' }}
            >
              {section.indexLabel}
            </span>
            <h2
              id={`heading-${section.id}`}
              className={`text-[28px] leading-snug font-bold ${headingColor}`}
            >
              {section.title}
            </h2>
          </div>

          <span className={`font-jp text-sm tracking-wider ${mutedTextColor}`}>
            {section.subtitleJp}
          </span>
        </div>

        {/* Clean Kinusaiga fabric slot ready for section copy & interaction */}
        <div
          className={`mt-8 rounded-[6px] border-2 border-dashed p-6 sm:p-10 transition-transform duration-200 hover:-translate-y-0.5 ${frameBorderColor}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className={`text-[18px] leading-relaxed ${headingColor}`}>
                مساحة قماش مخصصة لهذا القسم من لوحة كينو.
              </p>
              <p className={`text-sm ${mutedTextColor}`}>
                جاهزة لاستقبال النص بالدارجة الجزائرية والعنصر التفاعلي الخاص بها.
              </p>
            </div>
            <div
              aria-hidden="true"
              className="w-12 h-12 rounded-[4px] border-2 border-dashed shrink-0 self-start sm:self-center"
              style={{
                borderColor: 'var(--kino-accent)',
                backgroundColor: 'var(--kino-accent-soft)',
              }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
