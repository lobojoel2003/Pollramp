// Starts the production build against a freshly reset test database.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import postgres from 'postgres';

const url =
	process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/pollramp_test';
if (!existsSync('build/index.js')) {
	console.error('No production build found. Run `pnpm build` before `pnpm test:e2e`.');
	process.exit(1);
}

const sql = postgres(url, { onnotice: () => {} });
await sql.unsafe('drop schema if exists public cascade; create schema public;');
await sql.end();

const port = process.env.PORT ?? '4173';
const child = spawn(process.execPath, ['build'], {
	stdio: 'inherit',
	env: {
		...process.env,
		DATABASE_URL: url,
		PORT: port,
		ORIGIN: `http://localhost:${port}`,
		BODY_SIZE_LIMIT: '8M',
		POLLRAMP_SECURE_COOKIES: 'false',
		POLLRAMP_OFFICE_NAME: 'Test County Elections',
		POLLRAMP_MAP_STYLE_URL: 'offline',
		POLLRAMP_DEFAULT_STATE: 'VA'
	}
});
for (const signal of /** @type {NodeJS.Signals[]} */ (['SIGINT', 'SIGTERM'])) {
	process.on(signal, () => child.kill(signal));
}
child.on('exit', (code) => process.exit(code ?? 0));
