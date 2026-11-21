import type { SiteStatus } from './types.ts';

export interface StatusInfo {
	label: string;
	short: string;
	description: string;
	/** Single glyph so status never depends on color alone. */
	glyph: string;
}

export const STATUS: Record<SiteStatus, StatusInfo> = {
	accessible: {
		label: 'Accessible',
		short: 'Accessible',
		description: 'Every applicable item passed.',
		glyph: '✓'
	},
	fixable: {
		label: 'Accessible with election-day fixes',
		short: 'Fixable',
		description: 'Barriers can be handled on election day with the kit or poll-worker procedures.',
		glyph: '!'
	},
	barriers: {
		label: 'Barriers remain',
		short: 'Barriers',
		description:
			'At least one barrier cannot be fixed on election day. Consider another site or room.',
		glyph: '✕'
	},
	incomplete: {
		label: 'Survey in progress',
		short: 'In progress',
		description: 'The survey has unanswered items.',
		glyph: '…'
	},
	unsurveyed: {
		label: 'Not yet surveyed',
		short: 'Not surveyed',
		description: 'No submitted survey for this site.',
		glyph: '○'
	}
};

export const STATUS_ORDER: SiteStatus[] = [
	'barriers',
	'fixable',
	'incomplete',
	'unsurveyed',
	'accessible'
];
