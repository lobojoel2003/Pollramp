import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const ADMIN = {
	name: 'Avery Admin',
	email: 'admin@test.example',
	password: 'e2e-admin-password'
};
export const VIEWER = {
	name: 'Vic Viewer',
	email: 'viewer@test.example',
	password: 'e2e-viewer-password'
};

export async function login(page: Page, user = ADMIN): Promise<void> {
	await page.goto('/login');
	await page.getByLabel('Email').fill(user.email);
	await page.getByLabel('Password').fill(user.password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: 'Polling places' })).toBeVisible();
}

/** Sign an API request context in (cookies are kept on the context). */
export async function apiLogin(request: APIRequestContext, user = ADMIN): Promise<void> {
	const res = await request.post('/api/auth/login', {
		data: { email: user.email, password: user.password }
	});
	expect(res.ok()).toBe(true);
}

export function uuid(): string {
	return crypto.randomUUID();
}
