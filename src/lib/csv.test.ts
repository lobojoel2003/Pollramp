import { describe, expect, it } from 'vitest';
import { parseCsv, parseSitesCsv, toCsv } from './csv.ts';
import { slugify } from './model.ts';

describe('csv', () => {
	it('parses quotes, commas, newlines and a BOM', () => {
		expect(parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\n"multi\nline",z\n')).toEqual([
			['a', 'b'],
			['x, y', 'he said "hi"'],
			['multi\nline', 'z']
		]);
	});

	it('writes Excel-friendly CSV and neutralizes formulas', () => {
		const out = toCsv(
			['Name', 'Lng', 'Tags'],
			[
				['=HYPERLINK("x")', -77.46, ['a', 'b']],
				['Plain, "quoted"', null, []]
			]
		);
		expect(out.startsWith('﻿')).toBe(true);
		expect(out).toContain(`"'=HYPERLINK(""x"")",-77.46,a; b`);
		expect(out).toContain('"Plain, ""quoted""",,');
	});

	it('maps a polling place spreadsheet to sites', () => {
		const { rows, errors } = parseSitesCsv(
			'Polling Place,Street Address,City,ST,Zip Code,Latitude,Longitude,Precinct\n' +
				'Oak Hill School,1 Main St,Richmond,va,23220,37.5,-77.4,101;102\n' +
				',missing name,,,,,,\n' +
				'Bad Coords Hall,2 Main St,Richmond,VA,23220,95,-77.4,103\n'
		);
		expect(rows).toHaveLength(2);
		expect(rows[0]).toMatchObject({
			name: 'Oak Hill School',
			address: '1 Main St',
			state: 'VA',
			postalCode: '23220',
			lat: 37.5,
			lng: -77.4,
			precincts: ['101', '102']
		});
		expect(rows[1].lat).toBeNull();
		expect(errors).toEqual([
			'Line 3: missing name, skipped.',
			'Line 4: invalid coordinates, imported without a map location.'
		]);
	});

	it('requires a name column', () => {
		expect(parseSitesCsv('address\n1 Main St').errors[0]).toMatch(/name/);
	});
});

describe('slugify', () => {
	it('makes stable, readable URLs', () => {
		expect(slugify("St. Brendan's Parish Hall")).toBe('st-brendan-s-parish-hall');
		expect(slugify('Café & Library — Annex')).toBe('cafe-and-library-annex');
		expect(slugify('***')).toBe('site');
	});
});
