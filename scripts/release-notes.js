#!/usr/bin/env node
// Prints the CHANGELOG.md section for a version, used as the GitHub release body.
//
//   node scripts/release-notes.js 1.0.0 > notes.md
import { readFileSync } from 'node:fs';

const version = (process.argv[2] ?? process.env.npm_package_version ?? '').replace(/^v/, '');
if (!version) {
	console.error('Usage: release-notes.js <version>');
	process.exit(2);
}
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const lines = changelog.split('\n');
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (start < 0) {
	console.error(`CHANGELOG.md has no "## [${version}]" section.`);
	process.exit(1);
}
const end = lines.findIndex((l, i) => i > start && l.startsWith('## ['));
const body = lines
	.slice(start + 1, end < 0 ? undefined : end)
	.filter((l) => !/^\[[^\]]+\]:\s/.test(l))
	.join('\n')
	.trim();
console.log(body);
