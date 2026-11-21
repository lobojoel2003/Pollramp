/**
 * Numeric rules from the 2010 ADA Standards that are more than a single threshold.
 * Pure functions, no imports: shared by the browser, the server and the Node scripts.
 */

/** Minimum number of accessible spaces for a lot (2010 ADA Standards Table 208.2). */
export function requiredAccessibleSpaces(total: number): number {
	if (!Number.isFinite(total) || total <= 0) return 0;
	const t = Math.ceil(total);
	if (t <= 25) return 1;
	if (t <= 50) return 2;
	if (t <= 75) return 3;
	if (t <= 100) return 4;
	if (t <= 150) return 5;
	if (t <= 200) return 6;
	if (t <= 300) return 7;
	if (t <= 400) return 8;
	if (t <= 500) return 9;
	if (t <= 1000) return Math.ceil(t * 0.02);
	return 20 + Math.ceil((t - 1000) / 100);
}

/** At least one of every six accessible spaces must be van-accessible (§208.2.4). */
export function requiredVanSpaces(total: number): number {
	const accessible = requiredAccessibleSpaces(total);
	return accessible === 0 ? 0 : Math.ceil(accessible / 6);
}

const THRESHOLD_RAMP_SIZES: [number, string][] = [
	[0.5, '1/2-inch'],
	[0.75, '3/4-inch'],
	[1, '1-inch'],
	[1.5, '1 1/2-inch'],
	[2, '2-inch']
];

const PORTABLE_RAMP_FEET = [3, 4, 5, 6, 7, 8, 10, 12, 16, 20, 24, 30];

export interface RampChoice {
	item: 'threshold-ramp' | 'portable-ramp';
	size: string;
	note?: string;
}

/**
 * Pick a ramp for a measured rise in inches.
 * - Up to a 2-inch rise: a threshold ramp of the next standard height.
 * - Above that: a portable ramp at 1:12 (one foot of ramp per inch of rise),
 *   rounded up to the next stock length. Rises over 6 inches need handrails.
 * Returns null when no ramp is needed (≤ 1/2 inch) or the rise is not a number.
 */
export function rampForRise(rise: number): RampChoice | null {
	if (!Number.isFinite(rise) || rise <= 0.5) return null;
	for (const [height, size] of THRESHOLD_RAMP_SIZES) {
		if (rise <= height) return { item: 'threshold-ramp', size };
	}
	const feet = Math.ceil(rise);
	const stock = PORTABLE_RAMP_FEET.find((f) => f >= feet);
	if (stock === undefined) {
		return {
			item: 'portable-ramp',
			size: `${feet}-foot`,
			note: 'Longer than stock portable ramps; needs a modular ramp with landings.'
		};
	}
	const notes: string[] = [`For a ${formatInches(rise)} rise at 1:12.`];
	if (rise > 6) notes.push('Needs handrails on both sides.');
	return { item: 'portable-ramp', size: `${stock}-foot`, note: notes.join(' ') };
}

function formatInches(value: number): string {
	const rounded = Math.round(value * 4) / 4;
	return `${rounded}-inch`;
}

/** Convert a slope given as rise/run into a percentage. */
export function slopePercent(rise: number, run: number): number {
	if (!Number.isFinite(rise) || !Number.isFinite(run) || run <= 0) return NaN;
	return (rise / run) * 100;
}

/** Express a percentage slope as a 1:n ratio, e.g. 8.33 → "1:12". */
export function slopeRatio(percent: number): string {
	if (!Number.isFinite(percent) || percent <= 0) return '—';
	const n = 100 / percent;
	return `1:${n >= 10 ? Math.round(n) : Math.round(n * 10) / 10}`;
}
