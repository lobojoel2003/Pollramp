import type { StyleSpecification } from 'maplibre-gl';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countiesUrl from 'us-atlas/counties-10m.json?url';

/**
 * A basemap that needs no tile server: U.S. state and county boundaries from us-atlas
 * (bundled with the app and precached by the service worker). Used when the configured
 * tile style can't be reached, so the site map still works in the field.
 */
export async function offlineStyle(dark = false): Promise<StyleSpecification> {
	const topo = (await (await fetch(countiesUrl)).json()) as Topology<{
		counties: GeometryCollection;
		states: GeometryCollection;
		nation: GeometryCollection;
	}>;
	const counties = feature(topo, topo.objects.counties);
	const states = feature(topo, topo.objects.states);
	const c = dark
		? { water: '#0d1b22', land: '#1b252d', county: '#33424d', state: '#5d707e' }
		: { water: '#d5e6ea', land: '#f7f5ef', county: '#d2cab7', state: '#968c76' };
	return {
		version: 8,
		name: 'Pollramp offline',
		sources: {
			counties: { type: 'geojson', data: counties },
			states: { type: 'geojson', data: states }
		},
		layers: [
			{ id: 'water', type: 'background', paint: { 'background-color': c.water } },
			{ id: 'land', type: 'fill', source: 'states', paint: { 'fill-color': c.land } },
			{
				id: 'county-lines',
				type: 'line',
				source: 'counties',
				paint: {
					'line-color': c.county,
					'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.3, 9, 1.2, 12, 2]
				}
			},
			{
				id: 'state-lines',
				type: 'line',
				source: 'states',
				paint: {
					'line-color': c.state,
					'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 10, 2.5]
				}
			}
		]
	};
}

/** Use the configured style when it answers quickly; otherwise fall back to the offline basemap. */
export async function chooseStyle(
	url: string | undefined,
	dark: boolean
): Promise<string | StyleSpecification> {
	if (!url || url === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine))
		return offlineStyle(dark);
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 4000);
		const response = await fetch(url, { signal: controller.signal, mode: 'cors' });
		clearTimeout(timer);
		if (!response.ok) throw new Error(String(response.status));
		return (await response.json()) as StyleSpecification;
	} catch {
		return offlineStyle(dark);
	}
}
