import { expect, test } from '@playwright/test';
import { login } from './helpers.ts';

test('surveying on a phone: big targets, sticky navigation', async ({ page }) => {
	await login(page);
	await page.getByRole('link', { name: /Pinecrest Church/ }).click();
	await page.getByRole('button', { name: 'Start survey' }).click();
	await page.getByRole('link', { name: 'Start at parking' }).click();

	const yes = page.getByRole('button', { name: /Yes$/ });
	const box = await yes.boundingBox();
	expect(box!.height).toBeGreaterThanOrEqual(48);
	const next = page.getByRole('button', { name: 'Next →' });
	await expect(next).toBeInViewport();
	await yes.click();
	await expect(page.getByRole('heading', { name: /How many parking spaces/ })).toBeVisible();
	await page.getByRole('button', { name: 'One more' }).click();
	await expect(page.locator('#answer')).toHaveValue('1');
});
