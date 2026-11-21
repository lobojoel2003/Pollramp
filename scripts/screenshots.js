#!/usr/bin/env node
// Captures the README screenshots from a running Pollramp server loaded with demo data.
//
//   pnpm build && node build          # with POLLRAMP_MAP_STYLE_URL etc. set
//   node scripts/seed-demo.js
//   POLLRAMP_URL=http://localhost:3000 node scripts/screenshots.js
//
// Images are written to docs/images at 2× pixel density.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const BASE = (process.env.POLLRAMP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.POLLRAMP_EMAIL ?? 'admin@example.org';
const PASSWORD = process.env.POLLRAMP_PASSWORD ?? 'pollramp-demo-password';
const OUT = fileURLToPath(new URL('../docs/images/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
	executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
});

/** @param {import('@playwright/test').Page} page */
async function login(page) {
	await page.goto(`${BASE}/login`);
	await page.getByLabel('Email').fill(EMAIL);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL(`${BASE}/`);
	await page.getByRole('heading', { name: 'Polling places' }).waitFor();
	await page.getByRole('button', { name: 'All synced' }).waitFor({ timeout: 20_000 });
}

/** @param {import('@playwright/test').Page} page @param {string} name */
async function shot(page, name, options = {}) {
	// Let background sync settle so the header shows "All synced".
	if (await page.locator('.sync').count()) {
		await page
			.getByRole('button', { name: 'All synced' })
			.waitFor({ timeout: 15_000 })
			.catch(() => {});
	}
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}${name}.png`, ...options });
	console.log(`✓ docs/images/${name}.png`);
}

/** @param {import('@playwright/test').Page} page @param {string} siteName */
async function openSurveyAt(page, siteName, itemId) {
	await page.goto(`${BASE}/`);
	await page.getByRole('link', { name: new RegExp(siteName) }).click();
	const start = page.getByRole('button', { name: 'Start survey' });
	const resume = page.getByRole('link', { name: 'Continue survey' });
	await start.or(resume).first().waitFor();
	if (await start.isVisible()) await start.click();
	else await resume.click();
	await page.waitForURL(/\/surveys\//);
	const id = page.url().split('/surveys/')[1].split('/')[0];
	await page.goto(`${BASE}/surveys/${id}/${itemId}`);
	await page.locator('h1').first().waitFor();
	return id;
}

// ---------------------------------------------------------------- desktop
{
	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
		deviceScaleFactor: 2,
		colorScheme: 'light'
	});
	const page = await context.newPage();
	await login(page);
	await page.locator('.map-marker').first().waitFor();
	await page.waitForTimeout(1500);
	await shot(page, 'dashboard');

	await page.getByRole('link', { name: /Oak Hill Elementary School/ }).click();
	await page.getByRole('heading', { name: /Barriers and election-day fixes/ }).waitFor();
	await page.setViewportSize({ width: 1280, height: 1360 });
	await shot(page, 'site');
	await page.setViewportSize({ width: 1280, height: 800 });

	await page.getByRole('link', { name: 'Election-day kit' }).click();
	await page.getByRole('heading', { name: 'What to buy or pull from storage' }).waitFor();
	await shot(page, 'kit');

	await page.goto(`${BASE}/settings/checklists`);
	await page.getByLabel('Checklist').selectOption({ label: 'Federal + California' });
	const card = page.getByText('parking.space-width', { exact: true });
	await card.waitFor();
	await card.evaluate((el) => {
		const top = el.closest('article')?.getBoundingClientRect().top ?? 0;
		window.scrollTo(0, window.scrollY + top - 96);
	});
	await shot(page, 'checklist-browser');
	await context.close();
}

// ---------------------------------------------------------------- phone
for (const scheme of /** @type {const} */ (['light', 'dark'])) {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
		colorScheme: scheme
	});
	const page = await context.newPage();
	await login(page);
	await openSurveyAt(page, 'Brookfield Elementary School', 'entrance.threshold');
	await page.locator('#answer').fill('1 3/4');
	await page.getByText('Added to the election-day kit').waitFor();
	await page.evaluate(() => window.scrollTo(0, 0));
	if (scheme === 'light') {
		await shot(page, 'survey-threshold');
		await page.getByText('Added to the election-day kit').scrollIntoViewIfNeeded();
		await shot(page, 'survey-threshold-fix');

		const id = page.url().split('/surveys/')[1].split('/')[0];
		await page.goto(`${BASE}/surveys/${id}/entrance.clear-width`);
		await page.locator('#answer').fill('34');
		await page.getByText('Meets the standard').waitFor();
		await page.evaluate(() => window.scrollTo(0, 0));
		await shot(page, 'survey-door');

		await page.goto(`${BASE}/p/oak-hill-elementary-school`);
		await page.getByRole('heading', { level: 1 }).waitFor();
		await shot(page, 'voter-page');
		await page.getByRole('heading', { name: 'Entrance', exact: true }).evaluate((el) => {
			window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 24);
		});
		await shot(page, 'voter-features');
	} else {
		await shot(page, 'survey-threshold-dark');
	}
	await context.close();
}

await browser.close();
