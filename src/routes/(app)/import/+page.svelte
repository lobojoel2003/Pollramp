<script lang="ts">
	import { parseSitesCsv, type SiteImportRow } from '#lib/csv.ts';
	import { ApiError } from '#lib/client/api.ts';
	import { app } from '#lib/client/store.svelte.ts';

	let text = $state('');
	let fileName = $state('');
	let preview = $state<{ rows: SiteImportRow[]; errors: string[] } | null>(null);
	let result = $state<{ created: number; skipped: number; errors: string[] } | null>(null);
	let error = $state<string | null>(null);
	let busy = $state(false);

	async function onfile(files: FileList | null) {
		const file = files?.[0];
		if (!file) return;
		fileName = file.name;
		text = await file.text();
		preview = parseSitesCsv(text);
		result = null;
		error = null;
	}

	async function upload() {
		busy = true;
		error = null;
		try {
			const res = await fetch('/api/import/sites', {
				method: 'POST',
				headers: { 'Content-Type': 'text/csv' },
				body: text,
				credentials: 'same-origin'
			});
			const body = (await res.json()) as {
				created: number;
				skipped: number;
				errors: string[];
				message?: string;
			};
			if (!res.ok) throw new ApiError(body.message ?? 'Import failed', res.status);
			result = body;
			await app.sync();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Import failed.';
		} finally {
			busy = false;
		}
	}

	const example =
		'name,address,city,state,zip,latitude,longitude,precinct\nOak Hill Elementary School,1200 Example Ave,Richmond,VA,23220,37.5512,-77.4601,204\n';
</script>

<svelte:head><title>Import sites · Pollramp</title></svelte:head>

<div class="container-narrow page stack" style="--gap: 1.5rem">
	<h1>Import polling places</h1>
	<p class="muted">
		Upload the spreadsheet your office already keeps, saved as CSV. Pollramp recognizes common
		column names (name, address, city, state, zip, latitude, longitude, precinct, notes). Sites that
		already exist with the same name and address are skipped, so importing twice is safe.
	</p>

	{#if app.user?.role !== 'admin'}
		<p class="form-error">Only administrators can import sites.</p>
	{:else if !app.online || app.serverReachable === false}
		<p class="form-error">Importing needs a connection to the server.</p>
	{:else}
		<div class="card stack">
			<label class="drop">
				<input type="file" accept=".csv,text/csv" onchange={(e) => onfile(e.currentTarget.files)} />
				<strong>{fileName || 'Choose a CSV file'}</strong>
				<span class="small muted">or drag it here</span>
			</label>
			<details>
				<summary>Example format</summary>
				<pre class="mono">{example}</pre>
			</details>
		</div>
	{/if}

	{#if preview}
		<section class="card stack" aria-labelledby="preview-h">
			<h2 id="preview-h">
				{preview.rows.length} site{preview.rows.length === 1 ? '' : 's'} ready to import
			</h2>
			{#if preview.errors.length}
				<ul class="form-error">
					{#each preview.errors as e (e)}<li>{e}</li>{/each}
				</ul>
			{/if}
			<div class="table-wrap">
				<table class="table">
					<thead>
						<tr>
							<th>Name</th><th>Address</th><th>City</th><th>State</th><th>Location</th><th>
								Precincts
							</th>
						</tr>
					</thead>
					<tbody>
						{#each preview.rows.slice(0, 50) as row (row.line)}
							<tr>
								<td>{row.name}</td>
								<td>{row.address}</td>
								<td>{row.city}</td>
								<td>{row.state}</td>
								<td class="small">
									{row.lat !== null && row.lng !== null ? `${row.lat}, ${row.lng}` : '—'}
								</td>
								<td>{row.precincts.join(', ')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if preview.rows.length > 50}<p class="small muted">
					…and {preview.rows.length - 50} more.
				</p>{/if}
			<button
				class="btn btn-primary btn-lg"
				type="button"
				onclick={upload}
				disabled={busy || preview.rows.length === 0}
			>
				{busy ? 'Importing…' : `Import ${preview.rows.length} sites`}
			</button>
		</section>
	{/if}

	{#if result}
		<p class="form-ok" role="status">
			Imported {result.created} site{result.created === 1 ? '' : 's'}{result.skipped
				? `, skipped ${result.skipped} already in Pollramp`
				: ''}.
			<a href="/">See the map</a>
		</p>
	{/if}
	{#if error}<p class="form-error" role="alert">{error}</p>{/if}
</div>

<style>
	.drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 2rem;
		border: 2px dashed var(--line-strong);
		border-radius: var(--radius);
		cursor: pointer;
		position: relative;
	}
	.drop:hover,
	.drop:focus-within {
		border-color: var(--brand);
	}
	.drop input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	pre {
		white-space: pre-wrap;
		background: var(--surface-2);
		padding: 0.75rem;
		border-radius: var(--radius-sm);
	}
</style>
