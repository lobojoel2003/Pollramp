import { publishedSites } from '#lib/server/repo.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const needle = q.toLowerCase();
	const sites = (await publishedSites())
		.filter(
			(s) =>
				!needle ||
				[s.name, s.address, s.city, s.postalCode, ...s.precincts].some((v) =>
					v.toLowerCase().includes(needle)
				)
		)
		.map((s) => ({
			slug: s.slug,
			name: s.name,
			address: s.address,
			city: s.city,
			state: s.state,
			postalCode: s.postalCode,
			precincts: s.precincts,
			status: s.status
		}));
	return { q, sites };
};
