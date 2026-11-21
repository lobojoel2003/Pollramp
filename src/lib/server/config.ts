import type { AppConfig } from '../model.ts';

/** Runtime configuration from environment variables. See `.env.example`. */
const env = process.env;

function number(value: string | undefined, fallback: number): number {
	const n = Number(value);
	return value !== undefined && value !== '' && Number.isFinite(n) ? n : fallback;
}

export const config = {
	databaseUrl: env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/pollramp',
	officeName: env.POLLRAMP_OFFICE_NAME ?? 'Election Office',
	mapStyleUrl: env.POLLRAMP_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
	defaultCenter: [
		number(env.POLLRAMP_MAP_LNG, -98.5795),
		number(env.POLLRAMP_MAP_LAT, 39.8283)
	] as [number, number],
	defaultZoom: number(env.POLLRAMP_MAP_ZOOM, 3.5),
	defaultState: (env.POLLRAMP_DEFAULT_STATE ?? '').toUpperCase().slice(0, 2),
	adminEmail: env.POLLRAMP_ADMIN_EMAIL ?? '',
	adminPassword: env.POLLRAMP_ADMIN_PASSWORD ?? '',
	migrate: env.POLLRAMP_MIGRATE !== 'false',
	sessionDays: number(env.POLLRAMP_SESSION_DAYS, 30),
	/** Mark the session cookie `Secure`. Defaults on unless the origin is plain http. */
	secureCookies: env.POLLRAMP_SECURE_COOKIES
		? env.POLLRAMP_SECURE_COOKIES !== 'false'
		: !(env.ORIGIN ?? '').startsWith('http://'),
	maxPhotoBytes: number(env.POLLRAMP_MAX_PHOTO_BYTES, 6 * 1024 * 1024)
};

export const build = {
	version: __POLLRAMP_VERSION__,
	build: __POLLRAMP_BUILD__,
	commit: __POLLRAMP_COMMIT__,
	builtAt: __POLLRAMP_BUILT_AT__
};

export function publicConfig(): AppConfig {
	return {
		officeName: config.officeName,
		mapStyleUrl: config.mapStyleUrl,
		defaultCenter: config.defaultCenter,
		defaultZoom: config.defaultZoom,
		defaultState: config.defaultState,
		version: build.version,
		build: build.build,
		commit: build.commit
	};
}
