import postgres, { type ISql, type Sql as Pool } from 'postgres';
import { config } from './config.ts';

/** Anything queries can run on: the pool or a transaction. */
export type Sql = ISql;

let instance: Pool | undefined;

/** Lazily created connection pool, shared by the whole server process. */
export function db(): Pool {
	instance ??= postgres(config.databaseUrl, {
		max: 10,
		idle_timeout: 30,
		connect_timeout: 10,
		onnotice: () => {}
	});
	return instance;
}

export async function closeDb(): Promise<void> {
	await instance?.end({ timeout: 5 });
	instance = undefined;
}
