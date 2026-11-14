async (page) => {
  const report = {};

  // 1. Wait for app hero & workshop content
  await page.waitForSelector('header', { timeout: 15000 });
  await page.waitForSelector('[data-testid="workshop-location-row"]', { timeout: 15000 });
  // Wait for initial loader overlay to disappear
  await page.waitForFunction(() => !document.querySelector('[role="status"][aria-label*="تحضير"]'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);

  // 2. Hero, Header, Nav, Copy, Images
  report.desktopCheck = await page.evaluate(() => {
    const bodyText = document.body.innerText || '';
    const imgs = Array.from(document.querySelectorAll('img'));
    const brokenImgs = imgs
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') || img.alt);

    const navLinks = Array.from(document.querySelectorAll('header nav a')).map((a) => ({
      text: (a.textContent || '').trim(),
      href: a.getAttribute('href'),
    }));

    const instaLinks = Array.from(
      document.querySelectorAll('a[href*="instagram.com/kino__workshop"]')
    ).map((a) => ({
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    }));

    return {
      title: document.title,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      hasRemovedSubtitle: bodyText.includes('قطعة قماش على قطعة تولّي لوحة بين يديك'),
      hasIntroHeading: bodyText.includes('وشنو هي الكينوسايجا؟'),
      hasReviewsHeading: bodyText.includes('وشنو قالو البنات؟'),
      totalImages: imgs.length,
      brokenImgs,
      navLinks,
      instaLinksCount: instaLinks.length,
      instaLinks,
      reviewCardsCount: document.querySelectorAll('[data-testid="reviews-pinboard"] > *').length,
      wsLocationName: document.querySelector('[data-testid="workshop-location-name"]')?.textContent?.trim(),
      wsMapsHref: document.querySelector('[data-testid="workshop-maps-link"]')?.getAttribute('href'),
      resMapsHref: document.querySelector('[data-testid="reserve-maps-link"]')?.getAttribute('href'),
    };
  });

  // Screenshot 1: Desktop Hero & Header
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.playwright-cli/e2e-1-hero-desktop.png' });

  // 3. Test Interactive Try-Kinusaiga Board (#try)
  await page.click('[data-testid="craft-theme-chip-sakura"]');
  await page.waitForTimeout(150);
  const centerPath = page.locator('[data-testid="kinusaiga-flower-svg"] path[data-region-id="center"]');
  await centerPath.scrollIntoViewIfNeeded();
  await centerPath.click();
  await page.waitForTimeout(150);
  const afterSingleTap = await page.locator('[data-testid="craft-progress-count"]').innerText();

  await page.click('[data-testid="craft-random-btn"]');
  await page.waitForTimeout(200);
  const afterRandom = await page.locator('[data-testid="craft-progress-count"]').innerText();

  // Screenshot 2: Interactive Kinusaiga filled with Sakura theme
  await page.evaluate(() => {
    const el = document.querySelector('#try');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.playwright-cli/e2e-2-try-kinusaiga.png' });

  await page.click('[data-testid="craft-reset-btn"]');
  await page.waitForTimeout(150);
  const afterReset = await page.locator('[data-testid="craft-progress-count"]').innerText();
  // Restore forest theme
  await page.click('[data-testid="craft-theme-chip-forest"]');

  report.tryCraft = { afterSingleTap, afterRandom, afterReset };

  // 4. Test Upcoming Workshop & Slot Sync with Reserve Section
  const secondReserveSlot = page.locator('[data-testid^="reg-slot-chip-"]').nth(1);
  const beforeSyncChecked = await secondReserveSlot.getAttribute('aria-checked');
  // Toggle second slot card in UpcomingWorkshopSection
  const secondUpcomingSlot = page.locator('#workshops [data-testid^="slot-card-"], #workshops button[aria-pressed]').nth(1);
  if (await secondUpcomingSlot.count()) {
    await secondUpcomingSlot.click();
  } else {
    await secondReserveSlot.click();
  }
  await page.waitForTimeout(150);
  const afterSyncChecked = await secondReserveSlot.getAttribute('aria-checked');
  report.slotSync = { beforeSyncChecked, afterSyncChecked };

  // 5. Test Reviews Form validation (empty submit -> inline Arabic error without writing to Firestore)
  const reviewSubmit = page.locator('#reviews button[type="submit"]');
  await reviewSubmit.click();
  await page.waitForTimeout(150);
  const reviewAlerts = await page.locator('#reviews [role="alert"]').allInnerTexts();

  // 6. Test Reserve Form Surprise Tile + Validation (empty submit -> inline Arabic alerts)
  await page.click('[data-testid="reg-artwork-tile-surprise-me"]');
  await page.waitForTimeout(150);
  const reserveSubmit = page.locator('#reserve button[type="submit"]');
  await reserveSubmit.click();
  await page.waitForTimeout(150);
  const reserveAlerts = await page.locator('#reserve [role="alert"]').allInnerTexts();

  report.validation = {
    reviewAlertCount: reviewAlerts.length,
    reserveAlertCount: reserveAlerts.length,
  };

  // 7. Toggle Dark Mode & capture Reserve + Reviews check
  const themeToggle = page.locator('header button[aria-label*="داكن"], header button[aria-label*="فاتح"]').first();
  await themeToggle.click();
  await page.waitForTimeout(250);
  report.darkModeActive = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.evaluate(() => {
    const el = document.querySelector('#reserve');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.playwright-cli/e2e-3-reserve-dark.png' });

  // 8. Mobile Responsive Check (375x844) + Mobile Top CTA + Mobile Menu Drawer
  await page.setViewportSize({ width: 375, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(250);
  const mobileTopCta = await page.locator('header a[href="#reserve"]').filter({ hasText: 'سجلي معانا' }).first().isVisible();
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const menuBtn = page.locator('header button[aria-expanded]').first();
  let mobileMenuExpanded = null;
  if (await menuBtn.count()) {
    await menuBtn.click();
    await page.waitForTimeout(200);
    mobileMenuExpanded = await menuBtn.getAttribute('aria-expanded');
  }
  await page.screenshot({ path: '.playwright-cli/e2e-4-mobile-menu.png' });
  report.mobile = { mobileTopCta, mobileOverflow, mobileMenuExpanded };

  return JSON.stringify(report);
}
