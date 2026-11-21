<script lang="ts">
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const site = $derived(data.site);

	const SUMMARY: Record<string, string> = {
		accessible:
			'This polling place meets the accessibility checks for parking, the route to the entrance, the entrance, and the voting area.',
		fixable:
			'This polling place will be accessible on election day. Temporary measures such as portable ramps, signs or a doorbell will be in place.',
		barriers:
			'Some barriers remain at this polling place. Contact the election office before you go to ask about other options, such as curbside voting or another location.',
		incomplete:
			'This polling place has not been fully surveyed yet. Contact the election office with any accessibility questions.',
		unsurveyed:
			'This polling place has not been surveyed yet. Contact the election office with any accessibility questions.'
	};

	const STATE_LABEL = {
		available: 'Available',
		'election-day': 'On election day',
		limited: 'Limited'
	} as const;

	const directions = $derived(
		site.lat !== null && site.lng !== null
			? `https://www.openstreetmap.org/?mlat=${site.lat}&mlon=${site.lng}#map=18/${site.lat}/${site.lng}`
			: `https://www.openstreetmap.org/search?query=${encodeURIComponent([site.address, site.city, site.state, site.postalCode].filter(Boolean).join(', '))}`
	);

	const surveyed = $derived(
		data.surveyedOn
			? new Date(data.surveyedOn).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: null
	);
</script>

<svelte:head>
	<title>{site.name} · Polling place accessibility</title>
	<meta
		name="description"
		content={`Accessibility at ${site.name}: parking, entrance, route and voting equipment.`}
	/>
</svelte:head>

<article class="stack voter" style="--gap: 1.5rem">
	<nav aria-label="Breadcrumb" class="small"><a href="/p">All polling places</a></nav>

	<header class="stack" style="--gap: .5rem">
		<h1>{site.name}</h1>
		<p class="address">
			{site.address}{site.city ? `, ${site.city}` : ''}{site.state ? `, ${site.state}` : ''}
			{site.postalCode}
		</p>
		{#if site.precincts.length}
			<p class="muted">
				Precinct{site.precincts.length > 1 ? 's' : ''}
				{site.precincts.join(', ')}
			</p>
		{/if}
		<div class="cluster">
			<StatusBadge status={site.status} public />
			<a class="btn" href={directions} rel="noopener">Directions</a>
		</div>
	</header>

	<section class="summary card s-{site.status}" aria-labelledby="summary-h">
		<h2 id="summary-h" class="visually-hidden">Summary</h2>
		<p>{SUMMARY[site.status]}</p>
		{#if surveyed}<p class="small muted">Last surveyed {surveyed}.</p>{/if}
	</section>

	{#if site.voterInfo.accessibleEntrance || site.hasPhoto}
		<section class="card entrance" aria-labelledby="entrance-h">
			<div class="stack" style="--gap: .5rem">
				<h2 id="entrance-h">Accessible entrance</h2>
				{#if site.voterInfo.accessibleEntrance}<p class="big">
						{site.voterInfo.accessibleEntrance}
					</p>{/if}
			</div>
			{#if site.hasPhoto}
				<img
					src={`/p/${site.slug}/photo`}
					alt={`Accessible entrance at ${site.name}`}
					loading="lazy"
				/>
			{/if}
		</section>
	{/if}

	{#if site.voterInfo.parking}
		<section class="card" aria-labelledby="parking-h">
			<h2 id="parking-h">Parking</h2>
			<p class="big">{site.voterInfo.parking}</p>
		</section>
	{/if}

	{#each data.sections as section (section.title)}
		<section class="stack" style="--gap: .75rem" aria-labelledby={`sec-${section.id}`}>
			<h2 id={`sec-${section.id}`}>{section.title}</h2>
			<ul class="features">
				{#each section.features as feature (feature.item)}
					<li class="feature f-{feature.state}">
						<span class="mark" aria-hidden="true">
							{feature.state === 'available' ? '✓' : feature.state === 'election-day' ? '!' : '✕'}
						</span>
						<span class="stack" style="--gap: .1rem">
							<strong>{feature.label}</strong>
							<span>{feature.text}</span>
						</span>
						<span class="state">{STATE_LABEL[feature.state]}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	{#if site.voterInfo.notes}
		<section class="card" aria-labelledby="notes-h">
			<h2 id="notes-h">Good to know</h2>
			<p>{site.voterInfo.notes}</p>
		</section>
	{/if}

	<section class="card help" aria-labelledby="help-h">
		<h2 id="help-h">Getting help when you vote</h2>
		<ul>
			<li>
				Every polling place has an accessible voting system with audio, large print and tactile
				controls. Ask a poll worker to set it up.
			</li>
			<li>
				You can bring someone to help you vote, as long as it is not your employer or union
				representative (Voting Rights Act, Section 208).
			</li>
			<li>
				If you have trouble getting in, ask a poll worker for help. You can also report a problem to
				the election office.
			</li>
		</ul>
		{#if site.voterInfo.contact}
			<p class="big"><strong>Questions about accessibility?</strong> {site.voterInfo.contact}</p>
		{/if}
	</section>
</article>

<style>
	.voter {
		max-width: 760px;
	}
	.address {
		font-size: 1.15rem;
		margin: 0;
	}
	.big {
		font-size: 1.15rem;
	}
	.summary {
		border-left: 8px solid var(--s);
		background: var(--s-soft);
		box-shadow: none;
		font-size: 1.1rem;
	}
	.entrance {
		display: grid;
		gap: 1rem;
	}
	.entrance img {
		width: 100%;
		max-height: 420px;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}
	.features {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.feature {
		--f: var(--pass);
		--f-soft: var(--pass-soft);
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.85rem;
		align-items: start;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		padding: 0.85rem 1rem;
	}
	.f-election-day {
		--f: var(--fix);
		--f-soft: var(--fix-soft);
	}
	.f-limited {
		--f: var(--fail);
		--f-soft: var(--fail-soft);
	}
	.mark {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--f);
		color: var(--surface);
		font-weight: 700;
	}
	.state {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--f);
		background: var(--f-soft);
		border-radius: 999px;
		padding: 0.15rem 0.6rem;
		white-space: nowrap;
	}
	.help ul {
		padding-left: 1.2rem;
	}
	.help li {
		margin-bottom: 0.4rem;
	}
	@media (max-width: 520px) {
		.feature {
			grid-template-columns: auto 1fr;
		}
		.state {
			grid-column: 2;
			justify-self: start;
		}
	}
</style>
