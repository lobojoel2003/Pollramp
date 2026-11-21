import { error } from '@sveltejs/kit';
import { getPhoto, publishedSiteBySlug } from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

/** The one photo an office chose to publish (usually the accessible entrance). */
export const GET: RequestHandler = async ({ params }) => {
	const found = await publishedSiteBySlug(params.slug);
	if (!found?.site.publicPhotoId) error(404, 'No photo published.');
	const photo = await getPhoto(found.site.publicPhotoId);
	if (!photo) error(404, 'No photo published.');
	return new Response(new Uint8Array(photo.data), {
		headers: { 'Content-Type': photo.mime, 'Cache-Control': 'public, max-age=3600' }
	});
};
