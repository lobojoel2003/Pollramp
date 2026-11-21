<script lang="ts">
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const byCity = $derived(
		Object.entries(
			data.sites.reduce<Record<string, typeof data.sites>>((acc, site) => {
				const key = [site.city, site.state].filter(Boolean).join(', ') || 'Other';
				(acc[key] ??= []).push(site);
				return acc;
			}, {})
		).sort(([a], [b]) => a.localeCompare(b))
	);
</script>

<svelte:head>
	<title>Find your polling place · Accessibility</title>
	<meta
		name="description"
		content="Accessibility information for polling places: parking, entrances, ramps and voting equipment."
	/>
</svelte:head>

<div class="stack" style="--gap: 1.5rem">
	<section class="hero">
		<h1>Is my polling place accessible?</h1>
		<p class="lead">
			Find parking, the accessible entrance, ramps, and voting equipment at your polling place
			before you go.
		</p>
		<form method="GET" role="search" class="search">
			<label for="q" class="visually-hidden">Search by name, address, ZIP or precinct</label>
			<input
				id="q"
				name="q"
				type="search"
				value={data.q}
				placeholder="Name, address, ZIP code or precinct"
			/>
			<button class="btn btn-primary" type="submit">Search</button>
		</form>
	</section>

	{#if data.sites.length === 0}
		<div class="card">
			<h2>No polling places found</h2>
			<p>
				{data.q
					? `Nothing matches “${data.q}”. Try a ZIP code or the name of the building.`
					: 'No polling places have been published yet.'}
			</p>
		</div>
	{:else}
		<p class="muted" aria-live="polite">
			{data.sites.length} polling place{data.sites.length === 1 ? '' : 's'}{data.q
				? ` matching “${data.q}”`
				: ''}
		</p>
		{#each byCity as [city, sites] (city)}
			<section class="stack" style="--gap: .75rem">
				<h2>{city}</h2>
				<ul class="sites">
					{#each sites as site (site.slug)}
						<li>
							<a class="site card-flat" href={`/p/${site.slug}`}>
								<span class="stack" style="--gap: .2rem">
									<strong class="name">{site.name}</strong>
									<span class="muted small">
										{site.address}{site.postalCode ? ` · ${site.postalCode}` : ''}
									</span>
									{#if site.precincts.length}
										<span class="muted small">Precinct {site.precincts.join(', ')}</span>
									{/if}
								</span>
								<StatusBadge status={site.status} public />
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</div>

<style>
	.hero {
		background: linear-gradient(135deg, var(--brand) 0%, #0a4a44 100%);
		color: #fff;
		border-radius: calc(var(--radius) + 6px);
		padding: clamp(1.5rem, 4vw, 3rem);
	}
	.hero h1 {
		color: #fff;
	}
	.lead {
		font-size: 1.15rem;
		max-width: 46ch;
		opacity: 0.95;
	}
	.search {
		display: flex;
		gap: 0.5rem;
		max-width: 640px;
		margin-top: 1rem;
	}
	.search input {
		border-color: transparent;
	}
	.search .btn-primary {
		--btn-bg: #fff;
		--btn-ink: var(--brand);
		--btn-line: #fff;
	}
	.sites {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}
	.site {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		color: var(--ink);
		text-decoration: none;
		height: 100%;
	}
	.site:hover {
		border-color: var(--brand);
	}
	.name {
		font-size: 1.1rem;
	}
</style>
