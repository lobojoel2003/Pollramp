import { json } from '@sveltejs/kit';
import { publishedSites } from '#lib/server/repo.ts';
import { STATUS } from '#lib/checklist/status.ts';
import type { RequestHandler } from './$types';

/** Open data: published polling places and their accessibility status as GeoJSON. */
export const GET: RequestHandler = async ({ url }) => {
	const sites = await publishedSites();
	return json(
		{
			type: 'FeatureCollection',
			features: sites
				.filter((s) => s.lat !== null && s.lng !== null)
				.map((s) => ({
					type: 'Feature',
					id: s.id,
					geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
					properties: {
						name: s.name,
						address: s.address,
						city: s.city,
						state: s.state,
						postalCode: s.postalCode,
						precincts: s.precincts,
						status: s.status,
						statusLabel: STATUS[s.status].label,
						page: `${url.origin}/p/${s.slug}`
					}
				}))
		},
		{
			headers: {
				'Content-Type': 'application/geo+json',
				'Cache-Control': 'public, max-age=300',
				'Access-Control-Allow-Origin': '*'
			}
		}
	);
};
