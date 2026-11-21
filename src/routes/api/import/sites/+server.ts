import { error, json } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { parseSitesCsv } from '#lib/csv.ts';
import { db } from '#lib/server/db.ts';
import { audit, upsertSite } from '#lib/server/repo.ts';
import { EMPTY_VOTER_INFO, uuid } from '#lib/model.ts';
import type { RequestHandler } from './$types';

/**
 * Import polling places from a CSV export (name, address, city, state, zip, lat, lng, precinct).
 * Rows that match an existing site by name and address are skipped, so re-importing is safe.
 */
export const POST: RequestHandler = async (event) => {
	const user = requireUser(event, 'admin');
	const type = event.request.headers.get('content-type') ?? '';
	if (!type.startsWith('text/csv') && !type.startsWith('text/plain'))
		error(415, 'Send the CSV as text/csv.');
	const textBody = await event.request.text();
	if (textBody.length > 5 * 1024 * 1024) error(413, 'The CSV is larger than 5 MB.');
	const { rows, errors } = parseSitesCsv(textBody);
	if (rows.length === 0) error(400, errors[0] ?? 'No rows to import.');

	const existing =
		await db()`select lower(name) as name, lower(address) as address from sites where deleted_at is null`;
	const seen = new Set(existing.map((r) => `${r.name}|${r.address}`));
	let created = 0;
	let skipped = 0;
	const now = new Date().toISOString();
	for (const row of rows) {
		const key = `${row.name.toLowerCase()}|${row.address.toLowerCase()}`;
		if (seen.has(key)) {
			skipped++;
			continue;
		}
		seen.add(key);
		await upsertSite(
			{
				id: uuid(),
				name: row.name,
				address: row.address,
				city: row.city,
				state: row.state,
				postalCode: row.postalCode,
				lat: row.lat,
				lng: row.lng,
				precincts: row.precincts,
				notes: row.notes,
				published: false,
				voterInfo: EMPTY_VOTER_INFO,
				publicPhotoId: null,
				updatedAt: now
			},
			user
		);
		created++;
	}
	await audit(db(), user, 'import', 'site', '*', { created, skipped });
	return json({ created, skipped, errors });
};
