#!/usr/bin/env node
// Validates every checklist JSON file against the JSON Schema, then runs the semantic
// linter (item references, gates, kit ids, overlay resolution) shared with the app.
//
//   node scripts/validate-checklists.js
//
// Exits non-zero on the first problem set so CI fails loudly.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { lintChecklists } from '../src/lib/checklist/lint.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'checklists');

function walk(path) {
	return readdirSync(path).flatMap((name) => {
		const full = join(path, name);
		return statSync(full).isDirectory() ? walk(full) : full.endsWith('.json') ? [full] : [];
	});
}

const ajv = new Ajv2020({
	allErrors: true,
	strict: true,
	allowUnionTypes: true,
	strictRequired: false
});
addFormats(ajv);
const checklistSchema = JSON.parse(readFileSync(join(dir, 'schema/checklist.schema.json'), 'utf8'));
const overlaySchema = JSON.parse(readFileSync(join(dir, 'schema/overlay.schema.json'), 'utf8'));
ajv.addSchema(checklistSchema, 'checklist.schema.json');
ajv.addSchema(overlaySchema, 'overlay.schema.json');

const errors = [];
const bases = [];
const overlays = [];

for (const file of [...walk(join(dir, 'base')), ...walk(join(dir, 'overlays'))]) {
	const rel = relative(root, file);
	let doc;
	try {
		doc = JSON.parse(readFileSync(file, 'utf8'));
	} catch (error) {
		errors.push(`${rel}: invalid JSON (${error.message})`);
		continue;
	}
	const schemaId = doc.kind === 'overlay' ? 'overlay.schema.json' : 'checklist.schema.json';
	const validate = ajv.getSchema(schemaId);
	if (!validate(doc)) {
		for (const e of validate.errors ?? []) errors.push(`${rel}${e.instancePath}: ${e.message}`);
		continue;
	}
	// The file path is the version contract: checklists/<kind>/<id>/<version>.json
	const expected = `${doc.id}/${doc.version}.json`;
	if (!rel.replaceAll('\\', '/').endsWith(expected)) {
		errors.push(`${rel}: path must end with ${expected}`);
	}
	(doc.kind === 'overlay' ? overlays : bases).push(doc);
}

errors.push(...lintChecklists(bases, overlays));

if (errors.length > 0) {
	console.error(`✕ ${errors.length} checklist problem${errors.length === 1 ? '' : 's'}:\n`);
	for (const e of errors) console.error(`  • ${e}`);
	process.exit(1);
}

const itemCount = (doc) =>
	doc.kind === 'base'
		? doc.sections.reduce((n, s) => n + s.items.length, 0)
		: (doc.items?.add?.length ?? 0) +
			(doc.sections?.add ?? []).reduce((n, a) => n + a.section.items.length, 0);
for (const doc of [...bases, ...overlays]) {
	console.log(
		`✓ ${doc.id}@${doc.version} (${doc.kind}, ${itemCount(doc)} ${doc.kind === 'base' ? 'items' : 'items added'})`
	);
}
console.log(`\nAll ${bases.length + overlays.length} checklist documents are valid.`);
