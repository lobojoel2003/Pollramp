#!/usr/bin/env node
// Renders the PNG app icons from the SVG logo with the preinstalled Playwright Chromium.
//   node scripts/render-icons.js
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}static/favicon.svg`, 'utf8');
// Maskable icons need the artwork inside the central 80% safe zone on a full-bleed background.
const maskable = svg
	.replace(
		'<rect width="64" height="64" rx="16" fill="#0b5e55"/>',
		'<rect width="64" height="64" fill="#0b5e55"/><g transform="translate(6.4 6.4) scale(0.8)">'
	)
	.replace('</svg>', '</g></svg>');

const targets = [
	{ file: 'static/icons/icon-192.png', size: 192, art: svg },
	{ file: 'static/icons/icon-512.png', size: 512, art: svg },
	{ file: 'static/icons/maskable-512.png', size: 512, art: maskable },
	{ file: 'static/icons/apple-touch-icon.png', size: 180, art: maskable },
	{ file: 'static/favicon-32.png', size: 32, art: svg }
];

// PLAYWRIGHT_CHROMIUM_PATH lets you reuse an existing Chromium instead of `playwright install`.
const browser = await chromium.launch({
	executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
});
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { file, size, art } of targets) {
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<html><body style="margin:0;background:transparent">${art.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`
	);
	writeFileSync(`${root}${file}`, await page.locator('svg').screenshot({ omitBackground: true }));
	console.log(`wrote ${file}`);
}
await browser.close();
