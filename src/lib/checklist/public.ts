import { isApplicable } from './evaluate.ts';
import { formatMeasurement } from './measure.ts';
import type { Answer, Item, ResolvedChecklist, Responses, SurveyResult } from './types.ts';

export type VoterFeatureState = 'available' | 'election-day' | 'limited';

export interface VoterFeature {
	item: string;
	label: string;
	text: string;
	state: VoterFeatureState;
}

export interface VoterSection {
	id: string;
	title: string;
	features: VoterFeature[];
}

/** Plain-language headings for the voter-facing page, grouped the way voters arrive. */
const VOTER_GROUPS: Record<string, string> = {
	parking: 'Parking and drop-off',
	dropoff: 'Parking and drop-off',
	curbside: 'Curbside voting',
	route: 'Getting to the entrance',
	'curb-ramps': 'Getting to the entrance',
	ramps: 'Getting to the entrance',
	entrance: 'Entrance',
	interior: 'Inside the building',
	'voting-area': 'Voting area'
};

function interpolate(text: string, item: Item, value: Answer['value'] | undefined): string {
	const shown =
		typeof value === 'number'
			? item.unit === 'count' || item.type === 'count'
				? String(value)
				: formatMeasurement(value, item.unit)
			: String(value ?? '');
	return text.replaceAll('{value}', shown);
}

/**
 * Turn a submitted survey into the facts a voter with a disability needs, in arrival order.
 * Only items with `public` text are shown; nothing about internal scores or measurements
 * beyond what the checklist author chose to publish.
 */
export function voterSummary(
	checklist: ResolvedChecklist,
	result: SurveyResult,
	responses: Responses
): VoterSection[] {
	const outcomes = new Map(result.items.map((r) => [r.id, r]));
	const groups = new Map<string, VoterSection>();

	for (const section of checklist.sections) {
		const groupTitle = VOTER_GROUPS[section.id] ?? section.title;
		for (const item of section.items) {
			if (!item.public || !isApplicable(item, section, responses)) continue;
			const r = outcomes.get(item.id);
			const value = responses[item.id]?.value;
			let feature: VoterFeature | undefined;
			const make = (text: string | undefined, state: VoterFeatureState) =>
				text
					? {
							item: item.id,
							label: item.public!.label,
							text: interpolate(text, item, value),
							state
						}
					: undefined;

			if (r?.outcome === 'pass') feature = make(item.public.pass, 'available');
			else if (r?.outcome === 'info' && value === true)
				feature = make(item.public.pass, 'available');
			else if (r?.outcome === 'fail' && r.fix?.kind !== 'structural')
				feature = make(
					item.public.fixed ?? item.public.fail,
					item.public.fixed ? 'election-day' : 'limited'
				);
			else if (r?.outcome === 'fail') feature = make(item.public.fail, 'limited');

			if (!feature) continue;
			let group = groups.get(groupTitle);
			if (!group) {
				group = { id: section.id, title: groupTitle, features: [] };
				groups.set(groupTitle, group);
			}
			group.features.push(feature);
		}
	}
	return [...groups.values()];
}
