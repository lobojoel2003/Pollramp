import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * End-to-end tests run against the production build (`pnpm build` first) and a disposable
 * Postgres database (TEST_DATABASE_URL), which tests/e2e/server.js resets before starting.
 */
export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'off',
		screenshot: 'only-on-failure',
		launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined }
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: '**/mobile.e2e.ts' },
		{
			name: 'mobile',
			use: { ...devices['Pixel 7'] },
			testMatch: '**/mobile.e2e.ts',
			dependencies: ['desktop']
		}
	],
	webServer: {
		command: 'node tests/e2e/server.js',
		url: `http://localhost:${PORT}/api/health`,
		reuseExistingServer: false,
		timeout: 90_000,
		env: { PORT: String(PORT) }
	}
});
