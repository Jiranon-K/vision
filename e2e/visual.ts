import type { Page } from '@playwright/test';

// AnimationProvider wipes a full-screen lime overlay across the viewport after
// every route change. Stills taken before it clears show the wipe, not the
// page — so wait for the overlay to be scaled away rather than for a duration.
export async function settle(page: Page) {
  await page
    .locator('div.fixed.inset-0.bg-brand-lime')
    .first()
    .evaluate(
      (el) =>
        new Promise<void>((resolve) => {
          const done = () =>
            el.getBoundingClientRect().width < 1 ? resolve() : requestAnimationFrame(done);
          done();
        }),
      undefined,
      { timeout: 5_000 }
    );
}

// Entrance animations run on a stagger and finish by driving opacity to 1.
// Waiting on the end state rather than a duration keeps the stills stable on a
// slow machine. Only pass selectors for elements that are already in view —
// several of them animate on an IntersectionObserver and never reach opacity 1
// while scrolled out of the viewport.
export async function settleAnimations(page: Page, selectors: string[]) {
  await page.waitForFunction(
    (list) =>
      list.every((selector) =>
        [...document.querySelectorAll(selector)].every(
          (el) => getComputedStyle(el).opacity === '1'
        )
      ),
    selectors,
    { timeout: 15_000 }
  );
}
