import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { HeroSection } from './components/HeroSection';
import { IntroSection } from './components/IntroSection';
import { UpcomingWorkshopSection } from './components/UpcomingWorkshopSection';
import { TryKinusaigaSection } from './components/TryKinusaigaSection';
import { ReviewsWallSection } from './components/ReviewsWallSection';
import { ReserveSlotSection } from './components/ReserveSlotSection';
import { WavyStitchedDivider } from './components/WavyStitchedDivider';
import { SakuraPetals } from './components/SakuraPetals';
import { Footer } from './components/Footer';
import { AdminPage } from './components/AdminPage';
import {
  CURRENT_WORKSHOP,
  INTRO_CONTENT,
  getBaseUrl,
  getThemeCssVars,
  type WorkshopConfig,
  type WorkshopThemeId,
} from './utils/theme';
import { toggleWorkshopSlotSelection } from './utils/registration';
import {
  subscribeSiteAssets,
  subscribeWorkshopConfig,
} from './utils/firestoreService';
import {
  getDefaultSiteAssetsMap,
  type SiteAssetsMap,
} from './utils/siteAssets';
import { applyColorModeToDocument, getColorMode } from './utils/colorMode';

function isAdminPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '');
  const base = getBaseUrl().replace(/\/+$/, '');
  return (
    normalized === '/admin' ||
    (base !== '' && normalized === `${base}/admin`)
  );
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [workshop, setWorkshop] = useState<WorkshopConfig>(CURRENT_WORKSHOP);
  const [siteAssets, setSiteAssets] = useState<SiteAssetsMap>(() =>
    getDefaultSiteAssetsMap()
  );
  const [activeTheme, setActiveTheme] = useState<WorkshopThemeId>(
    CURRENT_WORKSHOP.themeKey
  );
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([
    CURRENT_WORKSHOP.slots[0].id,
  ]);
  const [activeSectionId, setActiveSectionId] = useState<string>('hero');

  useEffect(() => {
    applyColorModeToDocument(getColorMode());
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const unsubWorkshop = subscribeWorkshopConfig((liveWorkshop) => {
      setWorkshop(liveWorkshop);
      setActiveTheme(liveWorkshop.themeKey);
      setSelectedSlotIds((prev) => {
        const validSet = new Set(liveWorkshop.slots.map((s) => s.id));
        const kept = prev.filter((id) => validSet.has(id));
        return kept.length > 0 ? kept : [liveWorkshop.slots[0].id];
      });
    });
    const unsubAssets = subscribeSiteAssets(({ assets }) => {
      setSiteAssets(assets);
    });
    return () => {
      unsubWorkshop();
      unsubAssets();
    };
  }, []);

  useEffect(() => {
    if (isAdminPath(pathname)) return;
    const sectionIds = [
      'hero',
      INTRO_CONTENT.id,
      'workshops',
      'try',
      'reviews',
      'reserve',
    ];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  if (isAdminPath(pathname)) {
    return (
      <MotionConfig reducedMotion="user">
        <AdminPage
          onNavigateHome={() => {
            const homeUrl = getBaseUrl();
            window.history.pushState({}, '', homeUrl);
            setPathname(homeUrl);
          }}
        />
      </MotionConfig>
    );
  }

  const themeVars = getThemeCssVars(activeTheme);

  return (
    <MotionConfig reducedMotion="user">
      <Loader logoSrc={siteAssets.logo.src} />
      <div
        data-theme={activeTheme}
        style={themeVars as React.CSSProperties}
        className="kino-accent-transition min-h-screen bg-[var(--kino-surface-outer)] p-1.5 sm:p-3 md:p-4"
      >
        {/* Ambient falling petals respecting prefers-reduced-motion */}
        <SakuraPetals activeTheme={activeTheme} count={10} />

        {/* Outer wooden Kinusaiga panel frame */}
        <div className="kino-wood-frame mx-auto max-w-[1440px] rounded-[8px] border-[4px] sm:border-[6px] bg-[var(--kino-surface-cream)] overflow-x-clip">
          <Header
            activeSectionId={activeSectionId}
            logoSrc={siteAssets.logo.src}
          />

          <main id="main-content">
            <HeroSection
              activeTheme={activeTheme}
              onSelectTheme={setActiveTheme}
              logoSrc={siteAssets.logo.src}
              heroGirlSrc={siteAssets['hero-girl'].src}
              heroGirlAlt={siteAssets['hero-girl'].alt}
            />

            {/* Wavy stitched groove transition from Hero front hill into Intro */}
            <WavyStitchedDivider
              topColor="var(--kino-surface-hero-front)"
              bottomColor="var(--kino-surface-cream)"
              bottomClassName="kino-seigaiha-light kino-tucked-seam"
              variant="wave-a"
              stitchColor="#a9bf9c"
            />
            <IntroSection
              lighthouseSrc={siteAssets['intro-lighthouse'].src}
              lighthouseAlt={siteAssets['intro-lighthouse'].alt}
              japanCircleSrc={siteAssets['intro-japan-circle'].src}
              japanCircleAlt={siteAssets['intro-japan-circle'].alt}
              videoPosterSrc={siteAssets['intro-video-poster'].src}
              videoPosterAlt={siteAssets['intro-video-poster'].alt}
            />

            {/* Wavy stitched groove transition from Intro into Upcoming Workshop */}
            <WavyStitchedDivider
              topColor="var(--kino-surface-cream)"
              topClassName="kino-seigaiha-light kino-tucked-seam"
              bottomColor="var(--kino-surface-sage)"
              bottomClassName="kino-linen-weave kino-tucked-seam"
              variant="wave-b"
              stitchColor="#55734a"
              useAccentStitch
            />
            <UpcomingWorkshopSection
              workshop={workshop}
              selectedSlotIds={selectedSlotIds}
              onSelectSlot={(slotId) => setSelectedSlotIds([slotId])}
            />

            {/* Wavy stitched transition from Upcoming Workshop into Interactive Try Kinusaiga */}
            <WavyStitchedDivider
              topColor="var(--kino-surface-sage)"
              topClassName="kino-linen-weave kino-tucked-seam"
              bottomColor="var(--kino-surface-try)"
              bottomClassName="kino-seigaiha-dark kino-tucked-seam"
              variant="wave-c"
              stitchColor="#a9bf9c"
            />
            <TryKinusaigaSection
              activeTheme={activeTheme}
              onSelectTheme={setActiveTheme}
            />

            {/* Wavy stitched transition from Interactive Try Kinusaiga into Reviews Pinboard */}
            <WavyStitchedDivider
              topColor="var(--kino-surface-try)"
              topClassName="kino-seigaiha-dark kino-tucked-seam"
              bottomColor="var(--kino-surface-sand)"
              bottomClassName="kino-linen-weave kino-tucked-seam"
              variant="wave-b"
              stitchColor="#55734a"
              useAccentStitch
            />
            <ReviewsWallSection
              starterReviewPhotos={{
                'starter-review-1': siteAssets['review-starter-1'].src,
                'starter-review-2': siteAssets['review-starter-2'].src,
                'starter-review-3': siteAssets['review-starter-3'].src,
              }}
            />

            {/* Wavy stitched transition into Registration Section */}
            <WavyStitchedDivider
              topColor="var(--kino-surface-sand)"
              topClassName="kino-linen-weave kino-tucked-seam"
              bottomColor="var(--kino-surface-cream)"
              bottomClassName="kino-linen-weave kino-tucked-seam"
              variant="wave-c"
              stitchColor="#55734a"
            />
            <ReserveSlotSection
              workshop={workshop}
              selectedSlotIds={selectedSlotIds}
              onToggleSlot={(slotId) =>
                setSelectedSlotIds((prev) =>
                  toggleWorkshopSlotSelection(prev, slotId)
                )
              }
            />

            {/* Final wavy stitched transition into deep forest Footer */}
            <WavyStitchedDivider
              topColor="var(--kino-surface-cream)"
              topClassName="kino-linen-weave kino-tucked-seam"
              bottomColor="var(--kino-surface-footer)"
              bottomClassName="kino-seigaiha-dark"
              variant="wave-b"
              stitchColor="#a9bf9c"
            />
          </main>

          <Footer
            logoSrc={siteAssets.logo.src}
            onNavigateAdmin={() => {
              const adminUrl = `${getBaseUrl()}admin`;
              window.history.pushState({}, '', adminUrl);
              setPathname(adminUrl);
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          />
        </div>
      </div>
    </MotionConfig>
  );
}
