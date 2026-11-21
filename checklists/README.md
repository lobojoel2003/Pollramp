# Pollramp checklists

Open, versioned polling place accessibility checklists: a federal base built on the 2010 ADA
Standards and the structure of the U.S. Department of Justice ADA Checklist for Polling Places,
plus state overlays. Everything in this directory is dedicated to the public domain under
[CC0 1.0](LICENSE): copy it into your own tools, forms or spreadsheets.

| File                        | What it is                                                         | Items                                               |
| --------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| `base/doj-base/1.0.0.json`  | Federal base (2010 ADA Standards; DOJ checklist structure)         | 80 items, 8 sections, 23 kit items                  |
| `overlays/us-ca/1.0.0.json` | California (CBC Chapter 11B)                                       | 5 items added, 5 patched, 2 kit items               |
| `overlays/us-fl/1.0.0.json` | Florida (s. 553.5041, F.S.; Florida Building Code – Accessibility) | 3 items added, 3 patched, 1 kit item                |
| `overlays/us-va/1.0.0.json` | Virginia (curbside voting, Va. Code § 24.2-649)                    | 1 section with 4 items added, 2 patched, 1 kit item |
| `schema/*.schema.json`      | JSON Schemas (draft 2020-12) for both document kinds               |                                                     |

> **Review before you rely on it.** Every rule cites its source. The state overlays capture the
> provisions of state statutes and building codes that differ from the federal standards. Before an
> office relies on an overlay, it should compare it with the current edition of its state's checklist
> form. Please report anything that is out of date.

## Concepts

**Sections** follow the route a voter takes: parking → drop-off → route → curb ramps → ramps →
entrance → interior → voting area. A section can have a **gate**: a yes/no first item (“Is there a
ramp on the route?”). If the answer is no, the rest of the section is skipped.

**Items** ask one measurable question:

```jsonc
{
	"id": "entrance.threshold", // <section>.<name>, unique and stable forever
	"type": "measure", // measure | count | yesno | choice | text
	"unit": "in", // in | ft | percent | lbf | seconds | count
	"prompt": "How high is the threshold at the entrance door?",
	"help": "Measure from the floor … Enter 0 if there is none.",
	"diagram": "threshold", // id from src/lib/diagrams
	"pass": { "op": "<=", "value": 0.5 },
	"fix": {
		"kind": "kit", // kit | procedure | structural
		"summary": "Place a threshold ramp matched to the measured height …",
		"kit": [{ "sizing": "rampForRise" }, { "item": "sign-accessible-entrance", "qty": 1 }],
		"structuralIf": { "op": ">", "value": 30, "summary": "…use another entrance." }
	},
	"public": {
		"label": "Entrance threshold",
		"pass": "No raised threshold at the entrance.",
		"fixed": "A threshold ramp will be in place at the entrance on election day."
	},
	"references": ["2010 ADA Standards §404.2.5", "2010 ADA Standards §303"]
}
```

### Pass rules

| Rule     | Example                                                                       | For            |
| -------- | ----------------------------------------------------------------------------- | -------------- |
| Compare  | `{ "op": ">=", "value": 32 }`                                                 | measure, count |
| Range    | `{ "op": "between", "min": 34, "max": 48 }`                                   | measure        |
| Computed | `{ "op": ">=", "fn": "ada208.accessible", "args": ["parking.total-spaces"] }` | count          |
| Boolean  | `{ "op": "equals", "value": true }`                                           | yesno          |
| Options  | `{ "op": "in", "values": ["lever", "push-pull"] }`                            | choice         |

Computed thresholds: `ada208.accessible` (ADA Table 208.2, required accessible spaces for a lot size)
and `ada208.van` (one van-accessible space per six accessible spaces, §208.2.4).

Items without a `pass` rule are informational (gates, counts used by other items).

### Conditions

`"when": [{ "item": "parking.van-spaces", "op": ">", "value": 0 }]` shows an item only when every
condition holds. Operators: `>=`, `<=`, `>`, `<`, `==`, `equals`, `not-equals`, `answered`.
Conditions may only refer to **earlier** items.

### Fixes and the kit

- `kit`: bring equipment. Each kit entry names a catalog `item` and a `qty`, or uses
  `"per": "shortfall"` with a `multiplier` (four cones per missing accessible space), or
  `"sizing": "rampForRise"` to pick a threshold ramp (≤ 2 in) or a 1:12 portable ramp from the
  measured rise, optionally read `from` another item.
- `procedure`: a poll-worker action (prop and monitor a door, rearrange booths).
- `structural`: cannot be fixed on election day. `structuralIf` escalates a kit or procedure fix
  when a measurement is out of temporary-fix range.

A site is **accessible** when everything passes, **fixable** when every failure has a kit or
procedure fix, and has **barriers** when any failure is structural.

### Voter text

`public.label` plus `pass`, `fixed` (failed but fixed on election day) and `fail` (a barrier
remains). `{value}` is replaced with the formatted answer. Only items with `public` text appear
on voter pages.

## Overlays

An overlay `extends` a base by id and semver range and may:

- `items.patch`: replace fields of existing items (`pass`, `help`, `fix`, …). `addReferences`
  appends citations instead of replacing them.
- `items.add`: insert new items into a section, `after` a given item.
- `items.remove`: drop items that don't apply in the jurisdiction.
- `sections.add` / `sections.patch`: add whole sections (Virginia's curbside voting) or retitle one.
- `kit`: add catalog items (for example California's detectable-warning mat).

New item ids should use the overlay's prefix in the name (`parking.ca-space-length`) so they never
collide with future base items.

## Versioning rules

1. A file's path is its contract: `<kind>/<id>/<version>.json`, and the `id` and `version` fields
   must match.
2. **Never edit a released version.** Surveys store the exact checklist key
   (`doj-base@1.0.0+us-va@1.0.0`) and are re-evaluated against it. Copy the file to a new version
   instead:
   - patch (`1.0.1`): wording, help text, citations, diagrams;
   - minor (`1.1.0`): new items or new fixes;
   - major (`2.0.0`): changed thresholds or removed items.
3. Overlays declare which base versions they support (`"version": "^1.0.0"`).
4. Run `pnpm checklists:validate`. It checks the JSON Schema, item references, gates, kit ids,
   threshold types and overlay resolution. The unit tests also check that every diagram exists.

## Adding a state

1. Copy `overlays/us-va/1.0.0.json` to `overlays/us-<state>/1.0.0.json` and set `id`,
   `jurisdiction` (`US-TX`), `title`, `description` and `sources`.
2. Add only what differs from the federal base, with a citation on every rule.
3. Run `pnpm checklists:validate && pnpm test:unit`, then open a pull request. New sites in that
   state pick up the overlay automatically.
