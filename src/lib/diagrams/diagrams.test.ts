import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Diagram from './Diagram.svelte';
import { diagrams, hasDiagram } from './index';

/** Every diagram id that checklist items may reference. */
const IDS = [
	'parking-count',
	'parking-space-width',
	'access-aisle',
	'van-space',
	'vertical-clearance',
	'slope',
	'cross-slope',
	'sign-height',
	'route-width',
	'dropoff',
	'curb-ramp',
	'level-change',
	'surface',
	'grating',
	'protruding-object',
	'headroom',
	'signage',
	'ramp',
	'handrail',
	'doorbell',
	'door-width',
	'threshold',
	'door-hardware',
	'door-force',
	'door-closer',
	'maneuvering-clearance',
	'vestibule',
	'elevator',
	'reach-range',
	'turning-space',
	'table-height',
	'voting-station',
	'clear-floor-space',
	'seating',
	'lighting',
	'aisle-marking',
	'detectable-warning',
	'curbside',
	'parking-space-length',
	'parking-outline'
];

describe('diagram registry', () => {
	it('has an entry for every diagram id', () => {
		const missing = IDS.filter((id) => !hasDiagram(id));
		expect(missing).toEqual([]);
		expect(Object.keys(diagrams).sort()).toEqual([...IDS].sort());
	});

	it('hasDiagram rejects unknown ids', () => {
		expect(hasDiagram(undefined)).toBe(false);
		expect(hasDiagram('')).toBe(false);
		expect(hasDiagram('no-such-diagram')).toBe(false);
		expect(hasDiagram('toString')).toBe(false);
	});
});

describe.each(Object.entries(diagrams))('diagram %s', (id, entry) => {
	const { body } = render(entry.component);

	it('renders an accessible svg', () => {
		expect(entry.title.trim()).not.toBe('');
		expect(body).toContain('role="img"');
		expect(body).toContain('viewBox="0 0 320 200"');
		expect(body).toMatch(/<title[^>]*>[^<]*\S[^<]*<\/title>/);
		expect(body).toMatch(/<desc[^>]*>[^<]*\S[^<]*<\/desc>/);
	});

	it('labels itself with its own title and desc', () => {
		const labelledBy = body.match(/aria-labelledby="([^"]+)"/)?.[1].split(' ') ?? [];
		expect(labelledBy).toHaveLength(2);
		for (const ref of labelledBy) expect(body).toContain(`id="${ref}"`);
		expect(body).toMatch(new RegExp(`<title id="${labelledBy[0]}">`));
		expect(body).toMatch(new RegExp(`<desc id="${labelledBy[1]}">`));
	});

	it('uses the registry title', () => {
		const title = body.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];
		expect(title, id).toBe(entry.title);
	});

	it('draws with classes rather than var() attributes and no markers', () => {
		expect(body).not.toMatch(/(fill|stroke)="var\(/);
		expect(body).not.toContain('<marker');
	});
});

describe('Diagram', () => {
	it('wraps a known diagram in a figure', () => {
		const { body } = render(Diagram, { props: { id: 'door-width', class: 'wide' } });
		expect(body).toMatch(/<figure class="diagram wide[^"]*"/);
		expect(body).toContain('Door clear width');
	});

	it('falls back to a neutral graphic for unknown or missing ids', () => {
		for (const id of [undefined, 'no-such-diagram']) {
			const { body } = render(Diagram, { props: { id } });
			expect(body).toContain('<figure class="diagram');
			expect(body).toContain('role="img"');
			expect(body).toMatch(/<title[^>]*>Survey item<\/title>/);
		}
	});
});
