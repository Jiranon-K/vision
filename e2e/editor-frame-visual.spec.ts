import { test, type Page } from "@playwright/test";
import { STORAGE_STATE } from "./config";
import { settle } from "./visual";

// Evidence run for the redesigned editor frame (direction 1b, Typewriter).
// Assertions live in the regression specs; this file exists to show the result.
test.use({ storageState: STORAGE_STATE, video: "on" });

const SHOTS = "test-results/editor-frame-visual";

const CONTENT =
  "A design system fails the moment a Creator has to argue with it. Components read the semantic layer only — a component that reaches past it to a primitive will not respond to dark mode, and that is the whole bug class, gone.";

async function shoot(page: Page, name: string) {
  await settle(page);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => {
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
}

for (const theme of ["light", "dark"] as const) {
  test(`editor frame — ${theme}`, async ({ page }) => {
    await page.goto("/dashboard/posts/new");
    await setTheme(page, theme);
    await shoot(page, `01-${theme}-empty`);

    await page.getByPlaceholder("Enter post title...").fill("Why the layers matter");
    await page.getByPlaceholder("Write your post content in Markdown...").fill(CONTENT);
    await page.mouse.move(400, 400);
    await shoot(page, `02-${theme}-written`);

    // The bar recedes while typing and returns on any pointer move.
    await page.getByPlaceholder("Write your post content in Markdown...").press("a");
    await page.waitForTimeout(900);
    await shoot(page, `03-${theme}-bar-receded`);

    await page.mouse.move(500, 500);
    await page.waitForTimeout(500);
    await shoot(page, `04-${theme}-bar-returned`);
  });
}
