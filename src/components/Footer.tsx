import React from 'react';
import { Instagram } from 'lucide-react';
import {
  HEADER_NAV_LINKS,
  KINO_INSTAGRAM,
  KINO_LOGO_SRC,
  getBaseUrl,
  resolveAssetUrl,
} from '../utils/theme';
import { HankoStamp } from './HankoStamp';
import { playSoftClick } from '../utils/soundEffects';

interface FooterProps {
  logoSrc?: string;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  logoSrc = KINO_LOGO_SRC,
  onNavigateAdmin,
}) => {
  const resolvedLogoSrc = resolveAssetUrl(logoSrc || KINO_LOGO_SRC);
  return (
    <footer className="relative bg-[var(--kino-surface-footer)] text-[#faf9f5] kino-seigaiha-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start pb-10 border-b border-dashed border-[#a9bf9c]/30">
          {/* Brand & Craft Identity */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-4">
              <a
                href="#hero"
                aria-label="Kino — أعلى الصفحة"
                className="relative flex items-center justify-center h-[68px] w-28 overflow-hidden rounded-[4px] bg-[#384c31] border border-dashed border-[#a9bf9c]/45 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
              >
                <img
                  src={resolvedLogoSrc}
                  alt="شعار ورشات كينو Kino"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackFor === resolvedLogoSrc) return;
                    img.dataset.fallbackFor = resolvedLogoSrc;
                    img.src = resolveAssetUrl(KINO_LOGO_SRC);
                  }}
                  className="w-full h-[114px] object-cover object-[50%_47%] select-none pointer-events-none"
                />
              </a>
              <div>
                <p className="font-jp text-lg font-bold tracking-wider text-[#faf9f5]">
                  キノサイガ
                </p>
                <p className="text-sm text-[#a9bf9c]">
                  ورشات فن الكينوسايغا للبنات — عنابة
                </p>
              </div>
            </div>
            <p className="text-[18px] text-[#faf9f5]/85 leading-relaxed max-w-md">
              لوحة خشب وقماش تجمع بين دقة الحرفة اليابانية ودفء الورشات النسائية في عنابة.
            </p>
            <div className="pt-1">
              <a
                href={KINO_INSTAGRAM.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-instagram-link"
                onClick={() => playSoftClick()}
                aria-label={`تابعينا على إنستغرام ${KINO_INSTAGRAM.handle}`}
                className="inline-flex items-center gap-2.5 min-h-[44px] px-4 py-2 rounded-[4px] border border-dashed border-[#a9bf9c]/60 bg-[#2d3f27]/70 text-sm sm:text-base font-semibold text-[#faf9f5] hover:bg-[var(--kino-accent)] hover:border-[#faf9f5] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
              >
                <Instagram size={18} aria-hidden="true" className="shrink-0" />
                <span>تابعينا على إنستغرام</span>
                <span
                  dir="ltr"
                  className="text-xs sm:text-sm text-[#dce6d6] font-normal"
                >
                  {KINO_INSTAGRAM.handle}
                </span>
              </a>
            </div>
          </div>

          {/* Arabic Navigation Mirror */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-base font-bold text-[#a9bf9c]">
              أقسام اللوحة
            </h3>
            <ul className="space-y-0.5">
              {HEADER_NAV_LINKS.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-2 min-h-[44px] py-2 px-1 rounded-[3px] text-base text-[#faf9f5]/90 hover:text-[#faf9f5] hover:underline decoration-dashed underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
                  >
                    <span
                      aria-hidden="true"
                      className="w-2 h-[1.5px] bg-[var(--kino-accent)]"
                    />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-2 min-h-[44px] py-2 px-1 rounded-[3px] text-base text-[#faf9f5]/90 hover:text-[#faf9f5] hover:underline decoration-dashed underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
                >
                  <span
                    aria-hidden="true"
                    className="w-2 h-[1.5px] bg-[var(--kino-accent)]"
                  />
                  <span>وشنو قالو البنات؟</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Hanko Craft Seal */}
          <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between gap-4">
            <div className="bg-[#faf9f5] p-2.5 rounded-[4px] border border-dashed border-[#6b4e31] shadow-sm">
              <HankoStamp text="キノ" size="lg" />
            </div>
            <p className="font-jp text-xs text-[#a9bf9c]/85 tracking-widest">
              木目込み · アンナバ
            </p>
          </div>
        </div>

        <div className="pt-6 space-y-3 text-sm text-[#a9bf9c]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-center md:text-start">
              © 2026 Kino (キノサイガ) — جميع الحقوق محفوظة.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <p className="font-arabic">صُنع بحب على طراز الكينوسايغا</p>
              <a
                href={`${getBaseUrl()}admin`}
                data-testid="footer-admin-link"
                onClick={(e) => {
                  if (!onNavigateAdmin) return;
                  e.preventDefault();
                  onNavigateAdmin();
                }}
                className="inline-flex items-center min-h-[44px] px-3 rounded-[4px] border border-dashed border-[#a9bf9c]/40 text-xs sm:text-sm font-semibold text-[#faf9f5]/90 hover:text-[#faf9f5] hover:border-[#faf9f5] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
              >
                دخول الإدارة وتغيير الصور
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-[#a9bf9c]/20 flex justify-center">
            <p
              dir="ltr"
              className="flex flex-wrap items-center justify-center gap-x-2 text-xs sm:text-sm text-[#a9bf9c]"
            >
              <span>
                Designed by:{' '}
                <strong className="font-semibold text-[#faf9f5]">
                  Wissem Zerrougui
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <a
                href="mailto:wissemzerrougui7@gmail.com"
                className="inline-flex items-center min-h-[44px] px-1 rounded-[3px] text-[#faf9f5]/90 hover:text-[#faf9f5] underline decoration-dashed underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
              >
                wissemzerrougui7@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
