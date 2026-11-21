import { error, json } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { changesSince } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

/** Pull everything that changed on the server since `?since=<ISO time>` (omit for a full sync). */
export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const raw = event.url.searchParams.get('since');
	const since = raw ? new Date(raw) : null;
	if (since && Number.isNaN(since.getTime())) error(400, 'Invalid "since" timestamp.');
	return json(await changesSince(since));
};
