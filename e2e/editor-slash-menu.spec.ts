import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './config';

// Regression coverage for ticket 07 — the slash menu is the other half of
// ticket 06's toolbar rule (headings/lists/quote/code dropped from the
// toolbar on the theory a Creator reaches them faster from the keyboard).
// This spec exercises the ways that argument breaks: opening mid-line,
// losing the typed `/` on Escape, filtering, and keyboard-only selection.
test.describe('slash menu', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/posts/new');
    await page.getByPlaceholder('Enter post title...').fill('Slash Menu E2E');
  });

  test('typing / at the start of an empty line opens a filterable, keyboard-operable menu', async ({
    page,
  }) => {
    const content = page.getByPlaceholder('Write your post content in Markdown...');
    await content.click();
    await content.pressSequentially('/');

    const listbox = page.getByRole('listbox', { name: 'Insert a block' });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option')).toHaveCount(8);

    // Typing after the `/` narrows the list to the options whose keywords match.
    await content.pressSequentially('head');
    await expect(listbox.getByRole('option')).toHaveCount(3);
    await expect(listbox.getByRole('option', { name: 'Heading 1' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'Bulleted list' })).toHaveCount(0);

    // Arrow keys move the active option (announced via aria-activedescendant,
    // the listbox-with-an-active-option shape) rather than the text caret.
    await content.press('ArrowDown');
    const activeDescendant = await content.getAttribute('aria-activedescendant');
    const heading2Id = await listbox.getByRole('option', { name: 'Heading 2' }).getAttribute('id');
    expect(activeDescendant).toBe(heading2Id);

    // Enter inserts the active option's markdown and closes the menu, with
    // the caret left where the Creator would continue typing.
    await content.press('Enter');
    await expect(listbox).not.toBeVisible();
    await expect(content).toHaveValue('## ');

    await content.pressSequentially('Second heading');
    await expect(content).toHaveValue('## Second heading');
  });

  test('Escape closes the menu and leaves the typed / as ordinary text', async ({ page }) => {
    const content = page.getByPlaceholder('Write your post content in Markdown...');
    await content.click();
    await content.pressSequentially('/usr');

    // "usr" narrows to no matching option, but the menu stays open (showing
    // "No matches") until the Creator explicitly dismisses it.
    const listbox = page.getByRole('listbox', { name: 'Insert a block' });
    await expect(listbox).toBeVisible();

    await content.press('Escape');
    await expect(listbox).not.toBeVisible();
    await expect(content).toHaveValue('/usr');

    // The textarea keeps ordinary typing after the menu is dismissed — the
    // rest of a file path, in this case — and it stays plain text.
    await content.pressSequentially('/local/bin is where it lives.');
    await expect(content).toHaveValue('/usr/local/bin is where it lives.');
  });

  test('the menu never opens mid-line', async ({ page }) => {
    const content = page.getByPlaceholder('Write your post content in Markdown...');
    await content.click();
    await content.pressSequentially('See the docs at https:/');

    const listbox = page.getByRole('listbox', { name: 'Insert a block' });
    await expect(listbox).not.toBeVisible();
    await expect(content).toHaveValue('See the docs at https:/');
  });

  test('the heading keyboard shortcut still works while no menu is open', async ({ page }) => {
    const content = page.getByPlaceholder('Write your post content in Markdown...');
    await content.click();
    await content.pressSequentially('A line of prose');
    await content.press('ControlOrMeta+Alt+Digit1');
    await expect(content).toHaveValue('# A line of prose');

    // Confirms the slash menu's key handling didn't swallow the shortcut it
    // sits alongside: no listbox opened, and the textarea is still live.
    await expect(page.getByRole('listbox', { name: 'Insert a block' })).not.toBeVisible();
    await content.press('End');
    await content.pressSequentially(' continues.');
    await expect(content).toHaveValue('# A line of prose continues.');
  });
});
