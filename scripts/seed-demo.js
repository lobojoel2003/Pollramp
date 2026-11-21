#!/usr/bin/env node
// Loads fictional demo polling places and surveys into a running Pollramp server through
// its public API, so the server evaluates every survey exactly as it would in production.
//
//   POLLRAMP_URL=http://localhost:3000 \
//   POLLRAMP_EMAIL=admin@example.org POLLRAMP_PASSWORD='…' node scripts/seed-demo.js
//
// If the server has no users yet, the first administrator is created with those credentials.
// All names and addresses are invented; coordinates are spread around Richmond, Virginia.

const BASE = (process.env.POLLRAMP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.POLLRAMP_EMAIL ?? 'admin@example.org';
const PASSWORD = process.env.POLLRAMP_PASSWORD ?? 'pollramp-demo-password';

import { CHECKLIST, compliant, responsesFor, SITES } from './demo-data.js';

let cookie = '';

async function call(method, path, body) {
	const response = await fetch(`${BASE}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			Origin: BASE,
			...(cookie ? { Cookie: cookie } : {})
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const setCookie = response.headers.get('set-cookie');
	if (setCookie) cookie = setCookie.split(';')[0];
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${data.message ?? ''}`);
	return data;
}

async function signIn() {
	const me = await fetch(`${BASE}/api/auth/me`).then((r) => r.json());
	if (me.needsSetup) {
		await call('POST', '/api/auth/setup', {
			name: 'Demo Administrator',
			email: EMAIL,
			password: PASSWORD
		});
		console.log(`created administrator ${EMAIL}`);
	} else {
		await call('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
	}
}

function daysAgo(days) {
	return new Date(Date.now() - days * 86_400_000).toISOString();
}

await signIn();
let created = 0;
for (const [index, site] of SITES.entries()) {
	const id = crypto.randomUUID();
	await call('PUT', `/api/sites/${id}`, {
		id,
		name: site.name,
		address: site.address,
		city: 'Richmond',
		state: 'VA',
		postalCode: '232' + String(20 + index).padStart(2, '0'),
		lat: site.at[0],
		lng: site.at[1],
		precincts: site.precincts,
		notes: '',
		published: false,
		voterInfo: { accessibleEntrance: '', parking: '', contact: '', notes: '', ...site.voter },
		publicPhotoId: null,
		updatedAt: daysAgo(30)
	});
	if (!site.unsurveyed) {
		const surveyId = crypto.randomUUID();
		const responses = site.draft
			? Object.fromEntries(Object.entries(compliant()).slice(0, 12))
			: responsesFor(site);
		const startedAt = daysAgo(20 - index);
		await call('PUT', `/api/surveys/${surveyId}`, {
			id: surveyId,
			siteId: id,
			checklist: CHECKLIST,
			state: site.draft ? 'draft' : 'submitted',
			surveyor: ['Maria Lopez', 'Dev Patel', 'Sam Okafor'][index % 3],
			election: '2026 General Election',
			responses,
			startedAt,
			submittedAt: site.draft ? null : daysAgo(19 - index),
			updatedAt: daysAgo(19 - index)
		});
	}
	if (site.published) {
		await call('PUT', `/api/sites/${id}`, {
			id,
			name: site.name,
			address: site.address,
			city: 'Richmond',
			state: 'VA',
			postalCode: '232' + String(20 + index).padStart(2, '0'),
			lat: site.at[0],
			lng: site.at[1],
			precincts: site.precincts,
			notes: '',
			published: true,
			voterInfo: { accessibleEntrance: '', parking: '', contact: '', notes: '', ...site.voter },
			publicPhotoId: null,
			updatedAt: daysAgo(1)
		});
	}
	created++;
	console.log(`✓ ${site.name}`);
}
console.log(`\nSeeded ${created} demo sites into ${BASE}.`);
