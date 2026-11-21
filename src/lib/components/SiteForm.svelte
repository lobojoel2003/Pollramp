<script lang="ts">
	import { untrack } from 'svelte';
	import SiteMap from './SiteMap.svelte';
	import { US_STATES, type Site } from '../model.ts';
	import { app } from '../client/store.svelte.ts';

	interface Props {
		site?: Site;
		onsaved: (site: Site) => void;
		oncancel: () => void;
	}
	let { site, onsaved, oncancel }: Props = $props();

	// Form fields are initialized once from the site being edited.
	const initial = untrack(() => site);
	let name = $state(initial?.name ?? '');
	let address = $state(initial?.address ?? '');
	let city = $state(initial?.city ?? '');
	let stateCode = $state(initial?.state || app.config?.defaultState || '');
	let postalCode = $state(initial?.postalCode ?? '');
	let precincts = $state(initial?.precincts.join(', ') ?? '');
	let notes = $state(initial?.notes ?? '');
	let lat = $state<number | null>(initial?.lat ?? null);
	let lng = $state<number | null>(initial?.lng ?? null);
	let error = $state<string | null>(null);
	let locating = $state(false);
	let busy = $state(false);

	function useMyLocation() {
		if (!('geolocation' in navigator)) {
			error = 'This device cannot share its location.';
			return;
		}
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
				lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
				locating = false;
			},
			(e) => {
				error = `Could not get your location: ${e.message}`;
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 15000 }
		);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		if (!name.trim()) {
			error = 'Give the site a name.';
			return;
		}
		busy = true;
		try {
			const saved = await app.saveSite({
				...(site ?? {}),
				name: name.trim(),
				address: address.trim(),
				city: city.trim(),
				state: stateCode,
				postalCode: postalCode.trim(),
				precincts: precincts
					.split(/[,;]/)
					.map((p) => p.trim())
					.filter(Boolean),
				notes: notes.trim(),
				lat,
				lng
			});
			onsaved(saved);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not save the site.';
		} finally {
			busy = false;
		}
	}
</script>

<form class="stack" style="--gap: 1.25rem" onsubmit={submit}>
	<div class="card stack">
		<h2>Site details</h2>
		<div class="field">
			<label for="name">Name</label>
			<input id="name" bind:value={name} required placeholder="Oak Hill Elementary School" />
		</div>
		<div class="field">
			<label for="address">Street address</label>
			<input id="address" bind:value={address} autocomplete="street-address" />
		</div>
		<div class="grid-auto" style="--min: 180px">
			<div class="field">
				<label for="city">City</label>
				<input id="city" bind:value={city} autocomplete="address-level2" />
			</div>
			<div class="field">
				<label for="state">State</label>
				<select id="state" bind:value={stateCode} aria-describedby="state-hint">
					<option value="">—</option>
					{#each US_STATES as [code, label] (code)}<option value={code}>{label}</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="zip">ZIP code</label>
				<input id="zip" bind:value={postalCode} inputmode="numeric" autocomplete="postal-code" />
			</div>
		</div>
		<p id="state-hint" class="hint">
			The state picks the checklist overlay (for example, California or Florida rules).
		</p>
		<div class="field">
			<label for="precincts">Precincts</label>
			<input
				id="precincts"
				bind:value={precincts}
				placeholder="101, 102"
				aria-describedby="precinct-hint"
			/>
			<span id="precinct-hint" class="hint">Separate several precincts with commas.</span>
		</div>
		<div class="field">
			<label for="notes">Internal notes</label>
			<textarea
				id="notes"
				bind:value={notes}
				placeholder="Facility contact, key holder, access hours…"></textarea>
		</div>
	</div>

	<div class="card stack">
		<div class="spread">
			<h2>Location</h2>
			<button type="button" class="btn" onclick={useMyLocation} disabled={locating}>
				{locating ? 'Locating…' : 'Use my location'}
			</button>
		</div>
		<p class="hint">
			Tap the map to place the site, or drag the pin. Standing at the entrance? Use your location.
		</p>
		<SiteMap
			sites={[]}
			pick={{ lat, lng }}
			onpick={(a: number, b: number) => {
				lat = a;
				lng = b;
			}}
			height="320px"
			label="Pick the site location"
		/>
		<div class="grid-auto" style="--min: 180px">
			<div class="field">
				<label for="lat">Latitude</label>
				<input id="lat" type="number" step="any" min="-90" max="90" bind:value={lat} />
			</div>
			<div class="field">
				<label for="lng">Longitude</label>
				<input id="lng" type="number" step="any" min="-180" max="180" bind:value={lng} />
			</div>
		</div>
	</div>

	{#if error}<p class="form-error" role="alert">{error}</p>{/if}
	<div class="cluster">
		<button class="btn btn-primary btn-lg" type="submit" disabled={busy}>
			{site ? 'Save changes' : 'Add site'}
		</button>
		<button class="btn btn-lg btn-ghost" type="button" onclick={oncancel}>Cancel</button>
	</div>
</form>
