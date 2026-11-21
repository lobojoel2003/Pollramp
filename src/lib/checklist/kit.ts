import type { KitLine } from './types.ts';

export function kitLineKey(line: Pick<KitLine, 'item' | 'size'>): string {
	return line.size ? `${line.item}|${line.size}` : line.item;
}

/** Merge kit lines with the same item and size, summing quantities. Order is stable. */
export function mergeKit(lines: KitLine[]): KitLine[] {
	const merged = new Map<string, KitLine>();
	for (const line of lines) {
		if (line.qty <= 0) continue;
		const key = kitLineKey(line);
		const existing = merged.get(key);
		if (existing) {
			existing.qty += line.qty;
			for (const id of line.for) if (!existing.for.includes(id)) existing.for.push(id);
			if (line.note && !existing.note?.includes(line.note)) {
				existing.note = existing.note ? `${existing.note} ${line.note}` : line.note;
			}
		} else {
			merged.set(key, { ...line, for: [...line.for] });
		}
	}
	return [...merged.values()];
}

export interface SiteKit {
	siteId: string;
	siteName: string;
	kit: KitLine[];
}

export interface OfficeKitLine {
	item: string;
	name: string;
	size?: string;
	qty: number;
	sites: { siteId: string; siteName: string; qty: number }[];
}

/** Office-wide totals for procurement: every site's election-day kit, summed. */
export function aggregateKits(sites: SiteKit[]): OfficeKitLine[] {
	const totals = new Map<string, OfficeKitLine>();
	for (const site of sites) {
		for (const line of site.kit) {
			const key = kitLineKey(line);
			let total = totals.get(key);
			if (!total) {
				total = { item: line.item, name: line.name, size: line.size, qty: 0, sites: [] };
				totals.set(key, total);
			}
			total.qty += line.qty;
			total.sites.push({ siteId: site.siteId, siteName: site.siteName, qty: line.qty });
		}
	}
	return [...totals.values()].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}

const WORDS = [
	'zero',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
	'ten'
];

export function numberWord(n: number): string {
	return Number.isInteger(n) && n >= 0 && n < WORDS.length ? WORDS[n] : String(n);
}

function lowerFirst(text: string): string {
	return /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

const HEAD_BREAK = /\s(?:\(|on |with |for |—)/;

/** Naive English plural of the head noun: "Traffic cone (28-inch)" → "Traffic cones (28-inch)". */
export function pluralize(name: string): string {
	const match = HEAD_BREAK.exec(name);
	const head = match ? name.slice(0, match.index) : name;
	const tail = match ? name.slice(match.index) : '';
	let plural: string;
	if (/(s|x|z|ch|sh)$/i.test(head)) plural = `${head}es`;
	else if (/[^aeiou]y$/i.test(head)) plural = `${head.slice(0, -1)}ies`;
	else plural = `${head}s`;
	return plural + tail;
}

/** Describe one kit line in words: "one 2-inch threshold ramp", "eight traffic cones (28-inch)". */
export function describeKitLine(line: Pick<KitLine, 'qty' | 'name' | 'size'>): string {
	const name = lowerFirst(line.qty === 1 ? line.name : pluralize(line.name));
	return `${numberWord(line.qty)} ${line.size ? `${line.size} ` : ''}${name}`;
}

/** "Bring one 2-inch threshold ramp and one “Accessible entrance” sign with arrow." */
export function kitSentence(lines: Pick<KitLine, 'qty' | 'name' | 'size'>[]): string {
	const parts = lines.filter((l) => l.qty > 0).map(describeKitLine);
	if (parts.length === 0) return '';
	const list =
		parts.length === 1
			? parts[0]
			: parts.length === 2
				? `${parts[0]} and ${parts[1]}`
				: `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
	return `Bring ${list}.`;
}
