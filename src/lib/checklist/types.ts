/**
 * Pollramp checklist format.
 *
 * A checklist is a versioned JSON document (CC0) describing what a surveyor measures at a
 * polling place, in the order they walk the route. A *base* checklist (the federal DOJ / 2010
 * ADA Standards checklist) can be extended by a jurisdiction *overlay* that patches thresholds,
 * adds items, or removes items. See `checklists/README.md` for the authoring guide and
 * `checklists/schema/*.schema.json` for the machine-readable schema.
 */

export type Unit = 'in' | 'ft' | 'percent' | 'lbf' | 'seconds' | 'count';

export type CompareOp = '>=' | '<=' | '>' | '<' | '==';

/** Named threshold functions, evaluated from other answers (e.g. ADA Table 208.2). */
export type ThresholdFn = 'ada208.accessible' | 'ada208.van';

/** Named sizing functions that pick a kit item size from a measured value. */
/** `rampForRise`: threshold ramp up to a 2-inch rise, portable ramp (1:12) above that. */
export type SizingFn = 'rampForRise';

export type PassRule =
	| { op: CompareOp; value: number }
	| { op: 'between'; min: number; max: number }
	| { op: '>=' | '<='; fn: ThresholdFn; args: string[] }
	| { op: 'equals'; value: boolean | string }
	| { op: 'in'; values: string[] };

export interface Condition {
	/** Item id whose answer is tested. */
	item: string;
	op: CompareOp | 'equals' | 'not-equals' | 'answered';
	value?: number | boolean | string;
}

export interface KitRef {
	/** Kit catalog id. Optional when `sizing` picks the item. */
	item?: string;
	/** Fixed quantity (default 1). */
	qty?: number;
	/** Derive quantity from the gap between the threshold and the answer. */
	per?: 'shortfall';
	/** Multiplied with the derived quantity, e.g. 4 cones per missing space. */
	multiplier?: number;
	/** Pick the item and size from a measured value. */
	sizing?: SizingFn;
	/** Item id to read the measured value from (defaults to the failing item). */
	from?: string;
	/** Free-text note shown next to the kit line. */
	note?: string;
}

/**
 * How a failed item can be handled on election day.
 * - `kit`: bring equipment (portable ramp, cones, signs…)
 * - `procedure`: a poll-worker action (prop and monitor a door, rearrange tables…)
 * - `structural`: cannot be fixed on election day; needs a permanent change or another site
 */
export type FixKind = 'kit' | 'procedure' | 'structural';

export interface Fix {
	kind: FixKind;
	summary: string;
	steps?: string[];
	kit?: KitRef[];
	/** Escalates to `structural` when the measured value crosses this limit. */
	structuralIf?: { op: CompareOp; value: number; summary: string };
}

export interface PublicText {
	/** Short label for the voter-facing page, e.g. "Entrance door". */
	label: string;
	/** Text when the item passes. `{value}` and `{unit}` are interpolated. */
	pass?: string;
	/** Text when the item fails but an election-day fix is planned. */
	fixed?: string;
	/** Text when a barrier remains. */
	fail?: string;
}

export type ItemType = 'measure' | 'count' | 'yesno' | 'choice' | 'text';

export interface ChoiceOption {
	value: string;
	label: string;
	pass?: boolean;
}

export interface Item {
	id: string;
	type: ItemType;
	/** The single measurable question shown on the screen. */
	prompt: string;
	/** How to measure / what to look for. */
	help?: string;
	/** Diagram id (see `src/lib/diagrams`). */
	diagram?: string;
	unit?: Unit;
	/** Offer a rise/run calculator for slope items. */
	slope?: boolean;
	options?: ChoiceOption[];
	pass?: PassRule;
	/** Show this item only when all conditions hold. */
	when?: Condition[];
	fix?: Fix;
	public?: PublicText;
	references?: string[];
	/** Set by the resolver: `<checklist-id>@<version>` of the document that last defined it. */
	origin?: string;
}

export interface Section {
	id: string;
	title: string;
	/** One-line orientation shown at the top of the section. */
	summary: string;
	/** Optional yes/no item id: when answered "no", the rest of the section does not apply. */
	gate?: string;
	items: Item[];
	origin?: string;
}

export interface KitItemDef {
	id: string;
	name: string;
	description?: string;
	/** Available sizes for sized items, in display form ("2-inch", "6-foot"). */
	sizes?: string[];
	origin?: string;
}

export interface Source {
	title: string;
	publisher?: string;
	url?: string;
	date?: string;
	note?: string;
}

export interface BaseChecklist {
	$schema?: string;
	kind: 'base';
	id: string;
	version: string;
	title: string;
	jurisdiction: string;
	description: string;
	license: 'CC0-1.0';
	sources: Source[];
	kit: KitItemDef[];
	sections: Section[];
}

export type ItemPatch = Partial<Omit<Item, 'id' | 'origin'>> & {
	/** References appended to the existing list. */
	addReferences?: string[];
};

export interface Overlay {
	$schema?: string;
	kind: 'overlay';
	id: string;
	version: string;
	title: string;
	jurisdiction: string;
	description: string;
	license: 'CC0-1.0';
	extends: { id: string; version: string };
	sources: Source[];
	kit?: KitItemDef[];
	sections?: {
		add?: { after?: string; section: Section }[];
		patch?: Record<string, Partial<Pick<Section, 'title' | 'summary'>>>;
	};
	items?: {
		patch?: Record<string, ItemPatch>;
		add?: { section: string; after?: string; item: Item }[];
		remove?: string[];
	};
}

export type ChecklistDocument = BaseChecklist | Overlay;

/** A base checklist with an optional overlay applied. */
export interface ResolvedChecklist {
	/** `doj-base@1.0.0` or `doj-base@1.0.0+us-ca@1.0.0` */
	key: string;
	base: { id: string; version: string };
	overlay?: { id: string; version: string };
	title: string;
	jurisdiction: string;
	sources: Source[];
	kit: KitItemDef[];
	sections: Section[];
}

/* ---------------------------------------------------------------- answers & results */

export type AnswerValue = number | boolean | string | null;

export interface Answer {
	value: AnswerValue;
	/** Marked "does not apply" by the surveyor. */
	na?: boolean;
	note?: string;
	/** Photo ids attached to this item. */
	photos?: string[];
	/** Raw text as typed (e.g. `32 1/2`) for display. */
	raw?: string;
	answeredAt?: string;
}

export type Responses = Record<string, Answer>;

export type Outcome = 'pass' | 'fail' | 'na' | 'skipped' | 'unanswered' | 'info';

export interface KitLine {
	item: string;
	name: string;
	size?: string;
	qty: number;
	/** Items that require this kit line. */
	for: string[];
	note?: string;
}

export interface ItemResult {
	id: string;
	section: string;
	outcome: Outcome;
	/** Threshold used, when computed from other answers. */
	threshold?: number;
	fix?: {
		kind: FixKind;
		summary: string;
		steps?: string[];
		kit: KitLine[];
	};
}

/**
 * Site accessibility status, derived from the latest submitted survey.
 * - `accessible`: every applicable item passed
 * - `fixable`: failures exist, but all can be handled on election day (kit or procedure)
 * - `barriers`: at least one failure cannot be fixed on election day
 * - `incomplete`: required items are unanswered
 */
export type SurveyStatus = 'accessible' | 'fixable' | 'barriers' | 'incomplete';

export type SiteStatus = SurveyStatus | 'unsurveyed';

export interface SectionResult {
	id: string;
	title: string;
	status: SurveyStatus | 'na';
	pass: number;
	fail: number;
	unanswered: number;
}

export interface SurveyResult {
	checklist: string;
	status: SurveyStatus;
	counts: { pass: number; fail: number; na: number; unanswered: number; total: number };
	sections: SectionResult[];
	items: ItemResult[];
	kit: KitLine[];
}
