import type { Sql } from 'postgres';

/** SQL migrations bundled into the server build, applied in filename order. */
const files = import.meta.glob<string>('/migrations/*.sql', {
	eager: true,
	query: '?raw',
	import: 'default'
});

export const migrations = Object.entries(files)
	.map(([path, sql]) => ({
		version: path
			.split('/')
			.pop()!
			.replace(/\.sql$/, ''),
		sql
	}))
	.sort((a, b) => a.version.localeCompare(b.version));

/** Apply pending migrations inside one transaction guarded by an advisory lock. */
export async function migrate(sql: Sql): Promise<string[]> {
	const applied: string[] = [];
	await sql.begin(async (tx) => {
		await tx`select pg_advisory_xact_lock(727201)`;
		await tx`create table if not exists schema_migrations (
			version text primary key,
			applied_at timestamptz not null default now()
		)`;
		const done = new Set(
			(await tx`select version from schema_migrations`).map((r) => r.version as string)
		);
		for (const m of migrations) {
			if (done.has(m.version)) continue;
			await tx.unsafe(m.sql);
			await tx`insert into schema_migrations (version) values (${m.version})`;
			applied.push(m.version);
		}
	});
	return applied;
}
