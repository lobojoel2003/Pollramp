import { error, json } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { readJson } from '#lib/server/http.ts';
import { deleteSurvey, getSurvey, parse, surveyInput, upsertSurvey } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const survey = await getSurvey(event.params.id);
	if (!survey) error(404, 'Survey not found.');
	return json({ survey });
};

export const PUT: RequestHandler = async (event) => {
	const user = requireUser(event, 'surveyor');
	const input = parse(surveyInput, await readJson(event.request));
	if (input.id !== event.params.id) error(400, 'The id in the body must match the URL.');
	const { survey, stale } = await upsertSurvey(input, user);
	return json({ survey, stale });
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireUser(event, 'surveyor');
	await deleteSurvey(event.params.id, user);
	return json({ ok: true });
};
