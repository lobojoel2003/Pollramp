import type {
	BaseChecklist,
	Item,
	ItemPatch,
	KitItemDef,
	Overlay,
	ResolvedChecklist,
	Section
} from './types.ts';

export class ChecklistError extends Error {
	name = 'ChecklistError';
}

export function docKey(doc: { id: string; version: string }): string {
	return `${doc.id}@${doc.version}`;
}

/** `doj-base@1.0.0` or `doj-base@1.0.0+us-ca@1.0.0` */
export function checklistKey(
	base: { id: string; version: string },
	overlay?: { id: string; version: string }
) {
	return overlay ? `${docKey(base)}+${docKey(overlay)}` : docKey(base);
}

export function parseChecklistKey(key: string): {
	base: { id: string; version: string };
	overlay?: { id: string; version: string };
} {
	const [basePart, overlayPart] = key.split('+');
	const parse = (part: string) => {
		const at = part.lastIndexOf('@');
		if (at <= 0) throw new ChecklistError(`Invalid checklist key "${key}"`);
		return { id: part.slice(0, at), version: part.slice(at + 1) };
	};
	return { base: parse(basePart), overlay: overlayPart ? parse(overlayPart) : undefined };
}

function parseVersion(v: string): [number, number, number] {
	const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
	if (!m) throw new ChecklistError(`Invalid version "${v}"`);
	return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareVersions(a: string, b: string): number {
	const [a1, a2, a3] = parseVersion(a);
	const [b1, b2, b3] = parseVersion(b);
	return a1 - b1 || a2 - b2 || a3 - b3;
}

/** Minimal semver range check: `1.2.3`, `^1.2.3`, `~1.2.3`. */
export function satisfies(version: string, range: string): boolean {
	const op = range[0] === '^' || range[0] === '~' ? range[0] : '';
	const min = op ? range.slice(1) : range;
	const [v1, v2] = parseVersion(version);
	const [m1, m2] = parseVersion(min);
	if (compareVersions(version, min) < 0) return false;
	if (op === '') return compareVersions(version, min) === 0;
	if (op === '~') return v1 === m1 && v2 === m2;
	// caret: same major (or same minor for 0.x)
	return m1 === 0 ? v1 === 0 && v2 === m2 : v1 === m1;
}

function clone<T>(value: T): T {
	return structuredClone(value);
}

function stamp<T extends { origin?: string }>(value: T, origin: string): T {
	return { ...value, origin };
}

function applyItemPatch(item: Item, patch: ItemPatch, origin: string): Item {
	const { addReferences, ...fields } = patch;
	const next: Item = { ...item, ...clone(fields), origin };
	if (addReferences?.length) {
		const refs = [...(next.references ?? [])];
		for (const ref of addReferences) if (!refs.includes(ref)) refs.push(ref);
		next.references = refs;
	}
	return next;
}

function findItem(sections: Section[], id: string): { section: Section; index: number } | null {
	for (const section of sections) {
		const index = section.items.findIndex((i) => i.id === id);
		if (index >= 0) return { section, index };
	}
	return null;
}

/**
 * Apply an overlay to a base checklist. The result lists every item in walking order with
 * `origin` set to the document that last defined or changed it, so the UI can show
 * "California rule" badges and old surveys can be re-evaluated exactly.
 */
export function resolveChecklist(base: BaseChecklist, overlay?: Overlay): ResolvedChecklist {
	const baseOrigin = docKey(base);
	let sections: Section[] = clone(base.sections).map((s) => ({
		...stamp(s, baseOrigin),
		items: s.items.map((i) => stamp(i, baseOrigin))
	}));
	let kit: KitItemDef[] = clone(base.kit).map((k) => stamp(k, baseOrigin));

	if (overlay) {
		if (overlay.extends.id !== base.id) {
			throw new ChecklistError(
				`Overlay ${docKey(overlay)} extends "${overlay.extends.id}", not "${base.id}"`
			);
		}
		if (!satisfies(base.version, overlay.extends.version)) {
			throw new ChecklistError(
				`Overlay ${docKey(overlay)} needs ${overlay.extends.id}@${overlay.extends.version}, got ${base.version}`
			);
		}
		const origin = docKey(overlay);

		for (const { after, section } of overlay.sections?.add ?? []) {
			if (sections.some((s) => s.id === section.id)) {
				throw new ChecklistError(`${origin}: section "${section.id}" already exists`);
			}
			const added: Section = {
				...stamp(clone(section), origin),
				items: section.items.map((i) => stamp(clone(i), origin))
			};
			const index = after ? sections.findIndex((s) => s.id === after) : sections.length - 1;
			if (after && index < 0)
				throw new ChecklistError(`${origin}: no section "${after}" to add after`);
			sections = [...sections.slice(0, index + 1), added, ...sections.slice(index + 1)];
		}

		for (const [id, patch] of Object.entries(overlay.sections?.patch ?? {})) {
			const section = sections.find((s) => s.id === id);
			if (!section) throw new ChecklistError(`${origin}: cannot patch missing section "${id}"`);
			Object.assign(section, clone(patch), { origin });
		}

		for (const id of overlay.items?.remove ?? []) {
			const found = findItem(sections, id);
			if (!found) throw new ChecklistError(`${origin}: cannot remove missing item "${id}"`);
			found.section.items.splice(found.index, 1);
			if (found.section.gate === id) delete found.section.gate;
		}

		for (const { section: sectionId, after, item } of overlay.items?.add ?? []) {
			const section = sections.find((s) => s.id === sectionId);
			if (!section)
				throw new ChecklistError(`${origin}: no section "${sectionId}" for "${item.id}"`);
			if (findItem(sections, item.id))
				throw new ChecklistError(`${origin}: item "${item.id}" already exists`);
			const index = after
				? section.items.findIndex((i) => i.id === after)
				: section.items.length - 1;
			if (after && index < 0)
				throw new ChecklistError(`${origin}: no item "${after}" in "${sectionId}"`);
			section.items.splice(index + 1, 0, stamp(clone(item), origin));
		}

		for (const [id, patch] of Object.entries(overlay.items?.patch ?? {})) {
			const found = findItem(sections, id);
			if (!found) throw new ChecklistError(`${origin}: cannot patch missing item "${id}"`);
			found.section.items[found.index] = applyItemPatch(
				found.section.items[found.index],
				patch,
				origin
			);
		}

		for (const def of overlay.kit ?? []) {
			const index = kit.findIndex((k) => k.id === def.id);
			const stamped = stamp(clone(def), origin);
			if (index >= 0) kit[index] = stamped;
			else kit = [...kit, stamped];
		}
	}

	return {
		key: checklistKey(base, overlay),
		base: { id: base.id, version: base.version },
		overlay: overlay ? { id: overlay.id, version: overlay.version } : undefined,
		title: overlay ? `${base.title} + ${overlay.title}` : base.title,
		jurisdiction: overlay?.jurisdiction ?? base.jurisdiction,
		sources: [...clone(base.sources), ...clone(overlay?.sources ?? [])],
		kit,
		sections
	};
}

/** Flat list of items in walking order, each with its section id. */
export function flattenItems(checklist: ResolvedChecklist): (Item & { section: string })[] {
	return checklist.sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.id })));
}
