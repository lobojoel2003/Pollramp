import { error, json } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { readJson } from '#lib/server/http.ts';
import { deleteSite, getSite, parse, siteInput, upsertSite } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const site = await getSite(event.params.id);
	if (!site) error(404, 'Site not found.');
	return json({ site });
};

export const PUT: RequestHandler = async (event) => {
	const user = requireUser(event, 'surveyor');
	const input = parse(siteInput, await readJson(event.request));
	if (input.id !== event.params.id) error(400, 'The id in the body must match the URL.');
	const { site, stale } = await upsertSite(input, user);
	return json({ site, stale });
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireUser(event, 'admin');
	await deleteSite(event.params.id, user);
	return json({ ok: true });
};
