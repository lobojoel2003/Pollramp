import { compareVersions, docKey, parseChecklistKey, resolveChecklist } from './resolve.ts';
import type { BaseChecklist, Overlay, ResolvedChecklist } from './types.ts';

/**
 * Every published checklist version is bundled into the app so surveys work offline and
 * old surveys keep evaluating against the exact version they were taken with.
 */
const baseModules = import.meta.glob<BaseChecklist>('/checklists/base/*/*.json', {
	eager: true,
	import: 'default'
});
const overlayModules = import.meta.glob<Overlay>('/checklists/overlays/*/*.json', {
	eager: true,
	import: 'default'
});

export const bases: BaseChecklist[] = Object.values(baseModules).sort(
	(a, b) => a.id.localeCompare(b.id) || compareVersions(b.version, a.version)
);
export const overlays: Overlay[] = Object.values(overlayModules).sort(
	(a, b) => a.id.localeCompare(b.id) || compareVersions(b.version, a.version)
);

export const DEFAULT_BASE_ID = 'doj-base';

function latest<T extends { id: string; version: string }>(docs: T[], id: string): T | undefined {
	return docs.filter((d) => d.id === id).sort((a, b) => compareVersions(b.version, a.version))[0];
}

export function latestBase(id = DEFAULT_BASE_ID): BaseChecklist {
	const base = latest(bases, id);
	if (!base) throw new Error(`No base checklist "${id}"`);
	return base;
}

/** Latest overlay for a two-letter state code, if one exists (e.g. "CA" → us-ca). */
export function overlayForState(state: string | null | undefined): Overlay | undefined {
	if (!state) return undefined;
	return latest(overlays, `us-${state.toLowerCase()}`);
}

/** Overlays offered in the "start survey" picker: latest version of each. */
export function availableOverlays(): Overlay[] {
	const ids = [...new Set(overlays.map((o) => o.id))];
	return ids.map((id) => latest(overlays, id)!).sort((a, b) => a.title.localeCompare(b.title));
}

/** The checklist key a new survey at a site in `state` should use. */
export function defaultChecklistKey(state?: string | null): string {
	const base = latestBase();
	const overlay = overlayForState(state);
	return overlay ? `${docKey(base)}+${docKey(overlay)}` : docKey(base);
}

const cache = new Map<string, ResolvedChecklist>();

/** Resolve a checklist by key (`doj-base@1.0.0+us-ca@1.0.0`). Throws for unknown versions. */
export function getChecklist(key: string): ResolvedChecklist {
	const cached = cache.get(key);
	if (cached) return cached;
	const parsed = parseChecklistKey(key);
	const base = bases.find((b) => b.id === parsed.base.id && b.version === parsed.base.version);
	if (!base) throw new Error(`Unknown checklist ${docKey(parsed.base)}`);
	let overlay: Overlay | undefined;
	if (parsed.overlay) {
		overlay = overlays.find(
			(o) => o.id === parsed.overlay!.id && o.version === parsed.overlay!.version
		);
		if (!overlay) throw new Error(`Unknown overlay ${docKey(parsed.overlay)}`);
	}
	const resolved = resolveChecklist(base, overlay);
	cache.set(key, resolved);
	return resolved;
}

export function tryGetChecklist(key: string): ResolvedChecklist | undefined {
	try {
		return getChecklist(key);
	} catch {
		return undefined;
	}
}
