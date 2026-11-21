import { requireUser } from '#lib/server/auth.ts';
import { csvResponse } from '#lib/server/http.ts';
import { latestSurveys } from '#lib/server/repo.ts';
import { STATUS } from '#lib/checklist/status.ts';
import { kitSentence } from '#lib/checklist/kit.ts';
import { toCsv } from '#lib/csv.ts';
import type { RequestHandler } from './$types';

/** One row per site with its latest submitted survey: the spreadsheet offices already keep. */
export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const rows = await latestSurveys();
	const header = [
		'Site',
		'Address',
		'City',
		'State',
		'ZIP',
		'Latitude',
		'Longitude',
		'Precincts',
		'Status',
		'Surveyed on',
		'Surveyor',
		'Election',
		'Checklist',
		'Passed',
		'Failed',
		'Not applicable',
		'Failed items',
		'Election-day kit',
		'Published',
		'Voter page'
	];
	const origin = event.url.origin;
	const body = rows.map(({ site, survey }) => {
		const result = survey?.result;
		const failed = result?.items.filter((i) => i.outcome === 'fail').map((i) => i.id) ?? [];
		return [
			site.name,
			site.address,
			site.city,
			site.state,
			site.postalCode,
			site.lat,
			site.lng,
			site.precincts,
			STATUS[site.status].label,
			survey?.submittedAt?.slice(0, 10) ?? '',
			survey?.surveyor ?? '',
			survey?.election ?? '',
			survey?.checklist ?? '',
			result?.counts.pass ?? '',
			result?.counts.fail ?? '',
			result?.counts.na ?? '',
			failed,
			result ? kitSentence(result.kit) : '',
			site.published ? 'yes' : 'no',
			site.published ? `${origin}/p/${site.slug}` : ''
		];
	});
	return csvResponse(
		toCsv(header, body),
		`pollramp-results-${new Date().toISOString().slice(0, 10)}.csv`
	);
};
