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

    await page.getByPlaceholder("Untitled Post").fill("Why the layers matter");
    await page.getByPlaceholder("Start writing. Markdown works; so does thinking out loud.").fill(CONTENT);
    await page.mouse.move(400, 400);
    await shoot(page, `02-${theme}-written`);

    // The bar recedes while typing and returns on any pointer move.
    await page.getByPlaceholder("Start writing. Markdown works; so does thinking out loud.").press("a");
    await page.waitForTimeout(900);
    await shoot(page, `03-${theme}-bar-receded`);

    await page.mouse.move(500, 500);
    await page.waitForTimeout(500);
    await shoot(page, `04-${theme}-bar-returned`);

    // The three modes the switch offers — one writing surface, two measures,
    // and the Post as a Reader gets it.
    await page.getByRole("radio", { name: "Split" }).click();
    await page.waitForTimeout(400);
    await shoot(page, `05-${theme}-split`);

    await page.getByRole("radio", { name: "Preview" }).click();
    await page.waitForTimeout(400);
    await shoot(page, `06-${theme}-preview`);

    await page.getByRole("radio", { name: "Write" }).click();
    await page.waitForTimeout(400);

    // Both slide-overs: everything the Post needs that is not the Post.
    await page.getByRole("button", { name: "Post details" }).click();
    await page.waitForTimeout(400);
    await shoot(page, `07-${theme}-details-drawer`);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Publish" }).click();
    await page.waitForTimeout(400);
    await shoot(page, `08-${theme}-publish-sheet`);
    await page.keyboard.press("Escape");
  });
}

// The rail withdraws and the state moves to a bottom bar within a thumb's
// reach — the one place the frame is allowed to fork.
test("editor frame — mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/dashboard/posts/new");
  await page.getByPlaceholder("Untitled Post").fill("Why the layers matter");
  await page.getByPlaceholder("Start writing. Markdown works; so does thinking out loud.").fill(CONTENT);
  await page.mouse.move(200, 400);
  await shoot(page, "09-mobile-written");
});
