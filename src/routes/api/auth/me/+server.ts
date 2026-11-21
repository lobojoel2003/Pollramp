import { json } from '@sveltejs/kit';
import { countUsers } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

/** Current user, plus whether the first-run setup screen should be offered. */
export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user) return json({ user: locals.user, needsSetup: false });
	return json({ user: null, needsSetup: (await countUsers()) === 0 });
};
