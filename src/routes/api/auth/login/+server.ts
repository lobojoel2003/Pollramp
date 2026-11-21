import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import {
	clearLoginFailures,
	createSession,
	loginThrottle,
	recordLoginFailure,
	verifyPassword
} from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import { clientKey, readJson } from '#lib/server/http.ts';
import { parse } from '#lib/server/repo.ts';
import type { Role, User } from '#lib/model.ts';
import type { RequestHandler } from './$types';

const body = z.object({ email: z.string().trim().max(200), password: z.string().max(200) });

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const { email, password } = parse(body, await readJson(request));
	const key = `${email.toLowerCase()}|${clientKey(request, getClientAddress)}`;
	const throttle = loginThrottle(key);
	if (!throttle.allowed)
		error(429, `Too many attempts. Try again in ${Math.ceil(throttle.retryAfter / 60)} minutes.`);

	const [row] = await db()`select id, email, name, role, password_hash from users
		where lower(email) = ${email.toLowerCase()} and disabled_at is null`;
	// Always run a hash comparison so response time does not reveal whether the email exists.
	const ok = await verifyPassword(
		password,
		(row?.password_hash as string) ??
			'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
	);
	if (!row || !ok) {
		recordLoginFailure(key);
		error(401, 'That email and password do not match.');
	}
	clearLoginFailures(key);
	await createSession(row.id as string, cookies, request.headers.get('user-agent') ?? '');
	const user: User = {
		id: row.id as string,
		email: row.email as string,
		name: row.name as string,
		role: row.role as Role
	};
	return json({ user });
};
