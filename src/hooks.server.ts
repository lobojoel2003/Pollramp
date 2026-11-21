import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { countUsers, createUser, userFromSession } from '#lib/server/auth.ts';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { migrate } from '#lib/server/migrate.ts';

/** Runs once when the server starts: apply migrations, then bootstrap the first admin. */
/** Wait for Postgres (e.g. while docker compose is still starting it) before migrating. */
async function waitForDatabase(attempts = 30): Promise<void> {
	for (let i = 1; ; i++) {
		try {
			await db()`select 1`;
			return;
		} catch (error) {
			if (i >= attempts) throw error;
			console.log(`[pollramp] waiting for the database (${i}/${attempts})…`);
			await new Promise((r) => setTimeout(r, 2000));
		}
	}
}

export const init: ServerInit = async () => {
	await waitForDatabase();
	if (config.migrate) {
		const applied = await migrate(db());
		if (applied.length) console.log(`[pollramp] applied migrations: ${applied.join(', ')}`);
	}
	if (config.adminEmail && config.adminPassword && (await countUsers()) === 0) {
		await createUser({
			email: config.adminEmail,
			name: 'Administrator',
			role: 'admin',
			password: config.adminPassword
		});
		console.log(`[pollramp] created admin account ${config.adminEmail}`);
	}
	// Opportunistic cleanup of expired sessions.
	await db()`delete from sessions where expires_at < now()`;
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await userFromSession(event.cookies);

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(self), geolocation=(self), microphone=(), payment=(), usb=()'
	);
	if (event.url.pathname.startsWith('/api/')) {
		response.headers.set('Cache-Control', response.headers.get('Cache-Control') ?? 'no-store');
	}
	return response;
};

export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind === 'unknown') {
		console.error(`[pollramp] ${event.request.method} ${event.url.pathname}`, error);
		return { status: 500, message: 'Something went wrong on the server.' };
	}
	return error;
};
