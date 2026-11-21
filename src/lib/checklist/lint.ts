import { ChecklistError, docKey, resolveChecklist } from './resolve.ts';
import type { BaseChecklist, Item, Overlay, ResolvedChecklist } from './types.ts';

/**
 * Semantic checks that JSON Schema cannot express: references between items, gates,
 * kit ids, thresholds that match item types, and diagram ids. Returns readable errors.
 */
export function lintResolved(checklist: ResolvedChecklist, knownDiagrams?: Set<string>): string[] {
	const errors: string[] = [];
	const at = (id: string, message: string) => errors.push(`${checklist.key} ${id}: ${message}`);
	const kitIds = new Set(checklist.kit.map((k) => k.id));
	const seen = new Set<string>();
	const sectionIds = new Set<string>();

	for (const kit of checklist.kit) {
		if (checklist.kit.filter((k) => k.id === kit.id).length > 1) at(kit.id, 'duplicate kit id');
	}

	for (const section of checklist.sections) {
		if (sectionIds.has(section.id)) at(section.id, 'duplicate section id');
		sectionIds.add(section.id);

		if (section.gate) {
			const gate = section.items[0];
			if (!gate || gate.id !== section.gate)
				at(section.id, `gate "${section.gate}" must be the first item`);
			else if (gate.type !== 'yesno')
				at(section.id, `gate "${section.gate}" must be a yes/no item`);
		}

		for (const item of section.items) {
			if (seen.has(item.id)) at(item.id, 'duplicate item id');
			if (!item.id.startsWith(`${section.id}.`)) at(item.id, `id must start with "${section.id}."`);
			lintItem(item, seen, kitIds, at, knownDiagrams);
			seen.add(item.id);
		}
	}
	const allIds = new Set(checklist.sections.flatMap((s) => s.items.map((i) => i.id)));
	for (const section of checklist.sections) {
		for (const item of section.items) {
			for (const ref of item.fix?.kit ?? []) {
				if (ref.from && !allIds.has(ref.from))
					at(item.id, `kit sizing reads from unknown item "${ref.from}"`);
			}
		}
	}
	return errors;
}

function lintItem(
	item: Item,
	earlier: Set<string>,
	kitIds: Set<string>,
	at: (id: string, message: string) => void,
	knownDiagrams?: Set<string>
) {
	for (const c of item.when ?? []) {
		if (!earlier.has(c.item))
			at(item.id, `condition refers to "${c.item}", which is not an earlier item`);
		if (c.op !== 'answered' && c.value === undefined)
			at(item.id, `condition on "${c.item}" needs a value`);
	}

	if ((item.type === 'measure' || item.type === 'count') && !item.unit)
		at(item.id, 'measure and count items need a unit');
	if (item.slope && item.unit !== 'percent') at(item.id, 'slope items must use the percent unit');
	if (item.type === 'choice' && !item.options?.length) at(item.id, 'choice items need options');

	const rule = item.pass;
	if (rule) {
		if (!item.fix) at(item.id, 'has a pass rule but no fix');
		if (rule.op === 'equals' && item.type === 'yesno' && typeof rule.value !== 'boolean')
			at(item.id, 'yes/no items must compare to true or false');
		if (rule.op === 'in') {
			if (item.type !== 'choice') at(item.id, '"in" rules are only for choice items');
			const values = new Set(item.options?.map((o) => o.value));
			for (const v of rule.values)
				if (!values.has(v)) at(item.id, `pass value "${v}" is not an option`);
			for (const o of item.options ?? []) {
				if (o.pass !== undefined && o.pass !== rule.values.includes(o.value))
					at(item.id, `option "${o.value}" pass flag disagrees with the pass rule`);
			}
		}
		if (
			(rule.op === 'between' ||
				'fn' in rule ||
				typeof (rule as { value?: unknown }).value === 'number') &&
			item.type !== 'measure' &&
			item.type !== 'count'
		)
			at(item.id, 'numeric rules are only for measure and count items');
		if (rule.op === 'between' && rule.min > rule.max) at(item.id, 'between rule has min > max');
		if ('fn' in rule) {
			for (const arg of rule.args)
				if (!earlier.has(arg)) at(item.id, `threshold argument "${arg}" is not an earlier item`);
		}
	} else if (item.fix) {
		at(item.id, 'has a fix but no pass rule');
	}

	for (const ref of item.fix?.kit ?? []) {
		if (ref.item && !kitIds.has(ref.item))
			at(item.id, `kit item "${ref.item}" is not in the kit catalog`);
		if (ref.per === 'shortfall' && !(rule && 'fn' in rule) && !(rule && 'value' in rule))
			at(item.id, 'shortfall quantities need a numeric threshold');
	}
	if (item.fix?.structuralIf && item.type !== 'measure')
		at(item.id, 'structuralIf needs a measure item');

	if (knownDiagrams && item.diagram && !knownDiagrams.has(item.diagram))
		at(item.id, `unknown diagram "${item.diagram}"`);
}

/** Lint a base checklist and every overlay that extends it. */
export function lintChecklists(
	bases: BaseChecklist[],
	overlays: Overlay[],
	knownDiagrams?: Set<string>
): string[] {
	const errors: string[] = [];
	for (const base of bases) errors.push(...lintResolved(resolveChecklist(base), knownDiagrams));

	for (const overlay of overlays) {
		const candidates = bases.filter((b) => b.id === overlay.extends.id);
		if (candidates.length === 0) {
			errors.push(`${docKey(overlay)}: no base checklist "${overlay.extends.id}"`);
			continue;
		}
		let matched = false;
		for (const base of candidates) {
			try {
				const resolved = resolveChecklist(base, overlay);
				matched = true;
				errors.push(...lintResolved(resolved, knownDiagrams));
				// Every item an overlay adds must reference only kit ids the resolved catalog has.
				for (const add of overlay.items?.add ?? []) {
					if (!resolved.sections.some((s) => s.items.some((i) => i.id === add.item.id)))
						errors.push(`${resolved.key}: added item "${add.item.id}" missing after resolution`);
				}
			} catch (error) {
				if (error instanceof ChecklistError && /needs/.test(error.message)) continue;
				errors.push(error instanceof Error ? error.message : String(error));
				matched = true;
			}
		}
		if (!matched)
			errors.push(
				`${docKey(overlay)}: no compatible "${overlay.extends.id}" version for ${overlay.extends.version}`
			);
	}
	return errors;
}
