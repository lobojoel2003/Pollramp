/** RFC 4180 CSV parsing and writing, small enough to share between browser and server. */

export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

	for (let i = 0; i < input.length; i++) {
		const ch = input[i];
		if (quoted) {
			if (ch === '"') {
				if (input[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					quoted = false;
				}
			} else {
				field += ch;
			}
			continue;
		}
		if (ch === '"' && field === '') {
			quoted = true;
		} else if (ch === ',') {
			row.push(field);
			field = '';
		} else if (ch === '\n' || ch === '\r') {
			if (ch === '\r' && input[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += ch;
		}
	}
	if (field !== '' || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function cellText(value: unknown): string {
	if (Array.isArray(value)) return value.map(cellText).join('; ');
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
		return String(value);
	if (value instanceof Date) return value.toISOString();
	return JSON.stringify(value) ?? '';
}

function escapeCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
	let text = cellText(value);
	// Neutralize spreadsheet formula injection (but leave plain numbers like -77.46 alone).
	if (/^[=+\-@\t\r]/.test(text) && !/^[-+]?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Write CSV with a UTF-8 BOM so Excel opens accented names correctly. */
export function toCsv(header: string[], rows: unknown[][]): string {
	const lines = [header, ...rows].map((r) => r.map(escapeCell).join(','));
	return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export interface SiteImportRow {
	line: number;
	name: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	lat: number | null;
	lng: number | null;
	precincts: string[];
	notes: string;
}

const ALIASES: Record<string, keyof Omit<SiteImportRow, 'line'>> = {
	name: 'name',
	site: 'name',
	'site name': 'name',
	'polling place': 'name',
	location: 'name',
	address: 'address',
	street: 'address',
	'street address': 'address',
	city: 'city',
	town: 'city',
	state: 'state',
	st: 'state',
	zip: 'postalCode',
	zipcode: 'postalCode',
	'zip code': 'postalCode',
	postal_code: 'postalCode',
	'postal code': 'postalCode',
	lat: 'lat',
	latitude: 'lat',
	lng: 'lng',
	lon: 'lng',
	long: 'lng',
	longitude: 'lng',
	precinct: 'precincts',
	precincts: 'precincts',
	notes: 'notes',
	note: 'notes'
};

/** Map a spreadsheet of polling places to site rows. Unknown columns are ignored. */
export function parseSitesCsv(text: string): { rows: SiteImportRow[]; errors: string[] } {
	const table = parseCsv(text);
	const errors: string[] = [];
	if (table.length === 0) return { rows: [], errors: ['The file is empty.'] };
	const header = table[0].map((h) => ALIASES[h.trim().toLowerCase().replace(/\s+/g, ' ')]);
	if (!header.includes('name')) {
		return {
			rows: [],
			errors: ['The first row needs a "name" column (also accepted: site, polling place).']
		};
	}
	const rows: SiteImportRow[] = [];
	table.slice(1).forEach((cells, index) => {
		const line = index + 2;
		const get = (key: keyof Omit<SiteImportRow, 'line'>) => {
			const col = header.indexOf(key);
			return col >= 0 ? (cells[col] ?? '').trim() : '';
		};
		const name = get('name');
		if (!name) {
			errors.push(`Line ${line}: missing name, skipped.`);
			return;
		}
		const lat = get('lat') ? Number(get('lat')) : null;
		const lng = get('lng') ? Number(get('lng')) : null;
		const badCoords =
			(lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
			(lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180));
		if (badCoords)
			errors.push(`Line ${line}: invalid coordinates, imported without a map location.`);
		rows.push({
			line,
			name: name.slice(0, 200),
			address: get('address').slice(0, 300),
			city: get('city').slice(0, 120),
			state: get('state').toUpperCase().slice(0, 2),
			postalCode: get('postalCode').slice(0, 20),
			lat: badCoords ? null : lat,
			lng: badCoords ? null : lng,
			precincts: get('precincts')
				.split(/[;|]/)
				.map((p) => p.trim())
				.filter(Boolean)
				.slice(0, 50),
			notes: get('notes').slice(0, 2000)
		});
	});
	return { rows, errors };
}
