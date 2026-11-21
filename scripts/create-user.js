#!/usr/bin/env node
// Creates a Pollramp account from the command line (for example the first administrator
// in a scripted deploy). The password is read from POLLRAMP_PASSWORD or prompted for.
//
//   DATABASE_URL=postgres://… node scripts/create-user.js --email you@example.gov \
//     --name "Your Name" --role admin
import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { parseArgs, promisify } from 'node:util';
import postgres from 'postgres';

const { values } = parseArgs({
	options: {
		email: { type: 'string' },
		name: { type: 'string' },
		role: { type: 'string', default: 'surveyor' }
	}
});

if (!values.email || !values.name || !['admin', 'surveyor', 'viewer'].includes(values.role)) {
	console.error(
		'Usage: create-user.js --email <email> --name <name> [--role admin|surveyor|viewer]'
	);
	process.exit(2);
}

let password = process.env.POLLRAMP_PASSWORD;
if (!password) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	password = await rl.question('Password (at least 10 characters): ');
	rl.close();
}
if (password.length < 10) {
	console.error('The password must be at least 10 characters.');
	process.exit(2);
}

// Same format as src/lib/server/auth.ts: scrypt$N$r$p$salt$hash
const N = 2 ** 15;
const salt = randomBytes(16);
const hash = await promisify(scrypt)(password, salt, 32, {
	N,
	r: 8,
	p: 1,
	maxmem: 64 * 1024 * 1024
});
const stored = [
	'scrypt',
	N,
	8,
	1,
	salt.toString('base64url'),
	Buffer.from(hash).toString('base64url')
].join('$');

const sql = postgres(
	process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/pollramp',
	{
		max: 1,
		onnotice: () => {}
	}
);
try {
	await sql`insert into users (id, email, name, role, password_hash)
		values (${randomUUID()}, ${values.email.trim().toLowerCase()}, ${values.name.trim()}, ${values.role}, ${stored})`;
	console.log(`Created ${values.role} ${values.email}.`);
} catch (error) {
	console.error(error.code === '23505' ? 'A user with that email already exists.' : error.message);
	process.exitCode = 1;
} finally {
	await sql.end();
}
