import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CHECKLIST, compliant } from '../../scripts/demo-data.js';
import { ADMIN, VIEWER, apiLogin, login, uuid } from './helpers.ts';

test.describe.configure({ mode: 'serial' });

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('first run: create the administrator account', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/login/);
	await expect(page.getByText('Create the first administrator account')).toBeVisible();
	await page.getByLabel('Your name').fill(ADMIN.name);
	await page.getByLabel('Email').fill(ADMIN.email);
	await page.getByLabel('Password').fill(ADMIN.password);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByRole('heading', { name: 'Add your first polling place' })).toBeVisible();
});

test('login page is accessible and rejects bad passwords', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	const axe = await new AxeBuilder({ page }).withTags(WCAG).analyze();
	expect(axe.violations).toEqual([]);
	await page.getByLabel('Email').fill(ADMIN.email);
	await page.getByLabel('Password').fill('wrong password!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toContainText('do not match');
});

test('add a site, walk the survey, and get an election-day fix', async ({ page }) => {
	await login(page);
	await page.getByRole('link', { name: 'Add a site' }).first().click();
	await page.getByLabel('Name').fill('Lakeview Elementary School');
	await page.getByLabel('Street address').fill('10 Lakeview Drive');
	await page.getByLabel('City').fill('Richmond');
	await page.getByLabel('State').selectOption('VA');
	await page.getByLabel('Precincts').fill('401, 402');
	await page.getByLabel('Latitude').fill('37.55');
	await page.getByLabel('Longitude').fill('-77.45');
	await page.getByRole('button', { name: 'Add site' }).click();

	await expect(
		page.getByRole('heading', { level: 1, name: 'Lakeview Elementary School' })
	).toBeVisible();
	await expect(page.getByLabel('Checklist')).toHaveValue(/us-va/);
	await page.getByRole('button', { name: 'Start survey' }).click();
	await page.getByRole('link', { name: 'Start at parking' }).click();

	// Yes/no answers advance on their own.
	await expect(
		page.getByRole('heading', { name: 'Is parking provided for voters at this site?' })
	).toBeVisible();
	await page.getByRole('button', { name: /^✓ Yes|Yes$/ }).click();
	await expect(page.getByRole('heading', { name: /How many parking spaces/ })).toBeVisible();
	await page.locator('#answer').fill('120');
	await page.getByRole('button', { name: 'Next →' }).click();

	// 120 spaces require 5 accessible spaces (ADA Table 208.2).
	await expect(
		page.getByRole('heading', { name: 'How many accessible parking spaces are there?' })
	).toBeVisible();
	await expect(page.getByText('Standard: at least 5')).toBeVisible();
	await page.locator('#answer').fill('2');
	await expect(page.getByText('Does not meet the standard')).toBeVisible();
	await expect(page.getByText('Bring 12 traffic cones (28-inch)')).toBeVisible();

	// Jump to the entrance threshold: 1 3/4 in needs a 2-inch threshold ramp.
	const surveyId = page.url().split('/surveys/')[1].split('/')[0];
	await page.goto(`/surveys/${surveyId}/entrance.threshold`);
	await expect(
		page.getByRole('heading', { name: 'How high is the threshold at the entrance door?' })
	).toBeVisible();
	await expect(page.getByRole('img', { name: /threshold/i })).toBeVisible();
	await page.locator('#answer').fill('1 3/4');
	await expect(page.getByText('= 1 3/4 in')).toBeVisible();
	await expect(
		page.getByText('Bring one 2-inch threshold ramp and one “Accessible entrance” sign with arrow.')
	).toBeVisible();

	const axe = await new AxeBuilder({ page }).withTags(WCAG).analyze();
	expect(axe.violations).toEqual([]);

	await page.goto(`/surveys/${surveyId}/review`);
	await expect(page.getByRole('heading', { name: 'Survey in progress' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Submit survey' })).toBeDisabled();
});

test('complete survey via sync API, then see status, kit list and exports', async ({
	page,
	request
}) => {
	await apiLogin(request);
	const siteId = uuid();
	const now = new Date().toISOString();
	const site = {
		id: siteId,
		name: 'Harbor Street Library',
		address: '5 Harbor Street',
		city: 'Richmond',
		state: 'VA',
		postalCode: '23221',
		lat: 37.53,
		lng: -77.47,
		precincts: ['501'],
		updatedAt: now
	};
	expect((await request.put(`/api/sites/${siteId}`, { data: site })).ok()).toBe(true);
	const responses = {
		...compliant(),
		'entrance.threshold': { value: 1.75 },
		'route.level-change': { value: 4 }
	};
	const surveyId = uuid();
	const res = await request.put(`/api/surveys/${surveyId}`, {
		data: {
			id: surveyId,
			siteId,
			checklist: CHECKLIST,
			state: 'submitted',
			surveyor: 'E2E',
			election: 'Test',
			responses,
			startedAt: now,
			submittedAt: now,
			updatedAt: now
		}
	});
	expect(res.ok()).toBe(true);
	const { survey } = (await res.json()) as { survey: { result: { status: string } } };
	expect(survey.result.status).toBe('fixable');

	await login(page);
	await page.getByRole('link', { name: /Harbor Street Library/ }).click();
	await expect(page.getByText('Accessible with election-day fixes').first()).toBeVisible();
	await expect(
		page.getByRole('heading', { name: /Barriers and election-day fixes \(2\)/ })
	).toBeVisible();

	await page.getByRole('link', { name: 'Election-day kit' }).click();
	await expect(page.getByRole('cell', { name: '2-inch Threshold ramp' })).toBeVisible();
	await expect(page.getByRole('cell', { name: '4-foot Portable ramp' })).toBeVisible();

	const csv = await request.get('/api/export/results.csv');
	expect(csv.headers()['content-type']).toContain('text/csv');
	expect(await csv.text()).toContain('Harbor Street Library');
});

test('publish a voter page that is accessible to screen readers', async ({ page, browser }) => {
	await login(page);
	await page.getByRole('link', { name: /Harbor Street Library/ }).click();
	await page.getByRole('button', { name: 'Edit voter information' }).click();
	await page
		.getByLabel('Where is the accessible entrance?')
		.fill('Use the ramp to the side door on Harbor Street.');
	await page.getByLabel('Accessibility contact').fill('Call (555) 010-0199');
	await page.getByRole('button', { name: 'Save' }).click();
	await page.getByRole('button', { name: 'Publish' }).click();
	await expect(page.getByText('Published. It will be live after the next sync.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'All synced' })).toBeVisible({ timeout: 15_000 });

	const voterContext = await browser.newContext();
	const voter = await voterContext.newPage();
	await voter.goto('/p');
	await expect(
		voter.getByRole('heading', { name: 'Is my polling place accessible?' })
	).toBeVisible();
	await voter.getByRole('link', { name: /Harbor Street Library/ }).click();
	await expect(
		voter.getByRole('heading', { level: 1, name: 'Harbor Street Library' })
	).toBeVisible();
	await expect(voter.getByText('Use the ramp to the side door on Harbor Street.')).toBeVisible();
	await expect(
		voter.getByText('A threshold ramp will be in place at the entrance on election day.')
	).toBeVisible();
	const axe = await new AxeBuilder({ page: voter }).withTags(WCAG).analyze();
	expect(axe.violations).toEqual([]);

	const geo = (await (await voter.request.get('/api/public/sites.geojson')).json()) as {
		features: { properties: { name: string } }[];
	};
	expect(geo.features.map((f) => f.properties.name)).toContain('Harbor Street Library');
	await voterContext.close();
});

test('dashboard is accessible and filters by status', async ({ page }) => {
	await login(page);
	await expect(page.getByRole('link', { name: /Lakeview Elementary School/ })).toBeVisible();
	await page.getByRole('button', { name: /Fixable/ }).click();
	await expect(page.getByRole('link', { name: /Harbor Street Library/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Lakeview Elementary School/ })).toHaveCount(0);
	const axe = await new AxeBuilder({ page }).withTags(WCAG).exclude('.maplibregl-canvas').analyze();
	expect(axe.violations).toEqual([]);
});

test('import sites from a CSV spreadsheet', async ({ page }) => {
	await login(page);
	await page.getByRole('link', { name: 'Import' }).first().click();
	await page.locator('input[type=file]').setInputFiles({
		name: 'sites.csv',
		mimeType: 'text/csv',
		buffer: Buffer.from(
			'Polling Place,Address,City,State,Zip,Latitude,Longitude,Precinct\n' +
				'Cedar Grove Hall,12 Cedar Lane,Richmond,VA,23222,37.56,-77.43,601\n' +
				'Pinecrest Church,40 Pine Road,Richmond,VA,23223,37.52,-77.41,602;603\n'
		)
	});
	await expect(page.getByRole('heading', { name: '2 sites ready to import' })).toBeVisible();
	await page.getByRole('button', { name: 'Import 2 sites' }).click();
	await expect(page.getByText('Imported 2 sites')).toBeVisible();
	await page.goto('/');
	await expect(page.getByRole('link', { name: /Pinecrest Church/ })).toBeVisible();
});

test('roles: signed-out and read-only users cannot change data', async ({
	request,
	playwright,
	baseURL
}) => {
	const anonymous = await playwright.request.newContext({ baseURL });
	const id = uuid();
	const body = { id, name: 'Nope', updatedAt: new Date().toISOString() };
	expect((await anonymous.put(`/api/sites/${id}`, { data: body })).status()).toBe(401);
	expect((await anonymous.get('/api/sync')).status()).toBe(401);

	await apiLogin(request);
	expect((await request.post('/api/users', { data: { ...VIEWER, role: 'viewer' } })).status()).toBe(
		201
	);
	const viewer = await playwright.request.newContext({ baseURL });
	await apiLogin(viewer, VIEWER);
	expect((await viewer.get('/api/sync')).ok()).toBe(true);
	expect((await viewer.put(`/api/sites/${id}`, { data: body })).status()).toBe(403);
	expect(
		(
			await viewer.post('/api/users', {
				data: { ...VIEWER, email: 'x@test.example', role: 'admin' }
			})
		).status()
	).toBe(403);
	await anonymous.dispose();
	await viewer.dispose();
});

test('keeps working offline and syncs when back online', async ({ page, context }) => {
	await login(page);
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
		timeout: 20_000
	});
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByText('Working offline')).toBeVisible();
	await page.getByRole('link', { name: /Cedar Grove Hall/ }).click();
	await page.getByRole('button', { name: 'Start survey' }).click();
	await page.getByRole('link', { name: 'Start at parking' }).click();
	await page.getByRole('button', { name: /No$/ }).click();
	await expect(page.getByRole('button', { name: /Offline · \d+ to sync/ })).toBeVisible();

	await context.setOffline(false);
	await page.evaluate(() => window.dispatchEvent(new Event('online')));
	await expect(page.getByRole('button', { name: 'All synced' })).toBeVisible({ timeout: 20_000 });
});
