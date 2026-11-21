import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { countUsers, createSession, createUser, validatePassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import { readJson } from '#lib/server/http.ts';
import { audit, parse } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

const body = z.object({
	name: z.string().trim().min(1).max(200),
	email: z.email().max(200),
	password: z.string()
});

/** First-run only: create the first administrator when the database has no users. */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const input = parse(body, await readJson(request));
	if ((await countUsers()) > 0) error(409, 'Setup is already complete. Sign in instead.');
	const problem = validatePassword(input.password);
	if (problem) error(400, problem);
	const user = await createUser({ ...input, role: 'admin' });
	await audit(db(), user, 'setup', 'user', user.id);
	await createSession(user.id, cookies, request.headers.get('user-agent') ?? '');
	return json({ user }, { status: 201 });
};
