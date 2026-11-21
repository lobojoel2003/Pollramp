import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '#lib/server/auth.ts';
import { config } from '#lib/server/config.ts';
import { getPhoto, PHOTO_TYPES, savePhoto } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const photo = await getPhoto(event.params.id);
	if (!photo) error(404, 'Photo not found.');
	return new Response(new Uint8Array(photo.data), {
		headers: {
			'Content-Type': photo.mime,
			// Photo ids are immutable; the service worker and browser may cache them for good.
			'Cache-Control': 'private, max-age=31536000, immutable'
		}
	});
};

const meta = z.object({
	id: z.uuid(),
	surveyId: z.uuid(),
	itemId: z.string().min(1).max(120),
	width: z.coerce.number().int().positive().max(20000).nullable(),
	height: z.coerce.number().int().positive().max(20000).nullable()
});

/** Upload a photo as the raw request body. Metadata travels in `X-Pollramp-*` headers. */
export const PUT: RequestHandler = async (event) => {
	requireUser(event, 'surveyor');
	const { request } = event;
	const mime = (request.headers.get('content-type') ?? '').split(';')[0].trim();
	if (!PHOTO_TYPES.has(mime)) error(415, 'Photos must be JPEG, PNG or WebP.');
	const parsed = meta.safeParse({
		id: event.params.id,
		surveyId: request.headers.get('x-pollramp-survey'),
		itemId: request.headers.get('x-pollramp-item'),
		width: request.headers.get('x-pollramp-width') || null,
		height: request.headers.get('x-pollramp-height') || null
	});
	if (!parsed.success) error(400, 'Missing or invalid photo metadata headers.');
	const data = new Uint8Array(await request.arrayBuffer());
	if (data.byteLength === 0) error(400, 'The photo is empty.');
	if (data.byteLength > config.maxPhotoBytes) error(413, 'The photo is too large.');
	const photo = await savePhoto({ ...parsed.data, mime, data });
	return json({ photo });
};
