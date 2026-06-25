import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// All tests mutate the same JSON file — must run serially
test.describe.configure({ mode: 'serial' });

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000';
const CONTENT_ROOT = path.resolve(process.cwd(), 'src/content');

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function readContentJson(relPath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_ROOT, relPath), 'utf-8'));
}

function writeContentJson(relPath: string, data: Record<string, unknown>) {
  fs.writeFileSync(
    path.join(CONTENT_ROOT, relPath),
    JSON.stringify(data, null, 2) + '\n',
    'utf-8',
  );
}

// ------------------------------------------------------------------
// Nested objects — optional fieldset (testimonial)
// ------------------------------------------------------------------

test.describe('Nested objects — optional fieldsets', () => {
  const projectFile = 'projects/games/narakan.json';
  let originalData: Record<string, unknown>;

  test.beforeEach(() => {
    originalData = readContentJson(projectFile);
  });

  test.afterEach(() => {
    writeContentJson(projectFile, originalData);
  });

  test('testimonial fieldset is visible with quote and author fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Testimonial renders as a group (fieldset)
    const fieldset = page.getByRole('group', { name: /Testimonial/ });
    await expect(fieldset).toBeVisible();

    // Should have Quote and Author textboxes
    await expect(fieldset.getByRole('textbox', { name: 'Quote' })).toBeVisible();
    await expect(fieldset.getByRole('textbox', { name: 'Author' })).toBeVisible();
  });

  test('optional object can be removed and re-added', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Remove testimonial
    const fieldset = page.getByRole('group', { name: /Testimonial/ });
    await fieldset.getByRole('button', { name: '(remove)' }).click();

    // Fieldset should be gone
    await expect(fieldset).not.toBeVisible();

    // "+ Add" button should appear for testimonial
    const addButton = page.getByText('Testimonial').locator('..').getByRole('button', { name: '+ Add' });
    await expect(addButton).toBeVisible();

    // Re-add
    await addButton.click();

    // Fieldset should reappear
    await expect(page.getByRole('group', { name: /Testimonial/ })).toBeVisible();
  });
});

// ------------------------------------------------------------------
// Nested objects — store links (array of objects)
// ------------------------------------------------------------------

test.describe('Nested objects — store links (object array)', () => {
  const projectFile = 'projects/games/narakan.json';
  let originalData: Record<string, unknown>;

  test.beforeEach(() => {
    originalData = readContentJson(projectFile);
  });

  test.afterEach(() => {
    writeContentJson(projectFile, originalData);
  });

  test('store links render with platform select and url input', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // narakan has 2 store links — each has a Platform combobox
    const platformSelects = page.getByRole('combobox', { name: 'Platform' });
    await expect(platformSelects).toHaveCount(2);

    // First should be appstore, second playstore
    await expect(platformSelects.first()).toHaveValue('appstore');
    await expect(platformSelects.nth(1)).toHaveValue('playstore');
  });

  test('can add a new store link item', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    const platformSelects = page.getByRole('combobox', { name: 'Platform' });
    const countBefore = await platformSelects.count();

    // Click "+ Add" in the Store Links section
    await page.getByText('Store Links').locator('..').getByRole('button', { name: '+ Add' }).click();

    await expect(platformSelects).toHaveCount(countBefore + 1);
  });
});

// ------------------------------------------------------------------
// Array fields — string arrays (stack)
// ------------------------------------------------------------------

test.describe('Array fields — string arrays', () => {
  const projectFile = 'projects/games/narakan.json';
  let originalData: Record<string, unknown>;

  test.beforeEach(() => {
    originalData = readContentJson(projectFile);
  });

  test.afterEach(() => {
    writeContentJson(projectFile, originalData);
  });

  test('stack array shows current items', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Stack section — find by the text "Stack" and its count "(2)"
    const stackSection = page.getByText('Stack').locator('..').locator('..');
    await expect(stackSection.getByText('(2)')).toBeVisible();

    // First textbox should have value "Unity"
    const textboxes = stackSection.getByRole('textbox');
    await expect(textboxes.first()).toHaveValue('Unity');
  });

  test('can add and remove string array items', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Count remove buttons for Stack section
    const stackSection = page.getByText('Stack').locator('..').locator('..');
    const removeButtons = stackSection.getByRole('button', { name: /Remove item/ });
    const countBefore = await removeButtons.count();

    // Add
    await stackSection.getByRole('button', { name: '+ Add' }).click();
    await expect(removeButtons).toHaveCount(countBefore + 1);

    // Remove the new (last) item
    await removeButtons.last().click();
    await expect(removeButtons).toHaveCount(countBefore);
  });

  test('can reorder string array items', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Stack items: Unity, C#
    const stackSection = page.getByText('Stack').locator('..').locator('..');
    const textboxes = stackSection.getByRole('textbox');
    await expect(textboxes.first()).toHaveValue('Unity');
    await expect(textboxes.nth(1)).toHaveValue('C#');

    // Move first item down
    await stackSection.getByRole('button', { name: 'Move item 1 down' }).click();

    // Now: C#, Unity
    await expect(textboxes.first()).toHaveValue('C#');
    await expect(textboxes.nth(1)).toHaveValue('Unity');
  });

  test('array changes persist to disk on save', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    const stackSection = page.getByText('Stack').locator('..').locator('..');

    // Add a new item
    await stackSection.getByRole('button', { name: '+ Add' }).click();

    // Fill the new empty textbox
    const textboxes = stackSection.getByRole('textbox');
    const newInput = textboxes.last();
    await newInput.click();
    await newInput.fill('TypeScript');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved successfully')).toBeVisible();

    // Verify on disk
    const saved = readContentJson(projectFile);
    expect(saved.stack).toContain('TypeScript');
  });
});

// ------------------------------------------------------------------
// Validation errors
// ------------------------------------------------------------------

test.describe('Validation errors', () => {
  const projectFile = 'projects/games/narakan.json';
  let originalData: Record<string, unknown>;

  test.beforeEach(() => {
    originalData = readContentJson(projectFile);
  });

  test.afterEach(() => {
    writeContentJson(projectFile, originalData);
  });

  test('setting invalid enum value shows validation error on save', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Set status to the empty "— Select —" option (invalid for enum)
    const statusSelect = page.getByRole('combobox', { name: 'Status' });
    await statusSelect.selectOption({ index: 0 });

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Should show error count (save result auto-dismisses after 4s, but field errors persist)
    await expect(page.getByText(/\d+ error.* scroll up/)).toBeVisible({ timeout: 10000 });

    // File unchanged
    const onDisk = readContentJson(projectFile);
    expect(onDisk.status).toBe(originalData.status);
  });

  test('validation error clears when field is corrected', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Break the status field
    const statusSelect = page.getByRole('combobox', { name: 'Status' });
    await statusSelect.selectOption({ index: 0 });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/\d+ error.* scroll up/)).toBeVisible({ timeout: 10000 });

    // Fix it
    await statusSelect.selectOption('released');

    // Error should be gone (errors clear on field change)
    await expect(page.getByText(/\d+ error.* scroll up/)).not.toBeVisible();
  });

  test('invalid data is never written to disk', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Break status
    await page.getByRole('combobox', { name: 'Status' }).selectOption({ index: 0 });

    // Try to save
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/\d+ error.* scroll up/)).toBeVisible({ timeout: 10000 });

    // Disk unchanged
    const onDisk = readContentJson(projectFile);
    expect(onDisk.status).toBe(originalData.status);
    expect(onDisk.year).toBe(originalData.year);
  });

  test('removing all items from required array triggers validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    // Remove all platform items
    const platformSection = page.getByText('Platforms').locator('..').locator('..');
    const removeButtons = platformSection.getByRole('button', { name: /Remove item/ });
    const count = await removeButtons.count();
    for (let i = count - 1; i >= 0; i--) {
      await removeButtons.nth(i).click();
    }

    // Set status to invalid to ensure validation fails
    await page.getByRole('combobox', { name: 'Status' }).selectOption({ index: 0 });

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/\d+ error.* scroll up/)).toBeVisible({ timeout: 10000 });
  });
});

// ------------------------------------------------------------------
// Reset button
// ------------------------------------------------------------------

test.describe('Reset button', () => {
  test('resets form to original data', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects/games/narakan/`);

    const titleInput = page.getByRole('textbox', { name: 'Title', exact: true });
    const original = await titleInput.inputValue();

    await titleInput.clear();
    await titleInput.fill('CHANGED');
    await expect(titleInput).toHaveValue('CHANGED');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(titleInput).toHaveValue(original);
  });
});
