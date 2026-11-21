<script lang="ts" module>
	export interface MapSite {
		id: string;
		name: string;
		lat: number | null;
		lng: number | null;
		status: import('../checklist/types.ts').SiteStatus;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { Map as MapLibre, Marker } from 'maplibre-gl';
	import { STATUS } from '../checklist/status.ts';
	import { app } from '../client/store.svelte.ts';
	import { chooseStyle } from '../client/basemap.ts';

	interface Props {
		sites: MapSite[];
		selected?: string | null;
		onselect?: (id: string) => void;
		/** Pick-a-location mode for the site form. */
		pick?: { lat: number | null; lng: number | null } | null;
		onpick?: (lat: number, lng: number) => void;
		height?: string;
		label?: string;
	}

	let {
		sites,
		selected = null,
		onselect,
		pick = null,
		onpick,
		height = '420px',
		label = 'Map of polling places'
	}: Props = $props();

	let container: HTMLDivElement;
	let map = $state<MapLibre | null>(null);
	let offline = $state(false);
	let failed = $state(false);
	let lib: typeof import('maplibre-gl') | null = null;
	// A plain registry of MapLibre objects, deliberately not reactive state.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const markers = new Map<string, Marker>();
	let pickMarker: Marker | null = null;
	let fitted = false;

	const located = $derived(sites.filter((s) => s.lat !== null && s.lng !== null));

	onMount(() => {
		let disposed = false;
		void (async () => {
			try {
				lib = await import('maplibre-gl');
				const workerUrl = (await import('maplibre-gl/dist/maplibre-gl-worker.mjs?url')).default;
				lib.setWorkerUrl(workerUrl);
				const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				const style = await chooseStyle(app.config?.mapStyleUrl, dark);
				offline = typeof style !== 'string' && style.name === 'Pollramp offline';
				if (disposed) return;
				const center =
					pick?.lat != null && pick?.lng != null
						? ([pick.lng, pick.lat] as [number, number])
						: (app.config?.defaultCenter ?? [-98.58, 39.83]);
				const instance = new lib.Map({
					container,
					style,
					center,
					zoom: pick?.lat != null ? 16 : (app.config?.defaultZoom ?? 3.5),
					attributionControl: { compact: true },
					cooperativeGestures: false
				});
				instance.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
				instance.on('load', () => {
					if (!disposed) map = instance;
				});
				if (onpick) {
					instance.on('click', (e) => onpick?.(round(e.lngLat.lat), round(e.lngLat.lng)));
					instance.getCanvas().style.cursor = 'crosshair';
				}
			} catch (error) {
				console.error('Map failed to load', error);
				failed = true;
			}
		})();
		return () => {
			disposed = true;
			map?.remove();
			map = null;
		};
	});

	function round(n: number) {
		return Math.round(n * 1e6) / 1e6;
	}

	function markerElement(site: MapSite): HTMLButtonElement {
		const el = document.createElement('button');
		el.type = 'button';
		el.className = `map-marker status s-${site.status}`;
		el.setAttribute('aria-label', `${site.name}: ${STATUS[site.status].label}`);
		el.innerHTML = `<span class="status-glyph" aria-hidden="true">${STATUS[site.status].glyph}</span>`;
		el.addEventListener('click', (event) => {
			event.stopPropagation();
			onselect?.(site.id);
		});
		return el;
	}

	// Keep HTML markers in sync with the site list.
	$effect(() => {
		const current = map;
		if (!current || !lib || onpick) return;
		const ids = new Set(located.map((s) => s.id));
		for (const [id, marker] of markers) {
			if (!ids.has(id)) {
				marker.remove();
				markers.delete(id);
			}
		}
		for (const site of located) {
			markers.get(site.id)?.remove();
			const marker = new lib.Marker({ element: markerElement(site) })
				.setLngLat([site.lng!, site.lat!])
				.addTo(current);
			markers.set(site.id, marker);
		}
		if (!fitted && located.length) {
			fitted = true;
			const bounds = new lib.LngLatBounds();
			for (const s of located) bounds.extend([s.lng!, s.lat!]);
			current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
		}
	});

	$effect(() => {
		for (const [id, marker] of markers)
			marker.getElement().classList.toggle('selected', id === selected);
		const site = located.find((s) => s.id === selected);
		if (map && site)
			map.easeTo({ center: [site.lng!, site.lat!], zoom: Math.max(map.getZoom(), 13) });
	});

	// Location picker marker.
	$effect(() => {
		const current = map;
		if (!current || !lib || !onpick) return;
		if (pick?.lat != null && pick?.lng != null) {
			if (!pickMarker) {
				pickMarker = new lib.Marker({ color: '#c2410c', draggable: true })
					.setLngLat([pick.lng, pick.lat])
					.addTo(current);
				pickMarker.on('dragend', () => {
					const p = pickMarker!.getLngLat();
					onpick?.(round(p.lat), round(p.lng));
				});
			} else {
				pickMarker.setLngLat([pick.lng, pick.lat]);
			}
		}
	});
</script>

<div class="map-wrap" style:height>
	<div class="map" bind:this={container} role="region" aria-label={label}></div>
	{#if failed}
		<div class="map-note">
			The map could not be loaded on this device. The site list still works.
		</div>
	{:else if offline}
		<div class="map-note small">Offline basemap: county boundaries only.</div>
	{/if}
	{#if !onpick}
		<ul class="legend" aria-label="Map legend">
			{#each ['accessible', 'fixable', 'barriers', 'incomplete', 'unsurveyed'] as const as s (s)}
				<li class="status s-{s}">
					<span class="status-glyph" aria-hidden="true">{STATUS[s].glyph}</span>{STATUS[s].short}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.map-wrap {
		position: relative;
		border-radius: var(--radius);
		overflow: hidden;
		border: 1px solid var(--line);
		background: var(--surface-2);
	}
	.map {
		position: absolute;
		inset: 0;
	}
	.map-note {
		position: absolute;
		left: 0.75rem;
		top: 0.75rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.25rem 0.75rem;
		font-weight: 700;
	}
	.legend {
		position: absolute;
		left: 0.75rem;
		bottom: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		list-style: none;
		margin: 0;
		padding: 0.4rem;
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		border-radius: 12px;
		border: 1px solid var(--line);
		max-width: calc(100% - 4rem);
	}
	.legend .status {
		font-size: 0.8rem;
	}
	:global(.map-marker) {
		border: 2px solid var(--surface) !important;
		box-shadow: 0 2px 6px rgb(0 0 0 / 35%);
		padding: 0.15rem !important;
		cursor: pointer;
		font: inherit;
	}
	:global(.map-marker .status-glyph) {
		width: 1.7rem !important;
		height: 1.7rem !important;
		font-size: 0.95rem !important;
	}
	:global(.map-marker.selected) {
		outline: 4px solid var(--focus-ring);
		z-index: 5;
	}
	:global(.maplibregl-ctrl-attrib) {
		font-size: 11px;
	}
</style>
