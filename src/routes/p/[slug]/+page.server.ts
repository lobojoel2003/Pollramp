import { error } from '@sveltejs/kit';
import { evaluateSurvey } from '#lib/checklist/evaluate.ts';
import { voterSummary } from '#lib/checklist/public.ts';
import { tryGetChecklist } from '#lib/checklist/registry.ts';
import { publishedSiteBySlug } from '#lib/server/repo.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const found = await publishedSiteBySlug(params.slug);
	if (!found) error(404, 'This polling place is not published.');
	const { site, survey } = found;

	let sections: ReturnType<typeof voterSummary> = [];
	if (survey) {
		const checklist = tryGetChecklist(survey.checklist);
		if (checklist) {
			const result = survey.result ?? evaluateSurvey(checklist, survey.responses);
			sections = voterSummary(checklist, result, survey.responses);
		}
	}

	setHeaders({ 'Cache-Control': 'public, max-age=60' });
	return {
		site: {
			slug: site.slug,
			name: site.name,
			address: site.address,
			city: site.city,
			state: site.state,
			postalCode: site.postalCode,
			lat: site.lat,
			lng: site.lng,
			precincts: site.precincts,
			status: site.status,
			voterInfo: site.voterInfo,
			hasPhoto: site.publicPhotoId !== null
		},
		surveyedOn: survey?.submittedAt ?? null,
		sections
	};
};
