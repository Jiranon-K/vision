import { test, expect, type ConsoleMessage } from '@playwright/test';

const PAGES = ['/', '/pricing', '/services'];

for (const path of PAGES) {
  test(`${path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    expect(errors, `console errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
  });
}
