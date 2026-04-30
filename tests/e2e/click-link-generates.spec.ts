import { test, expect } from '@playwright/test';

/* ============================================================================
   Smoke flow: landing → random plate → article → click an inline link → second
   article generates. Requires the dev server + a populated DB or a working
   ANTHROPIC_API_KEY/GROQ_API_KEY. CI populates these via secrets.
   ============================================================================ */

test('click an inline link in an article and the linked plate is written', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Random plate (may fall through to generation on a fresh DB).
  await page.click('text=Open a random plate');
  await page.waitForURL(/\/wiki\//, { timeout: 60_000 });
  await expect(page.locator('article')).toBeVisible();

  // Wait for the article body to settle (cache-miss flow streams in).
  await expect(page.locator('.skeleton').first()).toBeHidden({ timeout: 60_000 }).catch(() => {});

  const firstUrl = page.url();
  const firstInlineLink = page.locator('article a[href^="/wiki/"]').first();
  await expect(firstInlineLink).toBeVisible();

  await firstInlineLink.click();
  await page.waitForURL((url) => url.toString() !== firstUrl, { timeout: 90_000 });
  await expect(page.locator('article')).toBeVisible();
});
