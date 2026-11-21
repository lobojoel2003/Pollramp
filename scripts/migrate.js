#!/usr/bin/env node
// Applies pending SQL migrations from ./migrations. The server also does this on start-up
// (unless POLLRAMP_MIGRATE=false); use this for controlled deploys.
//
//   DATABASE_URL=postgres://… node scripts/migrate.js
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
const url = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/pollramp';
const sql = postgres(url, { max: 1, onnotice: () => {} });

const files = readdirSync(dir)
	.filter((f) => f.endsWith('.sql'))
	.sort();

try {
	const applied = await sql.begin(async (tx) => {
		await tx`select pg_advisory_xact_lock(727201)`;
		await tx`create table if not exists schema_migrations (
			version text primary key,
			applied_at timestamptz not null default now()
		)`;
		const done = new Set((await tx`select version from schema_migrations`).map((r) => r.version));
		const ran = [];
		for (const file of files) {
			const version = file.replace(/\.sql$/, '');
			if (done.has(version)) continue;
			await tx.unsafe(readFileSync(dir + file, 'utf8'));
			await tx`insert into schema_migrations (version) values (${version})`;
			ran.push(version);
		}
		return ran;
	});
	console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
} finally {
	await sql.end();
}
