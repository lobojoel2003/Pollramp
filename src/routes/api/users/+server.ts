import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { createUser, requireUser, validatePassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import { readJson } from '#lib/server/http.ts';
import { audit, parse } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireUser(event, 'admin');
	const rows =
		await db()`select id, email, name, role, created_at, disabled_at from users order by name`;
	return json({
		users: rows.map((r) => ({
			id: r.id as string,
			email: r.email as string,
			name: r.name as string,
			role: r.role as string,
			createdAt: (r.created_at as Date).toISOString(),
			disabled: r.disabled_at !== null
		}))
	});
};

const body = z.object({
	name: z.string().trim().min(1).max(200),
	email: z.email().max(200),
	role: z.enum(['admin', 'surveyor', 'viewer']),
	password: z.string()
});

export const POST: RequestHandler = async (event) => {
	const admin = requireUser(event, 'admin');
	const input = parse(body, await readJson(event.request));
	const problem = validatePassword(input.password);
	if (problem) error(400, problem);
	const [exists] =
		await db()`select 1 from users where lower(email) = ${input.email.toLowerCase()}`;
	if (exists) error(409, 'A user with that email already exists.');
	const user = await createUser(input);
	await audit(db(), admin, 'create', 'user', user.id, { role: user.role });
	return json({ user }, { status: 201 });
};
