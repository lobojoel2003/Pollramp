<script lang="ts">
	import { goto } from '$app/navigation';
	import SiteMap from '#lib/components/SiteMap.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { STATUS, STATUS_ORDER } from '#lib/checklist/status.ts';
	import type { SiteStatus } from '#lib/checklist/types.ts';
	import { app } from '#lib/client/store.svelte.ts';

	let query = $state('');
	let filter = $state<SiteStatus | 'all'>('all');
	let selected = $state<string | null>(null);

	const rows = $derived(
		app.activeSites.map((site) => {
			const latest = app.latestSubmitted(site.id);
			return { site, status: app.statusOf(site.id), surveyedAt: latest?.submittedAt ?? null };
		})
	);

	const counts = $derived(
		Object.fromEntries(
			STATUS_ORDER.map((s) => [s, rows.filter((r) => r.status === s).length])
		) as Record<SiteStatus, number>
	);

	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return rows
			.filter((r) => filter === 'all' || r.status === filter)
			.filter(
				(r) =>
					!q ||
					[r.site.name, r.site.address, r.site.city, r.site.postalCode, ...r.site.precincts].some(
						(v) => v.toLowerCase().includes(q)
					)
			)
			.sort(
				(a, b) =>
					STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
					a.site.name.localeCompare(b.site.name)
			);
	});

	const mapSites = $derived(
		visible.map((r) => ({
			id: r.site.id,
			name: r.site.name,
			lat: r.site.lat,
			lng: r.site.lng,
			status: r.status
		}))
	);

	const tiles: { key: SiteStatus | 'all'; label: string }[] = [
		{ key: 'all', label: 'All sites' },
		{ key: 'accessible', label: STATUS.accessible.short },
		{ key: 'fixable', label: STATUS.fixable.short },
		{ key: 'barriers', label: STATUS.barriers.short },
		{ key: 'incomplete', label: STATUS.incomplete.short },
		{ key: 'unsurveyed', label: STATUS.unsurveyed.short }
	];

	function fmtDate(iso: string | null) {
		return iso
			? new Date(iso).toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			: null;
	}
</script>

<svelte:head>
	<title>Sites · Pollramp</title>
</svelte:head>

<div class="container page stack" style="--gap: 1.5rem">
	<div class="spread">
		<div>
			<h1>Polling places</h1>
			<p class="muted">
				{rows.length} site{rows.length === 1 ? '' : 's'}{app.config?.officeName
					? ` · ${app.config.officeName}`
					: ''}
			</p>
		</div>
		<div class="cluster">
			{#if app.user?.role === 'admin'}<a class="btn" href="/import">Import CSV</a>{/if}
			{#if app.user?.role !== 'viewer'}<a class="btn btn-primary" href="/sites/new">
					Add a site
				</a>{/if}
		</div>
	</div>

	<div class="tiles" role="group" aria-label="Filter by status">
		{#each tiles as tile (tile.key)}
			<button
				type="button"
				class="tile s-{tile.key === 'all' ? 'na' : tile.key}"
				aria-pressed={filter === tile.key}
				onclick={() => (filter = filter === tile.key && tile.key !== 'all' ? 'all' : tile.key)}
			>
				<span class="tile-n">{tile.key === 'all' ? rows.length : counts[tile.key]}</span>
				<span class="tile-label">
					{#if tile.key !== 'all'}<span class="status-glyph" aria-hidden="true">
							{STATUS[tile.key].glyph}
						</span>{/if}
					{tile.label}
				</span>
			</button>
		{/each}
	</div>

	{#if rows.length === 0}
		<div class="card empty stack">
			<h2>Add your first polling place</h2>
			<p class="muted">
				Add sites one by one, or import the spreadsheet your office already keeps (name, address,
				city, state, ZIP, latitude, longitude, precinct).
			</p>
			<div class="cluster">
				{#if app.user?.role !== 'viewer'}<a class="btn btn-primary" href="/sites/new">
						Add a site
					</a>{/if}
				{#if app.user?.role === 'admin'}<a class="btn" href="/import">Import a CSV</a>{/if}
			</div>
		</div>
	{:else}
		<div class="split">
			<div class="map-col">
				<SiteMap
					sites={mapSites}
					{selected}
					onselect={(id: string) => (selected = id)}
					height="min(70vh, 640px)"
				/>
			</div>
			<div class="list-col stack" style="--gap: .75rem">
				<label class="visually-hidden" for="search">Search sites</label>
				<input
					id="search"
					type="search"
					placeholder="Search name, address, ZIP or precinct"
					bind:value={query}
				/>
				<p class="small muted" aria-live="polite">
					Showing {visible.length} of {rows.length}{filter !== 'all'
						? ` · ${STATUS[filter].label}`
						: ''}
				</p>
				<ul class="sites">
					{#each visible as { site, status, surveyedAt } (site.id)}
						<li>
							<a
								class="site card-flat"
								class:active={selected === site.id}
								href={`/sites/${site.id}`}
								onmouseenter={() => (selected = site.id)}
								onfocus={() => (selected = site.id)}
							>
								<span class="stack" style="--gap: .25rem">
									<strong>{site.name}</strong>
									<span class="small muted">
										{[site.address, site.city].filter(Boolean).join(', ') || 'No address'}
									</span>
									<span class="cluster" style="--gap: .35rem">
										<StatusBadge {status} short />
										{#if site.precincts.length}<span class="tag">
												Precinct {site.precincts.join(', ')}
											</span>{/if}
										{#if site.published}<span class="tag">Published</span>{/if}
										{#if site.dirty}<span class="tag">Not synced</span>{/if}
									</span>
								</span>
								<span class="small muted when">{fmtDate(surveyedAt) ?? ''}</span>
							</a>
						</li>
					{:else}
						<li class="muted">No sites match.</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<svelte:window
	onkeydown={(e: KeyboardEvent) => {
		if (e.key === 'Enter' && selected && document.activeElement === document.body)
			void goto(`/sites/${selected}`);
	}}
/>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
	}
	.tile {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;
		padding: 0.9rem 1rem;
		border-radius: var(--radius);
		border: 1.5px solid var(--line);
		border-left: 6px solid var(--s);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
		text-align: left;
	}
	.tile[aria-pressed='true'] {
		background: var(--s-soft);
		border-color: var(--s);
	}
	.tile-n {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.tile-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 700;
		color: var(--s);
	}
	.tile .status-glyph {
		width: 1.15rem;
		height: 1.15rem;
		font-size: 0.7rem;
	}
	.split {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}
	.map-col {
		position: sticky;
		top: 80px;
	}
	.sites {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
		max-height: calc(70vh - 4rem);
		overflow: auto;
		padding-right: 0.25rem;
	}
	.site {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		color: var(--ink);
		text-decoration: none;
	}
	.site:hover,
	.site.active {
		border-color: var(--brand);
		box-shadow: var(--shadow);
	}
	.when {
		white-space: nowrap;
	}
	.empty {
		text-align: left;
		padding: 2rem;
	}
	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
		}
		.map-col {
			position: static;
		}
		.sites {
			max-height: none;
		}
	}
</style>
