import { json } from '@sveltejs/kit';
import { build } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import type { RequestHandler } from './$types';

/** Liveness + readiness probe used by Docker, load balancers and the app's sync indicator. */
export const GET: RequestHandler = async () => {
	let database = 'up';
	try {
		await db()`select 1`;
	} catch {
		database = 'down';
	}
	return json(
		{ ok: database === 'up', database, ...build },
		{ status: database === 'up' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
	);
};
