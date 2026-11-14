async (page) => {
  await page.waitForSelector('[data-testid="workshop-location-row"]', { timeout: 15000 });
  const desktop = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="workshop-location-row"]');
    const nameEl = document.querySelector('[data-testid="workshop-location-name"]');
    const wsLink = document.querySelector('[data-testid="workshop-maps-link"]');
    const resLink = document.querySelector('[data-testid="reserve-maps-link"]');
    const wsRect = wsLink ? wsLink.getBoundingClientRect() : null;
    const resRect = resLink ? resLink.getBoundingClientRect() : null;
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      rowVisible: !!row && getComputedStyle(row).display !== 'none',
      locationNameText: nameEl?.textContent?.trim(),
      wsLinkHref: wsLink?.getAttribute('href'),
      wsLinkTarget: wsLink?.getAttribute('target'),
      wsLinkRel: wsLink?.getAttribute('rel'),
      wsLinkHeight: wsRect ? Math.round(wsRect.height) : 0,
      resLinkHref: resLink?.getAttribute('href'),
      resLinkTarget: resLink?.getAttribute('target'),
      resLinkRel: resLink?.getAttribute('rel'),
      resLinkHeight: resRect ? Math.round(resRect.height) : 0,
    };
  });
  await page.evaluate(() => {
    const el = document.querySelector('#workshops');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.playwright-cli/workshop-location-light.png' });
  await page.evaluate(() => {
    const el = document.querySelector('#reserve');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.playwright-cli/reserve-location-light.png' });

  const toggle = await page.$('button[aria-label*="داكن"], button[aria-label*="فاتح"]');
  if (toggle) await toggle.click();
  await page.waitForTimeout(250);
  const darkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.evaluate(() => {
    const el = document.querySelector('#workshops');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.playwright-cli/workshop-location-dark.png' });

  await page.setViewportSize({ width: 375, height: 844 });
  await page.waitForTimeout(250);
  const mobile = await page.evaluate(() => {
    const wsLink = document.querySelector('[data-testid="workshop-maps-link"]');
    const resLink = document.querySelector('[data-testid="reserve-maps-link"]');
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      wsLinkHeight: wsLink ? Math.round(wsLink.getBoundingClientRect().height) : 0,
      resLinkHeight: resLink ? Math.round(resLink.getBoundingClientRect().height) : 0,
    };
  });
  await page.evaluate(() => {
    const el = document.querySelector('#workshops');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'instant' });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.playwright-cli/mobile-workshop-location.png' });

  return JSON.stringify({ desktop, darkClass, mobile });
}
