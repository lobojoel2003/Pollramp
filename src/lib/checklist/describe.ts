import { slopeRatio } from './ada.ts';
import { formatMeasurement } from './measure.ts';
import type { Answer, FixKind, Item } from './types.ts';

function fmt(value: number, item: Item): string {
	if (item.type === 'count') return String(value);
	const text = formatMeasurement(value, item.unit);
	return item.unit === 'percent' ? `${text} (${slopeRatio(value)})` : text;
}

/** Human description of the pass rule: "at least 32 in", "1:12 (8.33%) or gentler". */
export function requirementText(item: Item, threshold?: number): string {
	const rule = item.pass;
	if (!rule) return '';
	switch (rule.op) {
		case 'equals':
			return typeof rule.value === 'boolean' ? (rule.value ? 'Yes' : 'No') : String(rule.value);
		case 'in':
			return rule.values
				.map((v) => item.options?.find((o) => o.value === v)?.label ?? v)
				.join(' or ');
		case 'between':
			return `between ${fmt(rule.min, item)} and ${fmt(rule.max, item)}`;
		default: {
			const t =
				threshold ?? ('value' in rule && typeof rule.value === 'number' ? rule.value : undefined);
			if (t === undefined) {
				if ('fn' in rule && rule.fn === 'ada208.accessible')
					return 'the number ADA Table 208.2 requires for the lot size';
				if ('fn' in rule && rule.fn === 'ada208.van')
					return 'one in every six accessible spaces (ADA §208.2.4)';
				return 'depends on earlier answers';
			}
			const words: Record<string, string> = {
				'>=': 'at least',
				'<=': 'at most',
				'>': 'more than',
				'<': 'less than',
				'==': 'exactly'
			};
			return `${words[rule.op]} ${fmt(t, item)}`;
		}
	}
}

export function answerText(item: Item, answer: Answer | undefined): string {
	if (!answer) return '—';
	if (answer.na) return 'Does not apply';
	const v = answer.value;
	if (v === null || v === '') return '—';
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (typeof v === 'number') return fmt(v, item);
	return item.options?.find((o) => o.value === v)?.label ?? v;
}

export const FIX_KIND: Record<FixKind, { label: string; description: string }> = {
	kit: { label: 'Bring equipment', description: 'Fixed on election day with items from the kit.' },
	procedure: {
		label: 'Poll-worker procedure',
		description: 'Fixed on election day by how poll workers set up or staff the site.'
	},
	structural: {
		label: 'Structural barrier',
		description: 'Cannot be fixed on election day. Needs a permanent repair or another site.'
	}
};

export function originLabel(origin: string | undefined): string | null {
	if (!origin || origin.startsWith('doj-base@')) return null;
	const id = origin.split('@')[0];
	const names: Record<string, string> = {
		'us-ca': 'California',
		'us-fl': 'Florida',
		'us-va': 'Virginia'
	};
	return `${names[id] ?? id.toUpperCase()} rule`;
}
