// e2e/upload-flow.spec.ts
import {  test, expect } from '@playwright/test';
import { testBrowser } from '../test-utils/playwright/browser-utils';

test('user uploads statement and saves rows', async ({ page }) => {
  const browser = await testBrowser();
  const context = await browser.newContext();

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/bank.pdf');

  await page.click('button:text("Upload Statement")');

  await expect(page.locator('table')).toBeVisible();

  await page.click('button:text("Save Transactions")');
  await expect(page.locator('text=Saved 1 transactions')).toBeVisible();
});
