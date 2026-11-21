import type { Unit } from './types.ts';

/**
 * Parse what a surveyor types with a tape measure in hand.
 * Accepts decimals ("32.5"), fractions ("1/2"), mixed numbers ("32 1/2", "32-1/2"),
 * and feet-and-inches ("8' 2\"", "8 ft 2 in") when the unit is inches.
 * Returns NaN when the text is not a measurement.
 */
export function parseMeasurement(input: string, unit: Unit = 'in'): number {
	const text = input
		.trim()
		.toLowerCase()
		.replace(/[″”]/g, '"')
		.replace(/[′’]/g, "'")
		.replace(/,/g, '.');
	if (!text) return NaN;

	if (unit === 'in') {
		const feetInches =
			/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)\s*(?:(.+?)\s*(?:"|in|inch|inches)?)?$/.exec(text);
		if (feetInches) {
			const feet = Number(feetInches[1]);
			const inches = feetInches[2] ? parseNumber(feetInches[2]) : 0;
			return Number.isNaN(inches) ? NaN : feet * 12 + inches;
		}
	}

	const stripped = text.replace(/\s*(?:"|in|inch|inches|ft|feet|%|lbf|lbs?|s|sec|seconds)$/, '');
	return parseNumber(stripped);
}

function parseNumber(text: string): number {
	const t = text.trim();
	if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
	if (/^\.\d+$/.test(t)) return Number(t);
	const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(t);
	if (fraction) {
		const d = Number(fraction[2]);
		return d === 0 ? NaN : Number(fraction[1]) / d;
	}
	const mixed = /^(\d+)(?:\s+|-)(\d+)\s*\/\s*(\d+)$/.exec(t);
	if (mixed) {
		const d = Number(mixed[3]);
		return d === 0 ? NaN : Number(mixed[1]) + Number(mixed[2]) / d;
	}
	return NaN;
}

const UNIT_LABEL: Record<Unit, string> = {
	in: 'in',
	ft: 'ft',
	percent: '%',
	lbf: 'lbf',
	seconds: 's',
	count: ''
};

export function unitLabel(unit: Unit | undefined): string {
	return unit ? UNIT_LABEL[unit] : '';
}

const FRACTIONS: [number, string][] = [
	[0.125, '1/8'],
	[0.25, '1/4'],
	[0.375, '3/8'],
	[0.5, '1/2'],
	[0.625, '5/8'],
	[0.75, '3/4'],
	[0.875, '7/8']
];

/** Format a value for display, using tape-measure fractions for inches. */
export function formatMeasurement(value: number, unit: Unit | undefined): string {
	if (!Number.isFinite(value)) return '—';
	if (unit === 'in') {
		const whole = Math.floor(value);
		const rest = value - whole;
		const frac = FRACTIONS.find(([f]) => Math.abs(f - rest) < 0.01);
		if (Math.abs(rest) < 0.01) return `${whole} in`;
		if (frac) return whole > 0 ? `${whole} ${frac[1]} in` : `${frac[1]} in`;
		return `${round(value, 2)} in`;
	}
	if (unit === 'percent') return `${round(value, 2)}%`;
	if (unit === 'count' || unit === undefined) return `${round(value, 2)}`;
	return `${round(value, 2)} ${UNIT_LABEL[unit]}`;
}

function round(value: number, digits: number): number {
	const f = 10 ** digits;
	return Math.round(value * f) / f;
}
