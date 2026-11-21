import { requireUser } from '#lib/server/auth.ts';
import { csvResponse } from '#lib/server/http.ts';
import { latestSurveys } from '#lib/server/repo.ts';
import { tryGetChecklist } from '#lib/checklist/registry.ts';
import { formatMeasurement } from '#lib/checklist/measure.ts';
import { toCsv } from '#lib/csv.ts';
import type { RequestHandler } from './$types';

/** One row per site × item: every measurement, outcome and planned fix. */
export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const header = [
		'Site',
		'Section',
		'Item',
		'Question',
		'Answer',
		'Outcome',
		'Fix type',
		'Fix',
		'Note',
		'Photos',
		'Reference'
	];
	const body: unknown[][] = [];
	for (const { site, survey } of await latestSurveys()) {
		if (!survey?.result) continue;
		const checklist = tryGetChecklist(survey.checklist);
		if (!checklist) continue;
		const outcomes = new Map(survey.result.items.map((i) => [i.id, i]));
		for (const section of checklist.sections) {
			for (const item of section.items) {
				const r = outcomes.get(item.id);
				if (!r || r.outcome === 'skipped') continue;
				const answer = survey.responses[item.id];
				const value = answer?.na
					? 'N/A'
					: typeof answer?.value === 'number'
						? formatMeasurement(answer.value, item.unit)
						: typeof answer?.value === 'boolean'
							? answer.value
								? 'Yes'
								: 'No'
							: (item.options?.find((o) => o.value === answer?.value)?.label ??
								answer?.value ??
								'');
				body.push([
					site.name,
					section.title,
					item.id,
					item.prompt,
					value,
					r.outcome,
					r.fix?.kind ?? '',
					r.fix?.summary ?? '',
					answer?.note ?? '',
					answer?.photos?.length ?? 0,
					item.references ?? []
				]);
			}
		}
	}
	return csvResponse(
		toCsv(header, body),
		`pollramp-items-${new Date().toISOString().slice(0, 10)}.csv`
	);
};
