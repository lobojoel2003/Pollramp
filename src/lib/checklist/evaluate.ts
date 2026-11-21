import { rampForRise, requiredAccessibleSpaces, requiredVanSpaces } from './ada.ts';
import { mergeKit } from './kit.ts';
import type {
	Answer,
	CompareOp,
	Condition,
	Item,
	ItemResult,
	KitLine,
	Outcome,
	PassRule,
	ResolvedChecklist,
	Responses,
	Section,
	SectionResult,
	SurveyResult,
	SurveyStatus,
	ThresholdFn
} from './types.ts';

export function isAnswered(answer: Answer | undefined): answer is Answer {
	return (
		answer !== undefined &&
		!answer.na &&
		answer.value !== null &&
		answer.value !== undefined &&
		answer.value !== '' &&
		!(typeof answer.value === 'number' && Number.isNaN(answer.value))
	);
}

export function compare(a: number, op: CompareOp, b: number): boolean {
	switch (op) {
		case '>=':
			return a >= b;
		case '<=':
			return a <= b;
		case '>':
			return a > b;
		case '<':
			return a < b;
		case '==':
			return a === b;
	}
}

export function conditionHolds(condition: Condition, responses: Responses): boolean {
	const answer = responses[condition.item];
	if (condition.op === 'answered') return isAnswered(answer);
	if (!isAnswered(answer)) return false;
	const value = answer.value;
	if (condition.op === 'equals') return value === condition.value;
	if (condition.op === 'not-equals') return value !== condition.value;
	if (typeof value !== 'number' || typeof condition.value !== 'number') return false;
	return compare(value, condition.op, condition.value);
}

/** Whether an item is asked, given the section gate and the item's `when` conditions. */
export function isApplicable(item: Item, section: Section, responses: Responses): boolean {
	if (section.gate && item.id !== section.gate) {
		const gate = responses[section.gate];
		if (!isAnswered(gate) || gate.value !== true) return false;
	}
	return (item.when ?? []).every((c) => conditionHolds(c, responses));
}

const THRESHOLD_FNS: Record<ThresholdFn, (total: number) => number> = {
	'ada208.accessible': requiredAccessibleSpaces,
	'ada208.van': requiredVanSpaces
};

/** The numeric threshold of a rule, computing it from other answers when needed. */
export function thresholdOf(rule: PassRule, responses: Responses): number | undefined {
	if ('fn' in rule) {
		const args = rule.args.map((id) => responses[id]?.value);
		if (args.some((v) => typeof v !== 'number')) return undefined;
		return THRESHOLD_FNS[rule.fn](args[0] as number);
	}
	if ('value' in rule && typeof rule.value === 'number') return rule.value;
	return undefined;
}

export function passes(
	item: Item,
	value: Answer['value'],
	responses: Responses
): boolean | undefined {
	const rule = item.pass;
	if (!rule) {
		if (item.type === 'choice' && item.options?.some((o) => o.pass !== undefined)) {
			const option = item.options.find((o) => o.value === value);
			return option?.pass;
		}
		return undefined;
	}
	switch (rule.op) {
		case 'equals':
			return value === rule.value;
		case 'in':
			return typeof value === 'string' && rule.values.includes(value);
		case 'between':
			return typeof value === 'number' && value >= rule.min && value <= rule.max;
		default: {
			if (typeof value !== 'number') return false;
			const threshold = thresholdOf(rule, responses);
			if (threshold === undefined) return undefined;
			return compare(value, rule.op, threshold);
		}
	}
}

function kitName(checklist: ResolvedChecklist, id: string): string {
	return checklist.kit.find((k) => k.id === id)?.name ?? id;
}

function buildFix(
	checklist: ResolvedChecklist,
	item: Item,
	value: Answer['value'],
	threshold: number | undefined,
	responses: Responses
): ItemResult['fix'] {
	const fix = item.fix;
	if (!fix) {
		return {
			kind: 'structural',
			summary: 'No election-day fix is defined for this item.',
			kit: []
		};
	}
	if (
		fix.structuralIf &&
		typeof value === 'number' &&
		compare(value, fix.structuralIf.op, fix.structuralIf.value)
	) {
		return { kind: 'structural', summary: fix.structuralIf.summary, steps: fix.steps, kit: [] };
	}

	const lines: KitLine[] = [];
	for (const ref of fix.kit ?? []) {
		if (ref.sizing === 'rampForRise') {
			const source = ref.from ? responses[ref.from]?.value : value;
			if (typeof source === 'number') {
				const ramp = rampForRise(source);
				if (ramp) {
					lines.push({
						item: ramp.item,
						name: kitName(checklist, ramp.item),
						size: ramp.size,
						qty: ref.qty ?? 1,
						for: [item.id],
						note: ramp.note
					});
				}
			} else {
				lines.push({
					item: 'portable-ramp',
					name: kitName(checklist, 'portable-ramp'),
					qty: ref.qty ?? 1,
					for: [item.id],
					note: 'Measure the rise to size this ramp.'
				});
			}
			continue;
		}
		if (!ref.item) continue;
		let qty = ref.qty ?? 1;
		if (ref.per === 'shortfall') {
			const gap =
				typeof value === 'number' && threshold !== undefined ? Math.ceil(threshold - value) : 1;
			qty = Math.max(0, gap) * (ref.multiplier ?? 1);
		}
		if (qty > 0) {
			lines.push({
				item: ref.item,
				name: kitName(checklist, ref.item),
				qty,
				for: [item.id],
				note: ref.note
			});
		}
	}
	return { kind: fix.kind, summary: fix.summary, steps: fix.steps, kit: lines };
}

export function evaluateItem(
	checklist: ResolvedChecklist,
	section: Section,
	item: Item,
	responses: Responses
): ItemResult {
	const base = { id: item.id, section: section.id };
	if (!isApplicable(item, section, responses)) return { ...base, outcome: 'skipped' };
	const answer = responses[item.id];
	if (answer?.na) return { ...base, outcome: 'na' };
	if (!isAnswered(answer))
		return { ...base, outcome: item.type === 'text' ? 'info' : 'unanswered' };

	const result = passes(item, answer.value, responses);
	const threshold = item.pass ? thresholdOf(item.pass, responses) : undefined;
	if (result === undefined) return { ...base, outcome: 'info', threshold };
	if (result) return { ...base, outcome: 'pass', threshold };
	return {
		...base,
		outcome: 'fail',
		threshold,
		fix: buildFix(checklist, item, answer.value, threshold, responses)
	};
}

function statusOf(results: ItemResult[]): SurveyStatus {
	if (results.some((r) => r.outcome === 'unanswered')) return 'incomplete';
	const fails = results.filter((r) => r.outcome === 'fail');
	if (fails.some((r) => r.fix?.kind === 'structural')) return 'barriers';
	if (fails.length > 0) return 'fixable';
	return 'accessible';
}

/** Evaluate every item and roll the results up into section and survey status plus a kit list. */
export function evaluateSurvey(checklist: ResolvedChecklist, responses: Responses): SurveyResult {
	const items: ItemResult[] = [];
	const sections: SectionResult[] = [];
	for (const section of checklist.sections) {
		const results = section.items.map((item) => evaluateItem(checklist, section, item, responses));
		items.push(...results);
		const scored = results.filter(
			(r) => r.outcome === 'pass' || r.outcome === 'fail' || r.outcome === 'unanswered'
		);
		sections.push({
			id: section.id,
			title: section.title,
			status: scored.length === 0 ? 'na' : statusOf(results),
			pass: results.filter((r) => r.outcome === 'pass').length,
			fail: results.filter((r) => r.outcome === 'fail').length,
			unanswered: results.filter((r) => r.outcome === 'unanswered').length
		});
	}
	const count = (o: Outcome) => items.filter((r) => r.outcome === o).length;
	const counts = {
		pass: count('pass'),
		fail: count('fail'),
		na: count('na'),
		unanswered: count('unanswered'),
		total: items.filter((r) => r.outcome !== 'skipped').length
	};
	return {
		checklist: checklist.key,
		status: statusOf(items),
		counts,
		sections,
		items,
		kit: mergeKit(items.flatMap((r) => r.fix?.kit ?? []))
	};
}

/** Items that will be asked, in walking order, given the answers so far. */
export function applicableItems(
	checklist: ResolvedChecklist,
	responses: Responses
): { item: Item; section: Section }[] {
	return checklist.sections.flatMap((section) =>
		section.items
			.filter((item) => isApplicable(item, section, responses))
			.map((item) => ({ item, section }))
	);
}

/** Next item to ask after `currentId` (or the first item), skipping items that do not apply. */
export function nextItem(
	checklist: ResolvedChecklist,
	responses: Responses,
	currentId?: string
): { item: Item; section: Section } | undefined {
	const all = checklist.sections.flatMap((section) =>
		section.items.map((item) => ({ item, section }))
	);
	const start = currentId ? all.findIndex((e) => e.item.id === currentId) + 1 : 0;
	return all.slice(start).find((e) => isApplicable(e.item, e.section, responses));
}

/** Previous applicable item before `currentId`. */
export function previousItem(
	checklist: ResolvedChecklist,
	responses: Responses,
	currentId: string
): { item: Item; section: Section } | undefined {
	const all = checklist.sections.flatMap((section) =>
		section.items.map((item) => ({ item, section }))
	);
	const end = all.findIndex((e) => e.item.id === currentId);
	return all
		.slice(0, Math.max(0, end))
		.reverse()
		.find((e) => isApplicable(e.item, e.section, responses));
}

/** First applicable item without an answer, for "resume survey". */
export function firstUnanswered(
	checklist: ResolvedChecklist,
	responses: Responses
): { item: Item; section: Section } | undefined {
	return applicableItems(checklist, responses).find(
		({ item }) => item.type !== 'text' && !isAnswered(responses[item.id]) && !responses[item.id]?.na
	);
}
