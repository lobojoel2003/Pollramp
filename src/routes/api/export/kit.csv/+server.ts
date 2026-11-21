import { requireUser } from '#lib/server/auth.ts';
import { csvResponse } from '#lib/server/http.ts';
import { latestSurveys } from '#lib/server/repo.ts';
import { aggregateKits } from '#lib/checklist/kit.ts';
import { toCsv } from '#lib/csv.ts';
import type { RequestHandler } from './$types';

/** Office-wide election-day kit totals for procurement, with the per-site breakdown. */
export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const sites = (await latestSurveys())
		.filter(({ survey }) => survey?.result)
		.map(({ site, survey }) => ({
			siteId: site.id,
			siteName: site.name,
			kit: survey!.result!.kit
		}));
	const totals = aggregateKits(sites);
	const header = ['Item', 'Size', 'Total quantity', 'Sites'];
	const body = totals.map((t) => [
		t.name,
		t.size ?? '',
		t.qty,
		t.sites.map((s) => `${s.siteName} (${s.qty})`)
	]);
	return csvResponse(
		toCsv(header, body),
		`pollramp-kit-${new Date().toISOString().slice(0, 10)}.csv`
	);
};
