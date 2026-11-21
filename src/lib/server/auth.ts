import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { error, type Cookies, type RequestEvent } from '@sveltejs/kit';
import type { Role, User } from '../model.ts';
import { config } from './config.ts';
import { db } from './db.ts';

const scryptAsync = promisify(scrypt) as (
	password: string,
	salt: Buffer,
	keylen: number,
	options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 32;

export const SESSION_COOKIE = 'pollramp_session';

/** `scrypt$N$r$p$salt$hash` (base64url). Format shared with scripts/create-user.js. */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scryptAsync(password, salt, KEYLEN, {
		N,
		r: R,
		p: P,
		maxmem: 64 * 1024 * 1024
	});
	return ['scrypt', N, R, P, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, n, r, p, salt, hash] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'base64url');
	const actual = await scryptAsync(password, Buffer.from(salt, 'base64url'), expected.length, {
		N: Number(n),
		r: Number(r),
		p: Number(p),
		maxmem: 64 * 1024 * 1024
	});
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validatePassword(password: string): string | null {
	if (password.length < 10) return 'Use at least 10 characters.';
	if (password.length > 200) return 'Use at most 200 characters.';
	return null;
}

function tokenId(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
	userId: string,
	cookies: Cookies,
	userAgent = ''
): Promise<void> {
	const token = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);
	await db()`insert into sessions (id, user_id, expires_at, user_agent)
		values (${tokenId(token)}, ${userId}, ${expires}, ${userAgent.slice(0, 300)})`;
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: config.secureCookies,
		expires
	});
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await db()`delete from sessions where id = ${tokenId(token)}`;
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function userFromSession(cookies: Cookies): Promise<User | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	const rows = await db()`
		select u.id, u.email, u.name, u.role
		from sessions s join users u on u.id = s.user_id
		where s.id = ${tokenId(token)} and s.expires_at > now() and u.disabled_at is null`;
	const row = rows[0];
	if (!row) return null;
	return {
		id: row.id as string,
		email: row.email as string,
		name: row.name as string,
		role: row.role as Role
	};
}

const RANK: Record<Role, number> = { viewer: 0, surveyor: 1, admin: 2 };

/** Throw 401/403 unless the request has a user with at least `role`. */
export function requireUser(event: Pick<RequestEvent, 'locals'>, role: Role = 'viewer'): User {
	const user = event.locals.user;
	if (!user) error(401, 'Sign in to continue.');
	if (RANK[user.role] < RANK[role]) error(403, `This needs the ${role} role.`);
	return user;
}

export async function countUsers(): Promise<number> {
	const [row] = await db()`select count(*)::int as n from users`;
	return row.n as number;
}

export async function createUser(input: {
	email: string;
	name: string;
	role: Role;
	password: string;
}): Promise<User> {
	const id = crypto.randomUUID();
	const hash = await hashPassword(input.password);
	const email = input.email.trim().toLowerCase();
	await db()`insert into users (id, email, name, role, password_hash)
		values (${id}, ${email}, ${input.name.trim()}, ${input.role}, ${hash})`;
	return { id, email, name: input.name.trim(), role: input.role };
}

/** Simple in-memory brute-force guard for the login endpoint (per email + IP). */
const attempts = new Map<string, { count: number; until: number }>();

export function loginThrottle(key: string): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	const entry = attempts.get(key);
	if (entry && entry.until > now && entry.count >= 5) {
		return { allowed: false, retryAfter: Math.ceil((entry.until - now) / 1000) };
	}
	return { allowed: true, retryAfter: 0 };
}

export function recordLoginFailure(key: string): void {
	const now = Date.now();
	const entry = attempts.get(key);
	if (!entry || entry.until < now) attempts.set(key, { count: 1, until: now + 15 * 60 * 1000 });
	else entry.count += 1;
	if (attempts.size > 10_000) {
		for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
	}
}

export function clearLoginFailures(key: string): void {
	attempts.delete(key);
}
