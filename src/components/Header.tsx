import React, { useEffect, useState } from 'react';
import { Instagram, Menu, Moon, Sun, Volume2, VolumeX, X } from 'lucide-react';
import {
  HEADER_NAV_LINKS,
  KINO_INSTAGRAM,
  KINO_LOGO_SRC,
  resolveAssetUrl,
} from '../utils/theme';
import {
  isSoundEnabled,
  playSoftClick,
  subscribeSoundSetting,
  toggleSoundEnabled,
} from '../utils/soundEffects';
import {
  isDarkMode,
  subscribeColorMode,
  toggleColorMode,
} from '../utils/colorMode';

interface HeaderProps {
  activeSectionId?: string;
  logoSrc?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeSectionId = 'hero',
  logoSrc = KINO_LOGO_SRC,
}) => {
  const resolvedLogoSrc = resolveAssetUrl(logoSrc || KINO_LOGO_SRC);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [darkMode, setDarkMode] = useState<boolean>(() => isDarkMode());

  useEffect(() => {
    const unsubSound = subscribeSoundSetting(setSoundOn);
    const unsubColor = subscribeColorMode((mode) =>
      setDarkMode(mode === 'dark')
    );
    return () => {
      unsubSound();
      unsubColor();
    };
  }, []);

  const handleLinkClick = () => {
    playSoftClick();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--kino-surface-header)] text-[#faf9f5] border-b-2 border-dashed border-[#a9bf9c]/40 shadow-[0_6px_18px_rgba(20,29,17,0.28)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[74px] flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Zone 1: Brand mark (attached Kino logo with white wordmark) */}
        <a
          href="#hero"
          onClick={() => playSoftClick()}
          aria-label="العودة إلى الصفحة الرئيسية — Kino"
          className="relative flex items-center justify-center h-[52px] w-[72px] sm:h-[68px] sm:w-28 overflow-hidden rounded-[4px] bg-[#384c31] dark:border dark:border-dashed dark:border-[#a9bf9c]/35 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
        >
          <img
            src={resolvedLogoSrc}
            alt="شعار ورشات كينو Kino"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackFor === resolvedLogoSrc) return;
              img.dataset.fallbackFor = resolvedLogoSrc;
              img.src = resolveAssetUrl(KINO_LOGO_SRC);
            }}
            className="w-full h-[88px] sm:h-[114px] object-cover object-[50%_47%] select-none pointer-events-none"
          />
        </a>

        {/* Zone 2: Single-line Arabic RTL navigation links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-4 lg:gap-6 text-sm lg:text-base font-semibold"
        >
          {HEADER_NAV_LINKS.map((item) => {
            const isActive = activeSectionId === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => playSoftClick()}
                className={`relative inline-flex items-center min-h-[44px] py-2 px-1 whitespace-nowrap shrink-0 transition-colors duration-150 rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5] ${
                  isActive
                    ? 'text-[#faf9f5]'
                    : 'text-[#faf9f5]/85 hover:text-[#faf9f5]'
                }`}
              >
                <span>{item.label}</span>
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0.5 right-0 left-0 border-b-2 border-dashed transition-opacity duration-150 ${
                    isActive
                      ? 'opacity-100 border-[var(--kino-accent)]'
                      : 'opacity-0 border-[#a9bf9c]'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Mobile top CTA + Dark mode + Sound toggles + Desktop CTA + mobile menu button */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <a
            href="#reserve"
            data-testid="mobile-top-register-link"
            onClick={() => playSoftClick()}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-[4px] bg-[#faf9f5] text-[#2d3f27] border border-dashed border-[#55734a] hover:bg-[var(--kino-accent)] hover:text-[#faf9f5] hover:border-[#faf9f5] active:scale-[0.97] transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
          >
            سجلي معانا
          </a>

          <button
            type="button"
            data-testid="dark-mode-toggle-btn"
            onClick={() => {
              playSoftClick();
              toggleColorMode();
            }}
            aria-pressed={darkMode}
            aria-label={darkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            title={darkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-dashed border-[#a9bf9c]/60 text-[#faf9f5] hover:bg-[#2d3f27] dark:hover:bg-[#243220] active:scale-95 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
          >
            {darkMode ? (
              <Sun size={19} aria-hidden="true" className="text-[#f8ecd0]" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            data-testid="sound-toggle-btn"
            onClick={() => toggleSoundEnabled()}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'كتم أصوات النقر' : 'تشغيل أصوات النقر'}
            title={soundOn ? 'كتم أصوات النقر' : 'تشغيل أصوات النقر'}
            className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-dashed border-[#a9bf9c]/60 text-[#faf9f5] hover:bg-[#2d3f27] dark:hover:bg-[#243220] active:scale-95 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
          >
            {soundOn ? (
              <Volume2 size={19} aria-hidden="true" />
            ) : (
              <VolumeX size={19} aria-hidden="true" className="text-[#a9bf9c]" />
            )}
          </button>

          <a
            href="#reserve"
            onClick={() => playSoftClick()}
            className="hidden md:inline-flex items-center justify-center min-h-[44px] px-4 lg:px-5 py-2 text-sm lg:text-base font-bold rounded-[4px] bg-[#faf9f5] text-[#2d3f27] border border-dashed border-[#55734a] hover:bg-[var(--kino-accent)] hover:text-[#faf9f5] hover:border-[#faf9f5] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
          >
            احجزي مكانك
          </a>

          <button
            type="button"
            onClick={() => {
              playSoftClick();
              setMobileMenuOpen((prev) => !prev);
            }}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-dashed border-[#a9bf9c]/60 text-[#faf9f5] hover:bg-[#2d3f27] active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile RTL Stitched Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="قائمة الجوال"
          className="md:hidden bg-[#2d3f27] dark:bg-[#11180f] border-t border-dashed border-[#a9bf9c]/35 px-4 py-4 space-y-1.5"
        >
          {HEADER_NAV_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={handleLinkClick}
              className="flex items-center justify-between min-h-[44px] px-3 py-2 text-base font-semibold text-[#faf9f5] rounded-[4px] border border-transparent hover:border-dashed hover:border-[#a9bf9c]/50 hover:bg-[#3a4f32] active:scale-[0.99] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              <span>{item.label}</span>
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-[1px] border border-dashed border-[#a9bf9c]/70"
                style={{
                  backgroundColor:
                    activeSectionId === item.id
                      ? 'var(--kino-accent)'
                      : 'transparent',
                }}
              />
            </a>
          ))}
          <div className="pt-2 border-t border-dashed border-[#a9bf9c]/25 space-y-2">
            <a
              href="#reserve"
              onClick={handleLinkClick}
              className="flex items-center justify-center min-h-[44px] w-full px-5 py-2.5 text-base font-bold rounded-[4px] bg-[#faf9f5] text-[#2d3f27] border border-dashed border-[#55734a] hover:bg-[var(--kino-accent)] hover:text-[#faf9f5] active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              احجزي مكانك
            </a>
            <a
              href={KINO_INSTAGRAM.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="mobile-drawer-instagram-link"
              onClick={handleLinkClick}
              aria-label={`صفحة إنستغرام ${KINO_INSTAGRAM.handle}`}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2 text-sm font-semibold rounded-[4px] border border-dashed border-[#a9bf9c]/55 text-[#faf9f5] hover:bg-[#3a4f32] active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              <Instagram size={17} aria-hidden="true" className="shrink-0" />
              <span>إنستغرام الورشة</span>
              <span dir="ltr" className="text-xs text-[#dce6d6]">
                {KINO_INSTAGRAM.handle}
              </span>
            </a>
          </div>
        </nav>
      )}
    </header>
  );
};
