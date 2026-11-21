import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { evaluateSurvey } from '../checklist/evaluate.ts';
import { tryGetChecklist } from '../checklist/registry.ts';
import type { SiteStatus, SurveyResult } from '../checklist/types.ts';
import {
	EMPTY_VOTER_INFO,
	slugify,
	type PhotoMeta,
	type Site,
	type Survey,
	type User,
	type VoterInfo
} from '../model.ts';
import { db, type Sql } from './db.ts';

/* ------------------------------------------------------------------ validation */

const isoDate = z.iso.datetime({ offset: true });
const text = (max: number) => z.string().max(max).default('');

export const voterInfoSchema = z
	.object({
		accessibleEntrance: text(500),
		parking: text(500),
		contact: text(200),
		notes: text(2000)
	})
	.default(EMPTY_VOTER_INFO);

export const siteInput = z.object({
	id: z.uuid(),
	slug: z.string().max(80).optional(),
	name: z.string().trim().min(1).max(200),
	address: text(300),
	city: text(120),
	state: z
		.string()
		.max(2)
		.default('')
		.transform((s) => s.toUpperCase()),
	postalCode: text(20),
	lat: z.number().min(-90).max(90).nullable().default(null),
	lng: z.number().min(-180).max(180).nullable().default(null),
	precincts: z.array(z.string().max(50)).max(50).default([]),
	notes: text(4000),
	published: z.boolean().default(false),
	voterInfo: voterInfoSchema,
	publicPhotoId: z.uuid().nullable().default(null),
	updatedAt: isoDate
});

const answerSchema = z.object({
	value: z.union([z.number(), z.boolean(), z.string().max(4000), z.null()]),
	na: z.boolean().optional(),
	note: z.string().max(4000).optional(),
	photos: z.array(z.uuid()).max(20).optional(),
	raw: z.string().max(100).optional(),
	answeredAt: isoDate.optional()
});

export const surveyInput = z.object({
	id: z.uuid(),
	siteId: z.uuid(),
	checklist: z.string().min(3).max(200),
	state: z.enum(['draft', 'submitted']),
	surveyor: text(200),
	election: text(200),
	responses: z.record(z.string().max(120), answerSchema),
	startedAt: isoDate,
	submittedAt: isoDate.nullable().default(null),
	updatedAt: isoDate
});

export type SiteInput = z.infer<typeof siteInput>;
export type SurveyInput = z.infer<typeof surveyInput>;

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
	const result = schema.safeParse(value);
	if (!result.success) {
		const issue = result.error.issues[0];
		error(400, `Invalid ${issue.path.join('.') || 'request'}: ${issue.message}`);
	}
	return result.data;
}

/* ------------------------------------------------------------------ row mapping */

type Row = Record<string, unknown>;

const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v));
const isoOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : iso(v));

export function toSite(row: Row): Site {
	return {
		id: row.id as string,
		slug: row.slug as string,
		name: row.name as string,
		address: row.address as string,
		city: row.city as string,
		state: row.state as string,
		postalCode: row.postal_code as string,
		lat: row.lat as number | null,
		lng: row.lng as number | null,
		precincts: (row.precincts as string[]) ?? [],
		notes: row.notes as string,
		published: row.published as boolean,
		voterInfo: { ...EMPTY_VOTER_INFO, ...(row.voter_info as Partial<VoterInfo>) },
		publicPhotoId: (row.public_photo_id as string | null) ?? null,
		status: row.status as SiteStatus,
		latestSurveyId: (row.latest_survey_id as string | null) ?? null,
		createdAt: iso(row.created_at),
		updatedAt: iso(row.client_updated_at),
		deletedAt: isoOrNull(row.deleted_at)
	};
}

export function toSurvey(row: Row): Survey {
	return {
		id: row.id as string,
		siteId: row.site_id as string,
		checklist: row.checklist as string,
		state: row.state as Survey['state'],
		surveyor: row.surveyor as string,
		election: row.election as string,
		responses: row.responses as Survey['responses'],
		result: (row.result as SurveyResult | null) ?? null,
		startedAt: iso(row.started_at),
		submittedAt: isoOrNull(row.submitted_at),
		createdAt: iso(row.created_at),
		updatedAt: iso(row.client_updated_at),
		deletedAt: isoOrNull(row.deleted_at)
	};
}

export function toPhoto(row: Row): PhotoMeta {
	return {
		id: row.id as string,
		surveyId: row.survey_id as string,
		itemId: row.item_id as string,
		mime: row.mime as string,
		width: (row.width as number | null) ?? null,
		height: (row.height as number | null) ?? null,
		size: row.size as number,
		createdAt: iso(row.created_at)
	};
}

/* ------------------------------------------------------------------ audit */

export async function audit(
	sql: Sql,
	user: User | null,
	action: string,
	entity: string,
	entityId: string,
	detail: Record<string, unknown> = {}
): Promise<void> {
	await sql`insert into audit_log (user_id, action, entity, entity_id, detail)
		values (${user?.id ?? null}, ${action}, ${entity}, ${entityId}, ${sql.json(detail)})`;
}

/* ------------------------------------------------------------------ sites */

async function uniqueSlug(sql: Sql, wanted: string, id: string): Promise<string> {
	const base = slugify(wanted);
	const taken = new Set(
		(
			await sql`select slug from sites where (slug = ${base} or slug like ${`${base}-%`}) and id <> ${id}`
		).map((r) => r.slug as string)
	);
	if (!taken.has(base)) return base;
	for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

const SITE_COLUMNS =
	'id, slug, name, address, city, state, postal_code, lat, lng, precincts, notes, published, voter_info, public_photo_id, status, latest_survey_id, client_updated_at, created_at, updated_at, deleted_at';

export async function getSite(id: string): Promise<Site | null> {
	const [row] = await db().unsafe(`select ${SITE_COLUMNS} from sites where id = $1`, [id]);
	return row ? toSite(row) : null;
}

/**
 * Insert or update a site. Last write wins by the client's `updatedAt`, so an older offline
 * edit never overwrites a newer one. Only admins can publish or change the public photo.
 */
export async function upsertSite(
	input: SiteInput,
	user: User
): Promise<{ site: Site; stale: boolean }> {
	const sql = db();
	return sql.begin(async (tx) => {
		const [existing] =
			await tx`select id, slug, published, public_photo_id, client_updated_at from sites where id = ${input.id} for update`;
		if (existing && new Date(existing.client_updated_at as Date) > new Date(input.updatedAt)) {
			const [row] = await tx.unsafe(`select ${SITE_COLUMNS} from sites where id = $1`, [input.id]);
			return { site: toSite(row), stale: true };
		}
		const isAdmin = user.role === 'admin';
		const published = isAdmin
			? input.published
			: ((existing?.published as boolean | undefined) ?? false);
		const publicPhotoId = isAdmin
			? input.publicPhotoId
			: ((existing?.public_photo_id as string | null) ?? null);
		const slug = await uniqueSlug(
			tx,
			input.slug || (existing?.slug as string) || input.name,
			input.id
		);

		const [row] = await tx`
			insert into sites (id, slug, name, address, city, state, postal_code, lat, lng, precincts, notes,
				published, voter_info, public_photo_id, client_updated_at)
			values (${input.id}, ${slug}, ${input.name}, ${input.address}, ${input.city}, ${input.state},
				${input.postalCode}, ${input.lat}, ${input.lng}, ${input.precincts}::text[], ${input.notes},
				${published}, ${tx.json(input.voterInfo)}, ${publicPhotoId}, ${input.updatedAt})
			on conflict (id) do update set
				slug = excluded.slug, name = excluded.name, address = excluded.address, city = excluded.city,
				state = excluded.state, postal_code = excluded.postal_code, lat = excluded.lat, lng = excluded.lng,
				precincts = excluded.precincts, notes = excluded.notes, published = excluded.published,
				voter_info = excluded.voter_info, public_photo_id = excluded.public_photo_id,
				client_updated_at = excluded.client_updated_at, updated_at = now(), deleted_at = null
			returning ${tx.unsafe(SITE_COLUMNS)}`;
		await audit(tx, user, existing ? 'update' : 'create', 'site', input.id, { name: input.name });
		if (existing && existing.published !== published) {
			await audit(tx, user, published ? 'publish' : 'unpublish', 'site', input.id);
		}
		return { site: toSite(row), stale: false };
	});
}

export async function deleteSite(id: string, user: User): Promise<void> {
	const sql = db();
	await sql.begin(async (tx) => {
		await tx`update sites set deleted_at = now(), updated_at = now(), published = false where id = ${id}`;
		await tx`update surveys set deleted_at = now(), updated_at = now() where site_id = ${id} and deleted_at is null`;
		await audit(tx, user, 'delete', 'site', id);
	});
}

/** Recompute a site's map status from its surveys (latest submitted wins; drafts mean "in progress"). */
export async function refreshSiteStatus(sql: Sql, siteId: string): Promise<void> {
	const [latest] = await sql`
		select id, result from surveys
		where site_id = ${siteId} and state = 'submitted' and deleted_at is null
		order by submitted_at desc nulls last, updated_at desc limit 1`;
	let status: SiteStatus = 'unsurveyed';
	if (latest) {
		status = (latest.result as SurveyResult | null)?.status ?? 'incomplete';
	} else {
		const [draft] =
			await sql`select 1 from surveys where site_id = ${siteId} and deleted_at is null limit 1`;
		if (draft) status = 'incomplete';
	}
	await sql`update sites set status = ${status}, latest_survey_id = ${(latest?.id as string) ?? null},
		updated_at = now() where id = ${siteId} and (status <> ${status} or latest_survey_id is distinct from ${(latest?.id as string) ?? null})`;
}

/* ------------------------------------------------------------------ surveys */

const SURVEY_COLUMNS =
	'id, site_id, checklist, state, surveyor, election, responses, result, started_at, submitted_at, client_updated_at, created_at, updated_at, deleted_at';

export async function getSurvey(id: string): Promise<Survey | null> {
	const [row] = await db().unsafe(`select ${SURVEY_COLUMNS} from surveys where id = $1`, [id]);
	return row ? toSurvey(row) : null;
}

/** Insert or update a survey; the server re-evaluates the result so stored status is trustworthy. */
export async function upsertSurvey(
	input: SurveyInput,
	user: User
): Promise<{ survey: Survey; stale: boolean }> {
	const checklist = tryGetChecklist(input.checklist);
	if (!checklist)
		error(400, `Unknown checklist "${input.checklist}". Update the app to the latest version.`);
	const result = evaluateSurvey(checklist, input.responses);
	const sql = db();
	return sql.begin(async (tx) => {
		const [site] = await tx`select id from sites where id = ${input.siteId} and deleted_at is null`;
		if (!site) error(409, 'The site for this survey has not been synced yet, or was deleted.');
		const [existing] =
			await tx`select client_updated_at from surveys where id = ${input.id} for update`;
		if (existing && new Date(existing.client_updated_at as Date) > new Date(input.updatedAt)) {
			const [row] = await tx.unsafe(`select ${SURVEY_COLUMNS} from surveys where id = $1`, [
				input.id
			]);
			return { survey: toSurvey(row), stale: true };
		}
		const [row] = await tx`
			insert into surveys (id, site_id, checklist, state, surveyor, election, responses, result,
				started_at, submitted_at, created_by, client_updated_at)
			values (${input.id}, ${input.siteId}, ${input.checklist}, ${input.state}, ${input.surveyor},
				${input.election}, ${tx.json(input.responses)}, ${tx.json(result)},
				${input.startedAt}, ${input.submittedAt}, ${user.id}, ${input.updatedAt})
			on conflict (id) do update set
				checklist = excluded.checklist, state = excluded.state, surveyor = excluded.surveyor,
				election = excluded.election, responses = excluded.responses, result = excluded.result,
				started_at = excluded.started_at, submitted_at = excluded.submitted_at,
				client_updated_at = excluded.client_updated_at, updated_at = now(), deleted_at = null
			returning ${tx.unsafe(SURVEY_COLUMNS)}`;
		await refreshSiteStatus(tx, input.siteId);
		await audit(tx, user, existing ? 'update' : 'create', 'survey', input.id, {
			state: input.state,
			status: result.status
		});
		return { survey: toSurvey(row), stale: false };
	});
}

export async function deleteSurvey(id: string, user: User): Promise<void> {
	const sql = db();
	await sql.begin(async (tx) => {
		const [row] =
			await tx`update surveys set deleted_at = now(), updated_at = now() where id = ${id} returning site_id`;
		if (row) await refreshSiteStatus(tx, row.site_id as string);
		await audit(tx, user, 'delete', 'survey', id);
	});
}

/* ------------------------------------------------------------------ photos */

export const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function savePhoto(input: {
	id: string;
	surveyId: string;
	itemId: string;
	mime: string;
	width: number | null;
	height: number | null;
	data: Uint8Array;
}): Promise<PhotoMeta> {
	const sql = db();
	const [survey] = await sql`select id from surveys where id = ${input.surveyId}`;
	if (!survey) error(409, 'Sync the survey before its photos.');
	const [row] = await sql`
		insert into photos (id, survey_id, item_id, mime, width, height, size, data)
		values (${input.id}, ${input.surveyId}, ${input.itemId}, ${input.mime}, ${input.width}, ${input.height},
			${input.data.byteLength}, ${Buffer.from(input.data)})
		on conflict (id) do update set item_id = excluded.item_id, updated_at = now()
		returning id, survey_id, item_id, mime, width, height, size, created_at`;
	return toPhoto(row);
}

export async function getPhoto(
	id: string
): Promise<{ mime: string; data: Buffer; surveyId: string } | null> {
	const [row] = await db()`select mime, data, survey_id from photos where id = ${id}`;
	return row
		? { mime: row.mime as string, data: row.data as Buffer, surveyId: row.survey_id as string }
		: null;
}

/* ------------------------------------------------------------------ sync */

export async function changesSince(since: Date | null): Promise<{
	now: string;
	sites: Site[];
	surveys: Survey[];
	photos: PhotoMeta[];
}> {
	const sql = db();
	// Overlap by a few seconds so writes committing during the previous pull are not missed;
	// clients merge by id and `updatedAt`, so repeats are harmless.
	const from = since ? new Date(since.getTime() - 5000) : new Date(0);
	const includeDeleted = since !== null;
	const [{ now }] = await sql`select now() as now`;
	const sites = await sql.unsafe(
		`select ${SITE_COLUMNS} from sites where updated_at > $1 ${includeDeleted ? '' : 'and deleted_at is null'} order by updated_at`,
		[from]
	);
	const surveys = await sql.unsafe(
		`select ${SURVEY_COLUMNS} from surveys where updated_at > $1 ${includeDeleted ? '' : 'and deleted_at is null'} order by updated_at`,
		[from]
	);
	const photos = await sql`select id, survey_id, item_id, mime, width, height, size, created_at
		from photos where updated_at > ${from} order by updated_at`;
	return {
		now: iso(now),
		sites: sites.map(toSite),
		surveys: surveys.map(toSurvey),
		photos: photos.map(toPhoto)
	};
}

/* ------------------------------------------------------------------ public pages */

export async function publishedSites(): Promise<Site[]> {
	const rows = await db().unsafe(
		`select ${SITE_COLUMNS} from sites where published and deleted_at is null order by state, city, name`
	);
	return rows.map(toSite);
}

export async function publishedSiteBySlug(
	slug: string
): Promise<{ site: Site; survey: Survey | null } | null> {
	const [row] = await db().unsafe(
		`select ${SITE_COLUMNS} from sites where slug = $1 and published and deleted_at is null`,
		[slug]
	);
	if (!row) return null;
	const site = toSite(row);
	const survey = site.latestSurveyId ? await getSurvey(site.latestSurveyId) : null;
	return { site, survey: survey && !survey.deletedAt ? survey : null };
}

/** Latest submitted survey per site, for exports and the office kit list. */
export async function latestSurveys(): Promise<{ site: Site; survey: Survey | null }[]> {
	const sql = db();
	const sites = (
		await sql.unsafe(`select ${SITE_COLUMNS} from sites where deleted_at is null order by name`)
	).map(toSite);
	const ids = sites.map((s) => s.latestSurveyId).filter((id): id is string => !!id);
	const surveys = ids.length
		? (
				await sql.unsafe(`select ${SURVEY_COLUMNS} from surveys where id = any($1::uuid[])`, [ids])
			).map(toSurvey)
		: [];
	const byId = new Map(surveys.map((s) => [s.id, s]));
	return sites.map((site) => ({
		site,
		survey: site.latestSurveyId ? (byId.get(site.latestSurveyId) ?? null) : null
	}));
}
