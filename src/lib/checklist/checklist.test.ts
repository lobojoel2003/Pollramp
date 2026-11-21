import { describe, expect, it } from 'vitest';
import {
	evaluateSurvey,
	firstUnanswered,
	isApplicable,
	nextItem,
	previousItem
} from './evaluate.ts';
import { lintChecklists, lintResolved } from './lint.ts';
import { aggregateKits, kitSentence, mergeKit, pluralize } from './kit.ts';
import { formatMeasurement, parseMeasurement } from './measure.ts';
import { voterSummary } from './public.ts';
import {
	availableOverlays,
	bases,
	defaultChecklistKey,
	getChecklist,
	latestBase,
	overlays
} from './registry.ts';
import { ChecklistError, parseChecklistKey, resolveChecklist, satisfies } from './resolve.ts';
import {
	rampForRise,
	requiredAccessibleSpaces,
	requiredVanSpaces,
	slopePercent,
	slopeRatio
} from './ada.ts';
import type { Responses, BaseChecklist, Overlay } from './types.ts';
import { diagrams } from '../diagrams/index.ts';

const yes = { value: true };
const no = { value: false };
const n = (value: number) => ({ value });
const s = (value: string) => ({ value });

/** A site where everything passes and optional sections are gated off. */
function passingResponses(): Responses {
	return {
		'parking.provided': yes,
		'parking.total-spaces': n(40),
		'parking.accessible-spaces': n(2),
		'parking.van-spaces': n(1),
		'parking.space-width': n(96),
		'parking.aisle-width': n(60),
		'parking.van-combined-width': n(192),
		'parking.van-covered': no,
		'parking.surface-slope': n(1.5),
		'parking.signs': yes,
		'parking.sign-height': n(62),
		'parking.van-sign': yes,
		'parking.nearest-entrance': yes,
		'dropoff.provided': no,
		'route.level-change': n(0.25),
		'route.width': n(48),
		'route.surface': s('paved'),
		'route.running-slope': n(3),
		'route.cross-slope': n(1.5),
		'route.openings': no,
		'route.protruding': no,
		'route.headroom': { value: null, na: true },
		'route.signage': s('same'),
		'curb-ramps.present': no,
		'ramps.present': no,
		'entrance.is-main': yes,
		'entrance.unlocked': yes,
		'entrance.clear-width': n(34),
		'entrance.threshold': n(0.25),
		'entrance.hardware': s('lever'),
		'entrance.hardware-height': n(38),
		'entrance.opening-force': n(4),
		'entrance.closing-speed': n(6),
		'entrance.maneuvering': yes,
		'entrance.vestibule': s('none'),
		'interior.width': n(60),
		'interior.level-change': n(0),
		'interior.protruding': no,
		'interior.door-width': n(34),
		'interior.door-force': n(4),
		'interior.same-floor': yes,
		'voting-area.aisle-width': n(40),
		'voting-area.turning-space': yes,
		'voting-area.check-in-height': n(30),
		'voting-area.accessible-system': yes,
		'voting-area.booth-clear-space': yes,
		'voting-area.booth-height': n(30),
		'voting-area.knee-clearance': n(28),
		'voting-area.reach': n(40),
		'voting-area.privacy': yes,
		'voting-area.cords': yes,
		'voting-area.seating': yes,
		'voting-area.lighting': yes,
		'voting-area.aids': yes
	};
}

describe('ADA rules', () => {
	it('computes required accessible spaces from Table 208.2', () => {
		expect(requiredAccessibleSpaces(0)).toBe(0);
		expect(requiredAccessibleSpaces(1)).toBe(1);
		expect(requiredAccessibleSpaces(25)).toBe(1);
		expect(requiredAccessibleSpaces(26)).toBe(2);
		expect(requiredAccessibleSpaces(100)).toBe(4);
		expect(requiredAccessibleSpaces(500)).toBe(9);
		expect(requiredAccessibleSpaces(501)).toBe(11);
		expect(requiredAccessibleSpaces(1000)).toBe(20);
		expect(requiredAccessibleSpaces(1001)).toBe(21);
		expect(requiredAccessibleSpaces(1500)).toBe(25);
	});

	it('requires one van space per six accessible spaces', () => {
		expect(requiredVanSpaces(10)).toBe(1);
		expect(requiredVanSpaces(300)).toBe(2);
		expect(requiredVanSpaces(0)).toBe(0);
	});

	it('sizes ramps by rise', () => {
		expect(rampForRise(0.5)).toBeNull();
		expect(rampForRise(0.6)).toEqual({ item: 'threshold-ramp', size: '3/4-inch' });
		expect(rampForRise(1.75)).toEqual({ item: 'threshold-ramp', size: '2-inch' });
		expect(rampForRise(4)?.size).toBe('4-foot');
		expect(rampForRise(6.5)?.size).toBe('7-foot');
		expect(rampForRise(6.5)?.note).toMatch(/handrails/);
		expect(rampForRise(9)?.size).toBe('10-foot');
		expect(rampForRise(40)?.note).toMatch(/modular/);
	});

	it('converts slopes', () => {
		expect(slopePercent(1, 12)).toBeCloseTo(8.333, 2);
		expect(slopeRatio(8.33)).toBe('1:12');
		expect(slopeRatio(2.08)).toBe('1:48');
		expect(slopeRatio(0)).toBe('—');
	});
});

describe('measurements', () => {
	it('parses tape-measure input', () => {
		expect(parseMeasurement('32')).toBe(32);
		expect(parseMeasurement('32.5')).toBe(32.5);
		expect(parseMeasurement('1/2')).toBe(0.5);
		expect(parseMeasurement('32 1/2')).toBe(32.5);
		expect(parseMeasurement('32-1/4 in')).toBe(32.25);
		expect(parseMeasurement(`8' 2"`)).toBe(98);
		expect(parseMeasurement('8 ft')).toBe(96);
		expect(parseMeasurement('8.33%', 'percent')).toBe(8.33);
		expect(parseMeasurement('5 lbf', 'lbf')).toBe(5);
		expect(parseMeasurement('abc')).toBeNaN();
		expect(parseMeasurement('')).toBeNaN();
		expect(parseMeasurement('1/0')).toBeNaN();
	});

	it('formats with fractions', () => {
		expect(formatMeasurement(32.5, 'in')).toBe('32 1/2 in');
		expect(formatMeasurement(0.25, 'in')).toBe('1/4 in');
		expect(formatMeasurement(96, 'in')).toBe('96 in');
		expect(formatMeasurement(8.333, 'percent')).toBe('8.33%');
		expect(formatMeasurement(4.5, 'lbf')).toBe('4.5 lbf');
		expect(formatMeasurement(NaN, 'in')).toBe('—');
	});
});

describe('checklist registry and resolution', () => {
	it('bundles the base and every overlay', () => {
		expect(bases.map((b) => b.id)).toContain('doj-base');
		expect(overlays.map((o) => o.id).sort()).toEqual(['us-ca', 'us-fl', 'us-va']);
		expect(availableOverlays()).toHaveLength(3);
	});

	it('picks a default overlay from the state', () => {
		const base = latestBase();
		expect(defaultChecklistKey('CA')).toBe(`doj-base@${base.version}+us-ca@1.0.0`);
		expect(defaultChecklistKey('ohio')).toBe(`doj-base@${base.version}`);
		expect(defaultChecklistKey(undefined)).toBe(`doj-base@${base.version}`);
	});

	it('parses checklist keys', () => {
		expect(parseChecklistKey('doj-base@1.0.0+us-ca@1.2.3')).toEqual({
			base: { id: 'doj-base', version: '1.0.0' },
			overlay: { id: 'us-ca', version: '1.2.3' }
		});
		expect(() => parseChecklistKey('nope')).toThrow(ChecklistError);
	});

	it('checks semver ranges', () => {
		expect(satisfies('1.4.0', '^1.0.0')).toBe(true);
		expect(satisfies('2.0.0', '^1.0.0')).toBe(false);
		expect(satisfies('0.3.1', '^0.3.0')).toBe(true);
		expect(satisfies('0.4.0', '^0.3.0')).toBe(false);
		expect(satisfies('1.2.9', '~1.2.0')).toBe(true);
		expect(satisfies('1.3.0', '~1.2.0')).toBe(false);
		expect(satisfies('1.0.0', '1.0.0')).toBe(true);
		expect(satisfies('0.9.0', '^1.0.0')).toBe(false);
	});

	it('applies the California overlay with provenance', () => {
		const ca = getChecklist('doj-base@1.0.0+us-ca@1.0.0');
		const parking = ca.sections.find((sec) => sec.id === 'parking')!;
		const width = parking.items.find((i) => i.id === 'parking.space-width')!;
		expect(width.pass).toEqual({ op: '>=', value: 108 });
		expect(width.origin).toBe('us-ca@1.0.0');
		expect(width.references).toEqual(['2010 ADA Standards §502.2', 'CBC §11B-502.2']);
		const ids = parking.items.map((i) => i.id);
		expect(ids.indexOf('parking.ca-space-length')).toBe(ids.indexOf('parking.space-width') + 1);
		expect(ca.kit.some((k) => k.id === 'detectable-warning-mat')).toBe(true);
		// The base is untouched.
		const base = getChecklist('doj-base@1.0.0');
		expect(base.sections[0].items.find((i) => i.id === 'parking.space-width')!.pass).toEqual({
			op: '>=',
			value: 96
		});
	});

	it('adds Virginia curbside voting after drop-off', () => {
		const va = getChecklist('doj-base@1.0.0+us-va@1.0.0');
		const order = va.sections.map((sec) => sec.id);
		expect(order.indexOf('curbside')).toBe(order.indexOf('dropoff') + 1);
	});

	it('rejects incompatible overlays and bad patches', () => {
		const base = latestBase();
		const overlay: Overlay = {
			kind: 'overlay',
			id: 'test',
			version: '1.0.0',
			title: 'Test',
			jurisdiction: 'US-TX',
			description: 'x',
			license: 'CC0-1.0',
			extends: { id: 'doj-base', version: '^2.0.0' },
			sources: [{ title: 'x' }]
		};
		expect(() => resolveChecklist(base, overlay)).toThrow(/needs/);
		expect(() =>
			resolveChecklist(base, {
				...overlay,
				extends: { id: 'doj-base', version: '^1.0.0' },
				items: { patch: { 'parking.missing': { help: 'x' } } }
			})
		).toThrow(/missing item/);
	});

	it('supports removing items', () => {
		const base = latestBase();
		const resolved = resolveChecklist(base, {
			kind: 'overlay',
			id: 'test',
			version: '1.0.0',
			title: 'Test',
			jurisdiction: 'US-TX',
			description: 'x',
			license: 'CC0-1.0',
			extends: { id: 'doj-base', version: '^1.0.0' },
			sources: [{ title: 'x' }],
			items: { remove: ['voting-area.aids'] }
		});
		expect(
			resolved.sections.flatMap((sec) => sec.items).some((i) => i.id === 'voting-area.aids')
		).toBe(false);
	});
});

describe('lint', () => {
	it('passes for every bundled checklist, and every diagram exists', () => {
		expect(lintChecklists(bases, overlays, new Set(Object.keys(diagrams)))).toEqual([]);
	});

	it('catches broken references', () => {
		const base = structuredClone<BaseChecklist>(latestBase());
		const item = base.sections[0].items[3];
		item.when = [{ item: 'voting-area.aids', op: 'equals', value: true }];
		item.fix!.kit = [{ item: 'no-such-kit' }];
		base.sections[0].items.push({ ...base.sections[0].items[1] });
		const errors = lintResolved(resolveChecklist(base), new Set(['parking-count']));
		expect(errors.join('\n')).toMatch(/not an earlier item/);
		expect(errors.join('\n')).toMatch(/no-such-kit/);
		expect(errors.join('\n')).toMatch(/duplicate item id/);
		expect(errors.join('\n')).toMatch(/unknown diagram/);
	});
});

describe('evaluation', () => {
	const checklist = getChecklist('doj-base@1.0.0');

	it('marks an empty survey incomplete', () => {
		const result = evaluateSurvey(checklist, {});
		expect(result.status).toBe('incomplete');
		expect(result.kit).toEqual([]);
	});

	it('rates a fully compliant site accessible', () => {
		const result = evaluateSurvey(checklist, passingResponses());
		expect(result.counts.unanswered).toBe(0);
		expect(result.counts.fail).toBe(0);
		expect(result.status).toBe('accessible');
		expect(result.sections.find((sec) => sec.id === 'ramps')?.status).toBe('na');
	});

	it('skips gated sections', () => {
		const section = checklist.sections.find((sec) => sec.id === 'ramps')!;
		const slope = section.items.find((i) => i.id === 'ramps.slope')!;
		expect(isApplicable(slope, section, { 'ramps.present': no })).toBe(false);
		expect(isApplicable(slope, section, { 'ramps.present': yes })).toBe(true);
		expect(isApplicable(slope, section, {})).toBe(false);
	});

	it('suggests a threshold ramp and sign for a raised threshold', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'entrance.threshold': n(1.75)
		});
		expect(result.status).toBe('fixable');
		const item = result.items.find((i) => i.id === 'entrance.threshold')!;
		expect(item.outcome).toBe('fail');
		expect(item.fix?.kind).toBe('kit');
		expect(item.fix?.kit.map((k) => [k.item, k.size, k.qty])).toEqual([
			['threshold-ramp', '2-inch', 1],
			['sign-accessible-entrance', undefined, 1]
		]);
		expect(kitSentence(item.fix!.kit)).toBe(
			'Bring one 2-inch threshold ramp and one “Accessible entrance” sign with arrow.'
		);
	});

	it('computes accessible parking shortfall from total spaces', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'parking.total-spaces': n(120),
			'parking.accessible-spaces': n(2)
		});
		const item = result.items.find((i) => i.id === 'parking.accessible-spaces')!;
		expect(item.threshold).toBe(5);
		expect(item.outcome).toBe('fail');
		const cones = item.fix!.kit.find((k) => k.item === 'traffic-cone')!;
		const signs = item.fix!.kit.find((k) => k.item === 'sign-accessible-parking')!;
		expect(cones.qty).toBe(12);
		expect(signs.qty).toBe(3);
	});

	it('escalates very large rises to a structural barrier', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'route.level-change': n(36)
		});
		const item = result.items.find((i) => i.id === 'route.level-change')!;
		expect(item.fix?.kind).toBe('structural');
		expect(result.status).toBe('barriers');
	});

	it('sizes a portable ramp from a follow-up curb height', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'curb-ramps.present': yes,
			'curb-ramps.provided': no,
			'curb-ramps.curb-height': n(6)
		});
		const item = result.items.find((i) => i.id === 'curb-ramps.provided')!;
		expect(item.fix?.kit[0]).toMatchObject({ item: 'portable-ramp', size: '6-foot' });
	});

	it('asks for a measurement when ramp sizing has no rise yet', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'curb-ramps.present': yes,
			'curb-ramps.provided': no
		});
		const item = result.items.find((i) => i.id === 'curb-ramps.provided')!;
		expect(item.fix?.kit[0].note).toMatch(/Measure the rise/);
		expect(result.status).toBe('incomplete');
	});

	it('treats choice failures and N/A correctly', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'entrance.hardware': s('knob'),
			'route.width': { value: null, na: true }
		});
		expect(result.items.find((i) => i.id === 'entrance.hardware')!.outcome).toBe('fail');
		expect(result.items.find((i) => i.id === 'route.width')!.outcome).toBe('na');
	});

	it('skips door force for automatic doors', () => {
		const result = evaluateSurvey(checklist, {
			...passingResponses(),
			'entrance.hardware': s('automatic'),
			'entrance.opening-force': n(12)
		});
		expect(result.items.find((i) => i.id === 'entrance.opening-force')!.outcome).toBe('skipped');
		expect(result.status).toBe('accessible');
	});

	it('walks items in route order', () => {
		const responses = passingResponses();
		expect(nextItem(checklist, {})?.item.id).toBe('parking.provided');
		expect(nextItem(checklist, { 'parking.provided': no }, 'parking.provided')?.item.id).toBe(
			'dropoff.provided'
		);
		expect(nextItem(checklist, responses, 'parking.van-covered')?.item.id).toBe(
			'parking.surface-slope'
		);
		expect(previousItem(checklist, responses, 'parking.surface-slope')?.item.id).toBe(
			'parking.van-covered'
		);
		expect(firstUnanswered(checklist, responses)).toBeUndefined();
		const partial = { ...responses };
		delete partial['entrance.threshold'];
		expect(firstUnanswered(checklist, partial)?.item.id).toBe('entrance.threshold');
	});

	it('applies the Florida 12-foot rule', () => {
		const fl = getChecklist('doj-base@1.0.0+us-fl@1.0.0');
		const result = evaluateSurvey(fl, { ...passingResponses(), 'parking.space-width': n(108) });
		expect(result.items.find((i) => i.id === 'parking.space-width')!.outcome).toBe('fail');
		expect(result.status).toBe('incomplete'); // Florida adds items that are still unanswered
	});
});

describe('kit', () => {
	it('merges duplicate lines', () => {
		const merged = mergeKit([
			{ item: 'traffic-cone', name: 'Traffic cone', qty: 4, for: ['a'] },
			{ item: 'traffic-cone', name: 'Traffic cone', qty: 2, for: ['b'] },
			{ item: 'threshold-ramp', name: 'Threshold ramp', size: '1-inch', qty: 1, for: ['c'] },
			{ item: 'threshold-ramp', name: 'Threshold ramp', size: '2-inch', qty: 1, for: ['d'] },
			{ item: 'door-wedge', name: 'Door wedge', qty: 0, for: ['e'] }
		]);
		expect(merged.map((l) => [l.item, l.size, l.qty, l.for])).toEqual([
			['traffic-cone', undefined, 6, ['a', 'b']],
			['threshold-ramp', '1-inch', 1, ['c']],
			['threshold-ramp', '2-inch', 1, ['d']]
		]);
	});

	it('aggregates office-wide totals', () => {
		const totals = aggregateKits([
			{
				siteId: '1',
				siteName: 'A',
				kit: [{ item: 'door-wedge', name: 'Door wedge', qty: 2, for: [] }]
			},
			{
				siteId: '2',
				siteName: 'B',
				kit: [{ item: 'door-wedge', name: 'Door wedge', qty: 1, for: [] }]
			}
		]);
		expect(totals).toEqual([
			{
				item: 'door-wedge',
				name: 'Door wedge',
				size: undefined,
				qty: 3,
				sites: [
					{ siteId: '1', siteName: 'A', qty: 2 },
					{ siteId: '2', siteName: 'B', qty: 1 }
				]
			}
		]);
	});

	it('writes natural sentences', () => {
		expect(pluralize('Traffic cone (28-inch)')).toBe('Traffic cones (28-inch)');
		expect(pluralize('Magnifying sheet')).toBe('Magnifying sheets');
		expect(pluralize('Accessible parking sign on a portable stand')).toBe(
			'Accessible parking signs on a portable stand'
		);
		expect(
			kitSentence([
				{ qty: 8, name: 'Traffic cone (28-inch)' },
				{ qty: 2, name: 'Accessible parking sign on a portable stand' },
				{ qty: 1, name: 'Ground marking tape (roll)' }
			])
		).toBe(
			'Bring eight traffic cones (28-inch), two accessible parking signs on a portable stand, and one ground marking tape (roll).'
		);
		expect(kitSentence([])).toBe('');
	});
});

describe('voter summary', () => {
	it('lists available features and election-day fixes in arrival order', () => {
		const checklist = getChecklist('doj-base@1.0.0');
		const responses = { ...passingResponses(), 'entrance.threshold': n(1.5) };
		const result = evaluateSurvey(checklist, responses);
		const summary = voterSummary(checklist, result, responses);
		expect(summary.map((g) => g.title)).toEqual([
			'Parking and drop-off',
			'Getting to the entrance',
			'Entrance',
			'Inside the building',
			'Voting area'
		]);
		const parking = summary[0].features.find((f) => f.item === 'parking.accessible-spaces')!;
		expect(parking.text).toBe('2 accessible parking spaces.');
		const threshold = summary[2].features.find((f) => f.item === 'entrance.threshold')!;
		expect(threshold.state).toBe('election-day');
		expect(threshold.text).toMatch(/threshold ramp/);
	});
});
